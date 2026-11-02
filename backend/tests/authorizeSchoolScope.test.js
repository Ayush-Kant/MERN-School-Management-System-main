const test = require("node:test");
const assert = require("node:assert/strict");
const { createAuthorizeSchoolScope } = require("../middleware/authorizeSchoolScope.js");

const USER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_USER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const SCHOOL_ID = "cccccccccccccccccccccccc";
const OTHER_SCHOOL_ID = "dddddddddddddddddddddddd";
const CLASS_ID = "eeeeeeeeeeeeeeeeeeeeeeee";
const OTHER_CLASS_ID = "ffffffffffffffffffffffff";
const SUBJECT_ID = "111111111111111111111111";
const OTHER_SUBJECT_ID = "222222222222222222222222";
const STUDENT_ID = "333333333333333333333333";
const OTHER_STUDENT_ID = "444444444444444444444444";

function makeModel(documents = {}, error = null) {
    return {
        findById(id) {
            return {
                select() {
                    if (error) return Promise.reject(error);
                    return Promise.resolve(documents[id] || null);
                },
            };
        },
    };
}

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

async function invoke(middleware, req) {
    const res = makeResponse();
    let nextCalled = false;
    await middleware(req, res, () => {
        nextCalled = true;
    });
    return { req, res, nextCalled };
}

function makeAdmin() {
    return {
        userId: USER_ID,
        role: "Admin",
        schoolId: USER_ID,
        classId: null,
        subjectId: null,
    };
}

function makeTeacher() {
    return {
        userId: USER_ID,
        role: "Teacher",
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        subjectId: SUBJECT_ID,
    };
}

function makeStudent() {
    return {
        userId: USER_ID,
        role: "Student",
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        subjectId: null,
    };
}

test("school ids are compared with the authenticated tenant, not request claims", async () => {
    const authorize = createAuthorizeSchoolScope();
    const allowOwnSchool = authorize({ resource: "school", from: "params.id" });

    const allowed = await invoke(allowOwnSchool, {
        actor: makeAdmin(),
        params: { id: USER_ID },
        body: { school: OTHER_SCHOOL_ID },
    });
    assert.equal(allowed.nextCalled, true);

    const denied = await invoke(allowOwnSchool, {
        actor: makeTeacher(),
        params: { id: OTHER_SCHOOL_ID },
        body: { school: SCHOOL_ID },
    });
    assert.equal(denied.nextCalled, false);
    assert.equal(denied.res.statusCode, 404);
});

test("Admin can access a class only when it belongs to the Admin school", async () => {
    const SclassModel = makeModel({
        [CLASS_ID]: { _id: CLASS_ID, school: USER_ID },
        [OTHER_CLASS_ID]: { _id: OTHER_CLASS_ID, school: OTHER_SCHOOL_ID },
    });
    const authorize = createAuthorizeSchoolScope({ SclassModel });
    const guard = authorize({ resource: "class", from: "params.id" });

    const allowed = await invoke(guard, { actor: makeAdmin(), params: { id: CLASS_ID } });
    assert.equal(allowed.nextCalled, true);

    const denied = await invoke(guard, { actor: makeAdmin(), params: { id: OTHER_CLASS_ID } });
    assert.equal(denied.nextCalled, false);
    assert.equal(denied.res.statusCode, 404);
});

test("Teacher and Student can access only their own assigned class", async () => {
    const SclassModel = makeModel({
        [CLASS_ID]: { _id: CLASS_ID, school: SCHOOL_ID },
        [OTHER_CLASS_ID]: { _id: OTHER_CLASS_ID, school: SCHOOL_ID },
    });
    const authorize = createAuthorizeSchoolScope({ SclassModel });
    const guard = authorize({ resource: "class", from: "params.id" });

    for (const actor of [makeTeacher(), makeStudent()]) {
        const ownClass = await invoke(guard, { actor, params: { id: CLASS_ID } });
        const otherClass = await invoke(guard, { actor, params: { id: OTHER_CLASS_ID } });
        assert.equal(ownClass.nextCalled, true);
        assert.equal(otherClass.nextCalled, false);
        assert.equal(otherClass.res.statusCode, 404);
    }
});

