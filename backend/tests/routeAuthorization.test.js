const test = require("node:test");
const assert = require("node:assert/strict");
const router = require("../routes/route.js");
const { authenticateSession } = require("../middleware/authenticateSession.js");
const { loadActorContext } = require("../middleware/loadActorContext.js");

const PUBLIC_ROUTES = new Set([
    "POST /AdminReg",
    "POST /AdminLogin",
    "POST /StudentLogin",
    "POST /TeacherLogin",
    "POST /AuthLogout",
]);

const SESSION_ONLY_ROUTES = new Set(["GET /AuthSession"]);

const EXPECTED_ROLE_ROUTES = new Map([
    ["GET /Admin/:id", ["Admin"]],

    ["POST /StudentReg", ["Admin"]],
    ["GET /Students/:id", ["Admin"]],
    ["GET /Student/:id", ["Admin", "Teacher", "Student"]],
    ["DELETE /Students/:id", ["Admin"]],
    ["DELETE /StudentsClass/:id", ["Admin"]],
    ["DELETE /Student/:id", ["Admin"]],
    ["PUT /Student/:id", ["Admin"]],
    ["PUT /UpdateExamResult/:id", ["Admin", "Teacher"]],
    ["PUT /StudentAttendance/:id", ["Admin", "Teacher"]],
    ["PUT /RemoveAllStudentsSubAtten/:id", ["Admin", "Teacher"]],
    ["PUT /RemoveAllStudentsAtten/:id", ["Admin"]],
    ["PUT /RemoveStudentSubAtten/:id", ["Admin", "Teacher"]],
    ["PUT /RemoveStudentAtten/:id", ["Admin", "Teacher"]],

    ["POST /TeacherReg", ["Admin"]],
    ["GET /Teachers/:id", ["Admin"]],
    ["GET /Teacher/:id", ["Admin", "Teacher"]],
    ["DELETE /Teachers/:id", ["Admin"]],
    ["DELETE /TeachersClass/:id", ["Admin"]],
    ["DELETE /Teacher/:id", ["Admin"]],
    ["PUT /TeacherSubject", ["Admin"]],
    ["POST /TeacherAttendance/:id", ["Admin"]],

    ["POST /NoticeCreate", ["Admin"]],
    ["GET /NoticeList/:id", ["Admin", "Teacher", "Student"]],
    ["DELETE /Notices/:id", ["Admin"]],
    ["DELETE /Notice/:id", ["Admin"]],
    ["PUT /Notice/:id", ["Admin"]],

    ["POST /ComplainCreate", ["Student"]],
    ["GET /ComplainList/:id", ["Admin"]],

    ["POST /SclassCreate", ["Admin"]],
    ["GET /SclassList/:id", ["Admin"]],
    ["GET /Sclass/:id", ["Admin", "Teacher", "Student"]],
    ["GET /Sclass/Students/:id", ["Admin", "Teacher"]],
    ["DELETE /Sclasses/:id", ["Admin"]],
    ["DELETE /Sclass/:id", ["Admin"]],

    ["POST /SubjectCreate", ["Admin"]],
    ["GET /AllSubjects/:id", ["Admin"]],
    ["GET /ClassSubjects/:id", ["Admin", "Teacher", "Student"]],
    ["GET /FreeSubjectList/:id", ["Admin"]],
    ["GET /Subject/:id", ["Admin", "Teacher", "Student"]],
    ["DELETE /Subject/:id", ["Admin"]],
    ["DELETE /Subjects/:id", ["Admin"]],
    ["DELETE /SubjectsClass/:id", ["Admin"]],

    ["POST /GameActivityCreate", ["Teacher"]],
    ["GET /GameActivityList/:id", ["Teacher", "Student"]],
    ["PUT /GameActivityPublish/:id", ["Teacher"]],
    ["PUT /GameActivityArchive/:id", ["Teacher"]],

    ["POST /LearningQuizCreate", ["Teacher"]],
    ["GET /LearningQuizList/:id", ["Teacher", "Student"]],
    ["PUT /LearningQuizPublish/:id", ["Teacher"]],
    ["POST /LearningQuizSubmit/:id", ["Student"]],
]);

const scope = (resource, from, options = {}) => ({
    resource,
    from,
    as: options.as || resource,
    belongsTo: options.belongsTo,
    optional: options.optional || false,
});

