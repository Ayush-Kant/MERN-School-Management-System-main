const test = require("node:test");
const assert = require("node:assert/strict");
const {
    COOKIE_NAME,
    createSessionToken,
    verifySessionToken,
} = require("../utils/authSession.js");
const {
    createAuthenticateSession,
} = require("../middleware/authenticateSession.js");

const config = {
    secret: "0123456789abcdef0123456789abcdef0123456789abcdef",
    ttlSeconds: 3600,
    issuer: "mern-school-management-system",
    cookieName: COOKIE_NAME,
    sameSite: "lax",
    secure: false,
    maxAge: 3600,
};
const userId = "0123456789abcdef01234567";

function createResponse() {
    return {
        statusCode: null,
        body: null,
        headers: {},
        getHeader(name) {
            return this.headers[name];
        },
        setHeader(name, value) {
            this.headers[name] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

test("rejects requests without a session cookie", () => {
    const middleware = createAuthenticateSession({
        getConfig: () => config,
        verifyToken: verifySessionToken,
    });
    const response = createResponse();
    let nextCalled = false;

    middleware({ headers: {} }, response, () => {
        nextCalled = true;
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: "Authentication required" });
    assert.equal(nextCalled, false);
});

test("attaches verified session claims to the request", () => {
    const middleware = createAuthenticateSession({
        getConfig: () => config,
        verifyToken: (token, options) => verifySessionToken(token, {
            ...options,
            nowSeconds: 1_800_000_100,
        }),
    });
    const token = createSessionToken(
        { userId, role: "Admin" },
        { config, nowSeconds: 1_800_000_000 }
    );
    const req = {
        headers: { cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}` },
    };
    const response = createResponse();
    let nextCalled = false;

    middleware(req, response, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.deepEqual(req.auth, {
        userId,
        role: "Admin",
        issuedAt: 1_800_000_000,
        expiresAt: 1_800_003_600,
    });
    assert.equal(response.statusCode, null);
});

test("rejects invalid or expired session cookies", () => {
    const middleware = createAuthenticateSession({
        getConfig: () => config,
        verifyToken: verifySessionToken,
    });
    const response = createResponse();
    let nextCalled = false;

    middleware({
        headers: { cookie: `${COOKIE_NAME}=not-a-valid-token` },
    }, response, () => {
        nextCalled = true;
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: "Session is invalid or expired" });
    assert.match(response.headers["Set-Cookie"][0], /Max-Age=0/);
    assert.equal(nextCalled, false);
});

test("fails closed when server session configuration is missing", () => {
    const middleware = createAuthenticateSession({
        getConfig: () => {
            throw new Error("missing secret");
        },
    });
    const response = createResponse();

    middleware({ headers: {} }, response, () => {
        assert.fail("next must not run when session configuration is missing");
    });

    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.body, {
        message: "Authentication is not configured on this server",
    });
});
