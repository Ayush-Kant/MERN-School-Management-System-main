const test = require("node:test");
const assert = require("node:assert/strict");
const {
    COOKIE_NAME,
    createSessionToken,
    verifySessionToken,
    setSessionCookie,
    clearSessionCookie,
    readSessionCookie,
} = require("../utils/authSession.js");

const config = {
    secret: "0123456789abcdef0123456789abcdef0123456789abcdef",
    ttlSeconds: 3600,
    issuer: "mern-school-management-system",
    cookieName: COOKIE_NAME,
    sameSite: "lax",
    secure: false,
    maxAge: 3600,
};
const USER_ID = "0123456789abcdef01234567";

test("creates and verifies a signed Admin session", () => {
    const token = createSessionToken(
        { userId: USER_ID, role: "Admin" },
        { config, nowSeconds: 1_800_000_000 }
    );

    assert.deepEqual(
        verifySessionToken(token, { config, nowSeconds: 1_800_000_100 }),
        {
            userId: USER_ID,
            role: "Admin",
            issuedAt: 1_800_000_000,
            expiresAt: 1_800_003_600,
        }
    );
});

test("rejects a token whose signature has been modified", () => {
    const token = createSessionToken(
        { userId: USER_ID, role: "Admin" },
        { config, nowSeconds: 1_800_000_000 }
    );
    const changedToken = `${token.slice(0, -1)}x`;

    assert.throws(
        () => verifySessionToken(changedToken, { config, nowSeconds: 1_800_000_001 }),
        /Invalid session token/
    );
});

test("rejects a token signed with a different secret", () => {
    const token = createSessionToken(
        { userId: USER_ID, role: "Admin" },
        { config, nowSeconds: 1_800_000_000 }
    );

    assert.throws(
        () => verifySessionToken(token, {
            config: { ...config, secret: "abcdef0123456789abcdef0123456789abcdef0123456789" },
            nowSeconds: 1_800_000_001,
        }),
        /Invalid session token/
    );
});

test("rejects expired sessions", () => {
    const token = createSessionToken(
        { userId: USER_ID, role: "Admin" },
        { config, nowSeconds: 1_800_000_000 }
    );

    assert.throws(
        () => verifySessionToken(token, { config, nowSeconds: 1_800_003_600 }),
        /Expired or invalid/
    );
});

test("rejects unsupported roles and malformed user ids", () => {
    assert.throws(
        () => createSessionToken({ userId: USER_ID, role: "SuperAdmin" }, { config }),
        /supported user role/
    );
    assert.throws(
        () => createSessionToken({ userId: "123", role: "Admin" }, { config }),
        /valid user id/
    );
});

test("requires a sufficiently long session secret and bounded expiry", () => {
    assert.throws(
        () => require("../utils/authSession.js").getSessionConfig({ AUTH_SESSION_SECRET: "short" }),
        /at least 32 bytes/
    );
    assert.throws(
        () => require("../utils/authSession.js").getSessionConfig({
            AUTH_SESSION_SECRET: config.secret,
            AUTH_SESSION_TTL_SECONDS: "30",
        }),
        /between/
    );
});

test("sets an HttpOnly session cookie with SameSite and configured expiry", () => {
    const headers = {};
    const response = {
        getHeader(name) { return headers[name]; },
        setHeader(name, value) { headers[name] = value; },
    };

    setSessionCookie(response, "signed.token", config);

    assert.equal(headers["Set-Cookie"].length, 1);
    assert.match(headers["Set-Cookie"][0], /^school_session=signed.token;/);
    assert.match(headers["Set-Cookie"][0], /HttpOnly/);
    assert.match(headers["Set-Cookie"][0], /SameSite=Lax/);
    assert.match(headers["Set-Cookie"][0], /Max-Age=3600/);
    assert.doesNotMatch(headers["Set-Cookie"][0], /Secure/);
});

test("marks production session cookies Secure", () => {
    const secureConfig = {
        ...config,
        ...require("../utils/authSession.js").getCookieSettings(
            { NODE_ENV: "production", AUTH_COOKIE_SAME_SITE: "lax" },
            3600
        ),
    };
    const headers = {};
    const response = {
        getHeader(name) { return headers[name]; },
        setHeader(name, value) { headers[name] = value; },
    };

    setSessionCookie(response, "signed.token", secureConfig);

    assert.match(headers["Set-Cookie"][0], /Secure/);
});

test("clears the session cookie using the same path and security attributes", () => {
    const headers = {};
    const response = {
        getHeader(name) { return headers[name]; },
        setHeader(name, value) { headers[name] = value; },
    };

    clearSessionCookie(response, { NODE_ENV: "production", AUTH_COOKIE_SAME_SITE: "lax" });

    assert.match(headers["Set-Cookie"][0], /^school_session=;/);
    assert.match(headers["Set-Cookie"][0], /HttpOnly/);
    assert.match(headers["Set-Cookie"][0], /Max-Age=0/);
    assert.match(headers["Set-Cookie"][0], /Secure/);
});

test("reads the signed session cookie without confusing similarly named cookies", () => {
    const token = "signed.token";
    const req = {
        headers: {
            cookie: `other=value; school_session=${encodeURIComponent(token)}; school_session_extra=ignore`,
        },
    };

    assert.equal(readSessionCookie(req), token);
    assert.equal(readSessionCookie({ headers: { cookie: "other=value" } }), null);
});

test("appends the session cookie without replacing existing Set-Cookie headers", () => {
    const headers = { "Set-Cookie": ["existing=value; Path=/"] };
    const response = {
        getHeader(name) { return headers[name]; },
        setHeader(name, value) { headers[name] = value; },
    };

    setSessionCookie(response, "signed.token", config);

    assert.equal(headers["Set-Cookie"].length, 2);
    assert.match(headers["Set-Cookie"][0], /^existing=value/);
});

