const crypto = require("node:crypto");

const COOKIE_NAME = "school_session";
const SESSION_ISSUER = "mern-school-management-system";
const DEFAULT_TTL_SECONDS = 60 * 60;
const MIN_TTL_SECONDS = 5 * 60;
const MAX_TTL_SECONDS = 24 * 60 * 60;
const ALLOWED_ROLES = new Set(["Admin", "Teacher", "Student"]);
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

function getCookieSettings(env = process.env, maxAge = DEFAULT_TTL_SECONDS) {
    const sameSite = String(env.AUTH_COOKIE_SAME_SITE || "lax").toLowerCase();

    if (!["lax", "strict", "none"].includes(sameSite)) {
        throw new Error("AUTH_COOKIE_SAME_SITE must be lax, strict, or none");
    }

    const secure = env.NODE_ENV === "production" ||
        String(env.AUTH_COOKIE_SECURE || "").toLowerCase() === "true" ||
        sameSite === "none";

    return {
        cookieName: COOKIE_NAME,
        sameSite,
        secure,
        maxAge,
    };
}

function getSessionConfig(env = process.env) {
    const secret = env.AUTH_SESSION_SECRET;

    if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
        throw new Error("AUTH_SESSION_SECRET must contain at least 32 bytes");
    }

    const configuredTtl = env.AUTH_SESSION_TTL_SECONDS === undefined
        ? DEFAULT_TTL_SECONDS
        : Number(env.AUTH_SESSION_TTL_SECONDS);

    if (
        !Number.isSafeInteger(configuredTtl) ||
        configuredTtl < MIN_TTL_SECONDS ||
        configuredTtl > MAX_TTL_SECONDS
    ) {
        throw new Error(
            `AUTH_SESSION_TTL_SECONDS must be an integer between ${MIN_TTL_SECONDS} and ${MAX_TTL_SECONDS}`
        );
    }

    return {
        secret,
        ttlSeconds: configuredTtl,
        issuer: SESSION_ISSUER,
        ...getCookieSettings(env, configuredTtl),
    };
}

function createSessionToken({ userId, role }, options = {}) {
    const config = options.config || getSessionConfig(options.env);
    const normalizedUserId = String(userId || "");

    if (!OBJECT_ID_PATTERN.test(normalizedUserId)) {
        throw new TypeError("A valid user id is required to create a session");
    }

    if (!ALLOWED_ROLES.has(role)) {
        throw new TypeError("A supported user role is required to create a session");
    }

    const nowSeconds = options.nowSeconds === undefined
        ? Math.floor(Date.now() / 1000)
        : options.nowSeconds;

    if (!Number.isSafeInteger(nowSeconds) || nowSeconds < 0) {
        throw new TypeError("A valid session creation time is required");
    }

    const payload = {
        version: 1,
        sub: normalizedUserId,
        role,
        iat: nowSeconds,
        exp: nowSeconds + config.ttlSeconds,
        iss: config.issuer,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", config.secret)
        .update(encodedPayload)
        .digest("base64url");

    return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token, options = {}) {
    const config = options.config || getSessionConfig(options.env);

    if (typeof token !== "string") {
        throw new TypeError("Invalid session token");
    }

    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new TypeError("Invalid session token");
    }

    const [encodedPayload, providedSignature] = parts;
    const expectedSignature = crypto
        .createHmac("sha256", config.secret)
        .update(encodedPayload)
        .digest();

    let receivedSignature;
    try {
        receivedSignature = Buffer.from(providedSignature, "base64url");
    } catch {
        throw new TypeError("Invalid session token");
    }

    if (
        receivedSignature.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(receivedSignature, expectedSignature)
    ) {
        throw new TypeError("Invalid session token");
    }

    let payload;
    try {
        payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    } catch {
        throw new TypeError("Invalid session token");
    }

    const nowSeconds = options.nowSeconds === undefined
        ? Math.floor(Date.now() / 1000)
        : options.nowSeconds;

    if (
        !payload ||
        payload.version !== 1 ||
        !OBJECT_ID_PATTERN.test(String(payload.sub || "")) ||
        !ALLOWED_ROLES.has(payload.role) ||
        payload.iss !== config.issuer ||
        !Number.isSafeInteger(payload.iat) ||
        !Number.isSafeInteger(payload.exp) ||
        payload.iat > nowSeconds + 60 ||
        payload.exp <= nowSeconds ||
        payload.exp <= payload.iat ||
        payload.exp - payload.iat > MAX_TTL_SECONDS
    ) {
        throw new TypeError("Expired or invalid session token");
    }

    return {
        userId: payload.sub,
        role: payload.role,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
    };
}

function appendSetCookie(res, cookieValue) {
    const existing = res.getHeader("Set-Cookie");
    const cookies = existing === undefined
        ? []
        : Array.isArray(existing) ? existing : [existing];

    res.setHeader("Set-Cookie", [...cookies, cookieValue]);
}

function setSessionCookie(res, token, config = getSessionConfig()) {
    const attributes = [
        `${config.cookieName}=${encodeURIComponent(token)}`,
        "Path=/",
        "HttpOnly",
        `SameSite=${config.sameSite.charAt(0).toUpperCase()}${config.sameSite.slice(1)}`,
        `Max-Age=${config.maxAge}`,
    ];

    if (config.secure) attributes.push("Secure");
    appendSetCookie(res, attributes.join("; "));
}

function clearSessionCookie(res, env = process.env) {
    const settings = getCookieSettings(env, 0);
    const attributes = [
        `${settings.cookieName}=`,
        "Path=/",
        "HttpOnly",
        `SameSite=${settings.sameSite.charAt(0).toUpperCase()}${settings.sameSite.slice(1)}`,
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ];

    if (settings.secure) attributes.push("Secure");
    appendSetCookie(res, attributes.join("; "));
}

function readSessionCookie(req) {
    const cookieHeader = req && req.headers && req.headers.cookie;
    if (typeof cookieHeader !== "string" || cookieHeader.length === 0) return null;

    for (const cookiePart of cookieHeader.split(";")) {
        const separatorIndex = cookiePart.indexOf("=");
        if (separatorIndex < 0) continue;

        const name = cookiePart.slice(0, separatorIndex).trim();
        if (name !== COOKIE_NAME) continue;

        const rawValue = cookiePart.slice(separatorIndex + 1).trim();
        try {
            return decodeURIComponent(rawValue);
        } catch {
            return rawValue;
        }
    }

    return null;
}

module.exports = {
    COOKIE_NAME,
    getCookieSettings,
    getSessionConfig,
    createSessionToken,
    verifySessionToken,
    setSessionCookie,
    clearSessionCookie,
    readSessionCookie,
};