const EXPECTED_SCOPE_ROUTES = new Map([
    ["GET /Admin/:id", [scope("self", "params.id")]],

    ["POST /StudentReg", [
        scope("school", "body.adminID"),
        scope("class", "body.sclassName"),
    ]],
    ["GET /Students/:id", [scope("school", "params.id")]],
    ["GET /Student/:id", [scope("student", "params.id")]],
    ["DELETE /Students/:id", [scope("school", "params.id")]],
    ["DELETE /StudentsClass/:id", [scope("class", "params.id")]],
    ["DELETE /Student/:id", [scope("student", "params.id")]],
    ["PUT /Student/:id", [
        scope("student", "params.id"),
        scope("class", "body.sclassName", { optional: true }),
    ]],
    ["PUT /UpdateExamResult/:id", [
        scope("student", "params.id", { as: "targetStudent" }),
        scope("subject", "body.subName", {
            as: "targetStudentSubject",
            belongsTo: {
                field: "sclassName",
                resource: "targetStudent",
                resourceField: "sclassName",
            },
        }),
    ]],
    ["PUT /StudentAttendance/:id", [
        scope("student", "params.id", { as: "targetStudent" }),
        scope("subject", "body.subName", {
            as: "targetStudentSubject",
            belongsTo: {
                field: "sclassName",
                resource: "targetStudent",
                resourceField: "sclassName",
            },
        }),
    ]],
    ["PUT /RemoveAllStudentsSubAtten/:id", [scope("subject", "params.id")]],
    ["PUT /RemoveAllStudentsAtten/:id", [scope("school", "params.id")]],
    ["PUT /RemoveStudentSubAtten/:id", [
        scope("student", "params.id", { as: "targetStudent" }),
        scope("subject", "body.subId", {
            as: "targetStudentSubId",
            belongsTo: {
                field: "sclassName",
                resource: "targetStudent",
                resourceField: "sclassName",
            },
        }),
    ]],
    ["PUT /RemoveStudentAtten/:id", [scope("student", "params.id")]],

    ["POST /TeacherReg", [
        scope("school", "body.school"),
        scope("class", "body.teachSclass", { as: "teacherRegistrationClass" }),
        scope("subject", "body.teachSubject", {
            as: "teacherRegistrationSubject",
            belongsTo: {
                field: "sclassName",
                resource: "teacherRegistrationClass",
                resourceField: "_id",
            },
        }),
    ]],
    ["GET /Teachers/:id", [scope("school", "params.id")]],
    ["GET /Teacher/:id", [scope("teacher", "params.id")]],
    ["DELETE /Teachers/:id", [scope("school", "params.id")]],
    ["DELETE /TeachersClass/:id", [scope("class", "params.id")]],
    ["DELETE /Teacher/:id", [scope("teacher", "params.id")]],
    ["PUT /TeacherSubject", [
        scope("teacher", "body.teacherId", { as: "teacherAssignmentTeacher" }),
        scope("subject", "body.teachSubject", {
            as: "teacherAssignmentSubject",
            belongsTo: {
                field: "sclassName",
                resource: "teacherAssignmentTeacher",
                resourceField: "teachSclass",
            },
        }),
    ]],
    ["POST /TeacherAttendance/:id", [scope("teacher", "params.id")]],

    ["POST /NoticeCreate", [scope("school", "body.adminID")]],
    ["GET /NoticeList/:id", [scope("school", "params.id")]],
    ["DELETE /Notices/:id", [scope("school", "params.id")]],
    ["DELETE /Notice/:id", [scope("notice", "params.id")]],
    ["PUT /Notice/:id", [scope("notice", "params.id")]],

    ["POST /ComplainCreate", [
        scope("school", "body.school", { optional: true }),
        scope("self", "body.user"),
    ]],
    ["GET /ComplainList/:id", [scope("school", "params.id")]],

    ["POST /SclassCreate", [scope("school", "body.adminID")]],
    ["GET /SclassList/:id", [scope("school", "params.id")]],
    ["GET /Sclass/:id", [scope("class", "params.id")]],
    ["GET /Sclass/Students/:id", [scope("class", "params.id")]],
    ["DELETE /Sclasses/:id", [scope("school", "params.id")]],
    ["DELETE /Sclass/:id", [scope("class", "params.id")]],

    ["POST /SubjectCreate", [
        scope("school", "body.adminID"),
        scope("class", "body.sclassName"),
    ]],
    ["GET /AllSubjects/:id", [scope("school", "params.id")]],
    ["GET /ClassSubjects/:id", [scope("class", "params.id")]],
    ["GET /FreeSubjectList/:id", [scope("class", "params.id")]],
    ["GET /Subject/:id", [scope("subject", "params.id")]],
    ["DELETE /Subject/:id", [scope("subject", "params.id")]],
    ["DELETE /Subjects/:id", [scope("school", "params.id")]],
    ["DELETE /SubjectsClass/:id", [scope("class", "params.id")]],
]);

