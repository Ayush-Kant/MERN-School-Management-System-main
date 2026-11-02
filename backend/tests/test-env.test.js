const test = require("node:test");
const assert = require("node:assert/strict");

test("backend tests run with an isolated test environment", () => {
    assert.equal(process.env.NODE_ENV, "test");
    assert.equal(
        process.env.MONGO_URL,
        "mongodb://127.0.0.1:27017/school_management_test"
    );
    assert.equal(process.env.FRONTEND_URLS, "http://localhost:3000");
    assert.match(process.env.AUTH_SESSION_SECRET || "", /^unit-test-only-/);
    assert.equal(process.env.AUTH_SESSION_TTL_SECONDS, "3600");
    assert.equal(process.env.AUTH_COOKIE_SAME_SITE, "lax");
    assert.equal(process.env.AUTH_COOKIE_SECURE, "false");
});