test("Student resource access is self-only for Students and class-scoped for Teachers", async () => {
    const StudentModel = makeModel({
        [USER_ID]: { _id: USER_ID, school: SCHOOL_ID, sclassName: CLASS_ID },
        [STUDENT_ID]: { _id: STUDENT_ID, school: SCHOOL_ID, sclassName: CLASS_ID },
        [OTHER_STUDENT_ID]: { _id: OTHER_STUDENT_ID, school: SCHOOL_ID, sclassName: OTHER_CLASS_ID },
    });
    const authorize = createAuthorizeSchoolScope({ StudentModel });
    const guard = authorize({ resource: "student", from: "params.id" });

    const studentOwn = await invoke(guard, { actor: makeStudent(), params: { id: USER_ID } });
    const studentOther = await invoke(guard, { actor: makeStudent(), params: { id: STUDENT_ID } });
    assert.equal(studentOwn.nextCalled, true);
    assert.equal(studentOther.nextCalled, false);
    assert.equal(studentOther.res.statusCode, 404);

    const teacherClassmate = await invoke(guard, { actor: makeTeacher(), params: { id: STUDENT_ID } });
    const teacherOtherClass = await invoke(guard, { actor: makeTeacher(), params: { id: OTHER_STUDENT_ID } });
    assert.equal(teacherClassmate.nextCalled, true);
    assert.equal(teacherOtherClass.nextCalled, false);
    assert.equal(teacherOtherClass.res.statusCode, 404);
});

test("Admin can access students only within the Admin school", async () => {
    const StudentModel = makeModel({
        [STUDENT_ID]: { _id: STUDENT_ID, school: USER_ID, sclassName: CLASS_ID },
        [OTHER_STUDENT_ID]: { _id: OTHER_STUDENT_ID, school: OTHER_SCHOOL_ID, sclassName: OTHER_CLASS_ID },
    });
    const authorize = createAuthorizeSchoolScope({ StudentModel });
    const guard = authorize({ resource: "student", from: "params.id" });

    const allowed = await invoke(guard, { actor: makeAdmin(), params: { id: STUDENT_ID } });
    const denied = await invoke(guard, { actor: makeAdmin(), params: { id: OTHER_STUDENT_ID } });
    assert.equal(allowed.nextCalled, true);
    assert.equal(denied.nextCalled, false);
    assert.equal(denied.res.statusCode, 404);
});

test("Teacher profile access is limited to the signed-in Teacher", async () => {
    const TeacherModel = makeModel({
        [USER_ID]: { _id: USER_ID, school: SCHOOL_ID },
        [OTHER_USER_ID]: { _id: OTHER_USER_ID, school: SCHOOL_ID },
    });
    const authorize = createAuthorizeSchoolScope({ TeacherModel });
    const guard = authorize({ resource: "teacher", from: "params.id" });

    const ownProfile = await invoke(guard, { actor: makeTeacher(), params: { id: USER_ID } });
    const otherProfile = await invoke(guard, { actor: makeTeacher(), params: { id: OTHER_USER_ID } });
    assert.equal(ownProfile.nextCalled, true);
    assert.equal(otherProfile.nextCalled, false);
    assert.equal(otherProfile.res.statusCode, 404);
});

test("Teacher subject access is limited to the assigned subject", async () => {
    const SubjectModel = makeModel({
        [SUBJECT_ID]: { _id: SUBJECT_ID, school: SCHOOL_ID, sclassName: CLASS_ID, teacher: USER_ID },
        [OTHER_SUBJECT_ID]: { _id: OTHER_SUBJECT_ID, school: SCHOOL_ID, sclassName: CLASS_ID, teacher: OTHER_USER_ID },
    });
    const authorize = createAuthorizeSchoolScope({ SubjectModel });
    const guard = authorize({ resource: "subject", from: "params.id" });

    const ownSubject = await invoke(guard, { actor: makeTeacher(), params: { id: SUBJECT_ID } });
    const otherSubject = await invoke(guard, { actor: makeTeacher(), params: { id: OTHER_SUBJECT_ID } });
    assert.equal(ownSubject.nextCalled, true);
    assert.equal(otherSubject.nextCalled, false);
    assert.equal(otherSubject.res.statusCode, 404);
});

