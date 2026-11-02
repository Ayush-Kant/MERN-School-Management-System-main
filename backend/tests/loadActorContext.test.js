const test = require("node:test");
const assert = require("node:assert/strict");
const { createLoadActorContext } = require("../middleware/loadActorContext.js");

const USER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const SCHOOL_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const CLASS_ID = "cccccccccccccccccccccccc";
const SUBJECT_ID = "dddddddddddddddddddddddd";

function makeModel(document) {
    return {
        requestedId: null,
        projection: null,
        findById(id) {
            this.requestedId = id;
            return {
                select: (projection) => {
                    this.projection = projection;
                    return Promise.resolve(document);
                },
            };
        },
    };
}

function makeResponse() {
    return {
        statusCode: 200,
        body: undefined,
        headers: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
        getHeader(name) {
            return this.headers[name];
        },
        setHeader(name, value) {
            this.headers[name] = value;
        },
    };
}

async function invoke(middleware, req) {
    const res = makeResponse();
    let nextCalled = false;
    await middleware(req, res, () => {
        nextCalled = true;
    });
    return { req, res, nextCalled };
}

test("Admin context derives the school id from the authenticated Admin account", async () => {
    const AdminModel = makeModel({ _id: USER_ID, role: "Admin" });
    const middleware = createLoadActorContext({ AdminModel });

    const result = await invoke(middleware, {
        auth: { userId: USER_ID, role: "Admin" },
        body: { school: SCHOOL_ID, role: "Student" },
    });

    assert.equal(result.nextCalled, true);
    assert.deepEqual(result.req.actor, {
        userId: USER_ID,
        role: "Admin",
        schoolId: USER_ID,
        classId: null,
        subjectId: null,
    });
    assert.equal(AdminModel.requestedId, USER_ID);
    assert.equal(AdminModel.projection, "_id role");
    assert.equal(Object.isFrozen(result.req.actor), true);
});

test("Teacher context derives school, class, and subject from the database record", async () => {
    const TeacherModel = makeModel({
        _id: USER_ID,
        role: "Teacher",
        school: SCHOOL_ID,
        teachSclass: CLASS_ID,
        teachSubject: SUBJECT_ID,
    });
    const middleware = createLoadActorContext({ TeacherModel });

    const result = await invoke(middleware, {
        auth: { userId: USER_ID, role: "Teacher" },
        body: { school: "eeeeeeeeeeeeeeeeeeeeeeee", teachSclass: "ffffffffffffffffffffffff" },
    });

    assert.equal(result.nextCalled, true);
    assert.deepEqual(result.req.actor, {
        userId: USER_ID,
        role: "Teacher",
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        subjectId: SUBJECT_ID,
    });
    assert.equal(TeacherModel.projection, "_id role school teachSclass teachSubject");
});

test("Student context derives school and class from the database record", async () => {
    const StudentModel = makeModel({
        _id: USER_ID,
        role: "Student",
        school: SCHOOL_ID,
        sclassName: CLASS_ID,
    });
    const middleware = createLoadActorContext({ StudentModel });

    const result = await invoke(middleware, {
        auth: { userId: USER_ID, role: "Student" },
        query: { school: "eeeeeeeeeeeeeeeeeeeeeeee", studentId: "ffffffffffffffffffffffff" },
    });

    assert.equal(result.nextCalled, true);
    assert.deepEqual(result.req.actor, {
        userId: USER_ID,
        role: "Student",
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        subjectId: null,
    });
});

test("a deleted account invalidates the session and clears its cookie", async () => {
    const AdminModel = makeModel(null);
    const middleware = createLoadActorContext({ AdminModel });

    const result = await invoke(middleware, {
        auth: { userId: USER_ID, role: "Admin" },
    });

    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 401);
    assert.match(result.res.body.message, /account/i);
    assert.match(result.res.headers["Set-Cookie"], /Max-Age=0/);
});

test("a persisted role mismatch invalidates the session and clears its cookie", async () => {
    const StudentModel = makeModel({
        _id: USER_ID,
        role: "Teacher",
        school: SCHOOL_ID,
        sclassName: CLASS_ID,
    });
    const middleware = createLoadActorContext({ StudentModel });

    const result = await invoke(middleware, {
        auth: { userId: USER_ID, role: "Student" },
    });

    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 401);
    assert.match(result.res.headers["Set-Cookie"], /Max-Age=0/);
});

test("a non-admin account without a valid school assignment is denied", async () => {
    const TeacherModel = makeModel({
        _id: USER_ID,
        role: "Teacher",
        school: null,
        teachSclass: CLASS_ID,
    });
    const middleware = createLoadActorContext({ TeacherModel });

    const result = await invoke(middleware, {
        auth: { userId: USER_ID, role: "Teacher" },
    });

    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 403);
    assert.match(result.res.body.message, /school/i);
});

test("database lookup failures fail closed", async () => {
    const StudentModel = {
        findById() {
            return {
                select() {
                    return Promise.reject(new Error("database unavailable"));
                },
            };
        },
    };
    const middleware = createLoadActorContext({ StudentModel });

    const result = await invoke(middleware, {
        auth: { userId: USER_ID, role: "Student" },
    });

    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 503);
});

test("malformed or unsupported session claims are rejected before account lookup", async () => {
    let lookupCount = 0;
    const AdminModel = {
        findById() {
            lookupCount += 1;
            return Promise.resolve(null);
        },
    };
    const middleware = createLoadActorContext({ AdminModel });

    for (const auth of [
        { userId: "not-an-object-id", role: "Admin" },
        { userId: USER_ID, role: "Root" },
        null,
    ]) {
        const result = await invoke(middleware, { auth });
        assert.equal(result.nextCalled, false);
        assert.equal(result.res.statusCode, 401);
    }

    assert.equal(lookupCount, 0);
});

test("a Teacher may have no subject assignment without losing the school/class context", async () => {
    const TeacherModel = makeModel({
        _id: USER_ID,
        role: "Teacher",
        school: SCHOOL_ID,
        teachSclass: CLASS_ID,
        teachSubject: null,
    });
    const middleware = createLoadActorContext({ TeacherModel });

    const result = await invoke(middleware, {
        auth: { userId: USER_ID, role: "Teacher" },
    });

    assert.equal(result.nextCalled, true);
    assert.equal(result.req.actor.subjectId, null);
});
