const test = require("node:test");
const assert = require("node:assert/strict");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const USER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

function makeResponse() {
    return {
        statusCode: 200,
        body: undefined,
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

test("rejects requests without verified session claims", () => {
    const middleware = authorizeRoles("Teacher");
    const res = makeResponse();
    let nextCalled = false;

    middleware({ body: { role: "Teacher", teacherId: USER_ID } }, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("rejects malformed or unsupported session actors", () => {
    const middleware = authorizeRoles("Teacher");
    const invalidActors = [
        { userId: "not-an-object-id", role: "Teacher" },
        { userId: USER_ID, role: "SuperAdmin" },
        { role: "Teacher" },
        null,
    ];

    for (const auth of invalidActors) {
        const res = makeResponse();
        let nextCalled = false;

        middleware({ auth }, res, () => {
            nextCalled = true;
        });

        assert.equal(res.statusCode, 401);
        assert.equal(res.body.code, "AUTHENTICATION_REQUIRED");
        assert.equal(nextCalled, false);
    }
});

test("rejects a valid session whose role is not allowed", () => {
    const middleware = authorizeRoles("Teacher");
    const res = makeResponse();
    let nextCalled = false;

    middleware({ auth: { userId: USER_ID, role: "Student" } }, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "FORBIDDEN");
    assert.equal(nextCalled, false);
});

test("allows each explicitly configured role", () => {
    for (const role of ["Admin", "Teacher", "Student"]) {
        const middleware = authorizeRoles(role);
        const res = makeResponse();
        let nextCalled = false;

        middleware({ auth: { userId: USER_ID, role } }, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, true);
        assert.equal(res.body, undefined);
    }
});

test("supports a deliberate multi-role allowlist", () => {
    const middleware = authorizeRoles("Teacher", "Student");
    const res = makeResponse();
    let nextCalled = false;

    middleware({ auth: { userId: USER_ID, role: "Student" } }, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.deepEqual(middleware.allowedRoles, ["Teacher", "Student"]);
});

test("does not allow request-supplied role fields to override session role", () => {
    const middleware = authorizeRoles("Teacher");
    const res = makeResponse();
    let nextCalled = false;

    middleware({
        auth: { userId: USER_ID, role: "Student" },
        body: { role: "Teacher" },
        query: { role: "Teacher" },
    }, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "FORBIDDEN");
    assert.equal(nextCalled, false);
});

test("rejects invalid middleware configuration immediately", () => {
    assert.throws(() => authorizeRoles(), TypeError);
    assert.throws(() => authorizeRoles("teacher"), TypeError);
    assert.throws(() => authorizeRoles("Teacher", "Root"), TypeError);
});

test("accepts valid ObjectIds containing numeric characters", () => {
    const middleware = authorizeRoles("Student");
    const res = makeResponse();
    let nextCalled = false;

    middleware({
        auth: { userId: "1234567890abcdef12345678", role: "Student" },
    }, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.body, undefined);
});