test("Student subject access is limited to subjects in the assigned class", async () => {
    const SubjectModel = makeModel({
        [SUBJECT_ID]: { _id: SUBJECT_ID, school: SCHOOL_ID, sclassName: CLASS_ID },
        [OTHER_SUBJECT_ID]: { _id: OTHER_SUBJECT_ID, school: SCHOOL_ID, sclassName: OTHER_CLASS_ID },
    });
    const authorize = createAuthorizeSchoolScope({ SubjectModel });
    const guard = authorize({ resource: "subject", from: "params.id" });

    const ownClassSubject = await invoke(guard, { actor: makeStudent(), params: { id: SUBJECT_ID } });
    const otherClassSubject = await invoke(guard, { actor: makeStudent(), params: { id: OTHER_SUBJECT_ID } });
    assert.equal(ownClassSubject.nextCalled, true);
    assert.equal(otherClassSubject.nextCalled, false);
    assert.equal(otherClassSubject.res.statusCode, 404);
});

test("related resources must belong to the same class", async () => {
    const SclassModel = makeModel({
        [CLASS_ID]: { _id: CLASS_ID, school: USER_ID },
    });
    const SubjectModel = makeModel({
        [SUBJECT_ID]: { _id: SUBJECT_ID, school: USER_ID, sclassName: CLASS_ID },
        [OTHER_SUBJECT_ID]: { _id: OTHER_SUBJECT_ID, school: USER_ID, sclassName: OTHER_CLASS_ID },
    });
    const authorize = createAuthorizeSchoolScope({ SclassModel, SubjectModel });
    const classGuard = authorize({
        resource: "class",
        from: "body.teachSclass",
        as: "assignedClass",
    });
    const subjectGuard = authorize({
        resource: "subject",
        from: "body.teachSubject",
        as: "assignedSubject",
        belongsTo: {
            field: "sclassName",
            resource: "assignedClass",
            resourceField: "_id",
        },
    });

    const request = {
        actor: makeAdmin(),
        body: { teachSclass: CLASS_ID, teachSubject: SUBJECT_ID },
    };
    const classResult = await invoke(classGuard, request);
    assert.equal(classResult.nextCalled, true);
    const subjectResult = await invoke(subjectGuard, classResult.req);
    assert.equal(subjectResult.nextCalled, true);

    const invalidRequest = {
        actor: makeAdmin(),
        body: { teachSclass: CLASS_ID, teachSubject: OTHER_SUBJECT_ID },
    };
    const invalidClassResult = await invoke(classGuard, invalidRequest);
    const invalidSubjectResult = await invoke(subjectGuard, invalidClassResult.req);
    assert.equal(invalidSubjectResult.nextCalled, false);
    assert.equal(invalidSubjectResult.res.statusCode, 404);
});

test("missing optional resource ids are skipped but malformed supplied ids are rejected", async () => {
    const authorize = createAuthorizeSchoolScope();
    const optionalSchool = authorize({
        resource: "school",
        from: "body.school",
        optional: true,
    });

    const missing = await invoke(optionalSchool, { actor: makeAdmin(), body: {} });
    const malformed = await invoke(optionalSchool, {
        actor: makeAdmin(),
        body: { school: "not-an-object-id" },
    });

    assert.equal(missing.nextCalled, true);
    assert.equal(malformed.nextCalled, false);
    assert.equal(malformed.res.statusCode, 400);
});

test("invalid resource ids, missing actor context, and database failures fail closed", async () => {
    const SclassModel = makeModel({}, new Error("database unavailable"));
    const authorize = createAuthorizeSchoolScope({ SclassModel });
    const guard = authorize({ resource: "class", from: "params.id" });

    const invalidId = await invoke(guard, { actor: makeAdmin(), params: { id: "bad" } });
    const noActor = await invoke(guard, { params: { id: CLASS_ID } });
    const unavailable = await invoke(guard, { actor: makeAdmin(), params: { id: CLASS_ID } });

    assert.equal(invalidId.res.statusCode, 400);
    assert.equal(noActor.res.statusCode, 401);
    assert.equal(unavailable.res.statusCode, 503);
});

test("unsupported authorization middleware configurations are rejected immediately", () => {
    const authorize = createAuthorizeSchoolScope();

    assert.throws(() => authorize({ resource: "unknown", from: "params.id" }), TypeError);
    assert.throws(() => authorize({ resource: "class", from: "headers.id" }), TypeError);
    assert.throws(() => authorize({
        resource: "subject",
        from: "params.id",
        belongsTo: { field: "classId", resource: "missing" },
    }), TypeError);
});
