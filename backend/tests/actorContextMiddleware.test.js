const test = require("node:test");
const assert = require("node:assert/strict");

const { createLoadActorContext } = require("../middleware/loadActorContext.js");
const { createAuthorizeSchoolScope } = require("../middleware/authorizeSchoolScope.js");

const USER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const SCHOOL_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const CLASS_ID = "cccccccccccccccccccccccc";
const OTHER_CLASS_ID = "dddddddddddddddddddddddd";

function makeResponse() {
    return {
        statusCode: 200,
        body: undefined,
        locals: { requestId: "test-request-id" },
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

test("actor context resolves the persisted Student identity and scope", async () => {
    const middleware = createLoadActorContext({
        AdminModel: {},
        TeacherModel: {},
        StudentModel: {
            async findById(id) {
                return { _id: id, role: "Student", school: SCHOOL_ID, sclassName: CLASS_ID };
            },
        },
    });
    const req = { auth: { userId: USER_ID, role: "Student" } };
    const res = makeResponse();
    let nextCalled = false;

    await middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.deepEqual(req.actor, {
        userId: USER_ID,
        role: "Student",
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        subjectId: null,
    });
    assert.equal(res.body, undefined);
});

test("actor context returns a standardized 401 for invalid session claims", async () => {
    const middleware = createLoadActorContext({
        AdminModel: {},
        TeacherModel: {},
        StudentModel: {},
    });
    const res = makeResponse();
    let nextCalled = false;

    await middleware({ auth: { userId: "invalid", role: "Student" } }, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.code, "AUTHENTICATION_REQUIRED");
    assert.equal(res.body.requestId, "test-request-id");
    assert.equal(nextCalled, false);
});

test("actor context returns a standardized 403 when the account has no school", async () => {
    const middleware = createLoadActorContext({
        AdminModel: {},
        TeacherModel: {},
        StudentModel: {
            async findById(id) {
                return { _id: id, role: "Student", school: null, sclassName: CLASS_ID };
            },
        },
    });
    const res = makeResponse();

    await middleware({ auth: { userId: USER_ID, role: "Student" } }, res, () => {
        assert.fail("next must not run for an unassigned account");
    });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "FORBIDDEN");
});

test("actor context returns a standardized 503 when account verification fails", async () => {
    const middleware = createLoadActorContext({
        AdminModel: {},
        TeacherModel: {},
        StudentModel: {
            async findById() {
                throw new Error("database details must not escape");
            },
        },
    });
    const res = makeResponse();

    await middleware({ auth: { userId: USER_ID, role: "Student" } }, res, () => {
        assert.fail("next must not run when the account cannot be verified");
    });

    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, "SERVICE_UNAVAILABLE");
    assert.equal(JSON.stringify(res.body).includes("database details"), false);
});

test("school scope returns a standardized 401 without a trusted actor", async () => {
    const authorizeSchoolScope = createAuthorizeSchoolScope({
        SclassModel: {},
    });
    const middleware = authorizeSchoolScope({ resource: "class", from: "params.id" });
    const res = makeResponse();

    await middleware({ params: { id: CLASS_ID } }, res, () => {
        assert.fail("next must not run without actor context");
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.code, "AUTHENTICATION_REQUIRED");
});

test("school scope returns a standardized 400 for an invalid resource id", async () => {
    const authorizeSchoolScope = createAuthorizeSchoolScope({
        SclassModel: {},
    });
    const middleware = authorizeSchoolScope({ resource: "class", from: "params.id" });
    const res = makeResponse();

    await middleware({
        actor: { userId: USER_ID, role: "Teacher", schoolId: SCHOOL_ID, classId: CLASS_ID },
        params: { id: "invalid" },
    }, res, () => {
        assert.fail("next must not run for an invalid resource id");
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, "VALIDATION_ERROR");
});

test("school scope rejects a same-school Class outside the Teacher's assigned Class", async () => {
    const authorizeSchoolScope = createAuthorizeSchoolScope({
        SclassModel: {
            async findById(id) {
                return { _id: id, school: SCHOOL_ID };
            },
        },
    });
    const middleware = authorizeSchoolScope({ resource: "class", from: "params.id" });
    const res = makeResponse();

    await middleware({
        actor: { userId: USER_ID, role: "Teacher", schoolId: SCHOOL_ID, classId: CLASS_ID },
        params: { id: OTHER_CLASS_ID },
    }, res, () => {
        assert.fail("next must not run for a different assigned Class");
    });

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.code, "NOT_FOUND");
});

test("school scope returns a standardized 503 when the resource cannot be verified", async () => {
    const authorizeSchoolScope = createAuthorizeSchoolScope({
        SclassModel: {
            async findById() {
                throw new Error("database details must not escape");
            },
        },
    });
    const middleware = authorizeSchoolScope({ resource: "class", from: "params.id" });
    const res = makeResponse();

    await middleware({
        actor: { userId: USER_ID, role: "Teacher", schoolId: SCHOOL_ID, classId: CLASS_ID },
        params: { id: CLASS_ID },
    }, res, () => {
        assert.fail("next must not run when resource verification fails");
    });

    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, "SERVICE_UNAVAILABLE");
    assert.equal(JSON.stringify(res.body).includes("database details"), false);
});