function routeKey(route) {
    const method = Object.keys(route.methods).find((key) => route.methods[key]);
    return `${method.toUpperCase()} ${route.path}`;
}

function findRoute(key) {
    const layer = router.stack.find((entry) => entry.route && routeKey(entry.route) === key);
    assert.ok(layer, `Expected route ${key} to be registered`);
    return layer.route;
}

function getMiddlewareScopes(route) {
    return route.stack
        .map((entry) => entry.handle.scope)
        .filter(Boolean)
        .map((entry) => ({
            resource: entry.resource,
            from: entry.from,
            as: entry.as,
            belongsTo: entry.belongsTo,
            optional: entry.optional,
        }));
}

test("all registered API routes are explicitly classified", () => {
    const actualKeys = router.stack
        .filter((entry) => entry.route)
        .map((entry) => routeKey(entry.route))
        .sort();

    const expectedKeys = [
        ...PUBLIC_ROUTES,
        ...SESSION_ONLY_ROUTES,
        ...EXPECTED_ROLE_ROUTES.keys(),
    ].sort();

    assert.deepEqual(actualKeys, expectedKeys);
});

test("only login, initial Admin registration, and logout remain public", () => {
    for (const key of PUBLIC_ROUTES) {
        const route = findRoute(key);
        assert.equal(
            route.stack.some((entry) => entry.handle === authenticateSession),
            false,
            `${key} should remain public`
        );
        assert.equal(
            route.stack.some((entry) => Array.isArray(entry.handle.allowedRoles)),
            false,
            `${key} should not have a role guard`
        );
        assert.equal(
            route.stack.some((entry) => entry.handle === loadActorContext),
            false,
            `${key} should not load an authenticated actor`
        );
    }
});

test("the session inspection endpoint requires authentication without a role restriction", () => {
    const route = findRoute("GET /AuthSession");
    assert.equal(route.stack[0].handle, authenticateSession);
    assert.equal(
        route.stack.some((entry) => Array.isArray(entry.handle.allowedRoles)),
        false
    );
    assert.equal(
        route.stack.some((entry) => entry.handle === loadActorContext),
        false
    );
});

test("every role-protected API authenticates, authorizes its role, and loads actor context in order", () => {
    for (const [key, expectedRoles] of EXPECTED_ROLE_ROUTES) {
        const route = findRoute(key);
        assert.equal(route.stack[0].handle, authenticateSession, `${key} must authenticate first`);

        const roleIndex = route.stack.findIndex((entry) =>
            Array.isArray(entry.handle.allowedRoles)
        );
        assert.notEqual(roleIndex, -1, `${key} must have a role guard`);
        assert.deepEqual(route.stack[roleIndex].handle.allowedRoles, expectedRoles, key);
        assert.equal(route.stack[roleIndex + 1].handle, loadActorContext, `${key} must load actor after role authorization`);
    }
});

test("all legacy school-management routes have explicit resource/school scope checks", () => {
    assert.deepEqual(
        [...EXPECTED_SCOPE_ROUTES.keys()].sort(),
        [...EXPECTED_ROLE_ROUTES.keys()]
            .filter((key) => !key.includes("GameActivity") && !key.includes("LearningQuiz"))
            .sort()
    );

    for (const [key, expectedScopes] of EXPECTED_SCOPE_ROUTES) {
        assert.deepEqual(getMiddlewareScopes(findRoute(key)), expectedScopes, key);
    }
});

test("new Games and Learning Quiz routes rely on authenticated actor context and their controller-level ownership checks", () => {
    for (const key of EXPECTED_ROLE_ROUTES.keys()) {
        if (!key.includes("GameActivity") && !key.includes("LearningQuiz")) continue;
        const route = findRoute(key);
        const roleIndex = route.stack.findIndex((entry) =>
            Array.isArray(entry.handle.allowedRoles)
        );
        assert.equal(route.stack[roleIndex + 1].handle, loadActorContext, key);
        assert.deepEqual(getMiddlewareScopes(route), []);
    }
});
