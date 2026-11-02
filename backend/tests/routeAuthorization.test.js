const test = require("node:test");
const assert = require("node:assert/strict");
const router = require("../routes/route.js");
const { authenticateSession } = require("../middleware/authenticateSession.js");

const PUBLIC_ROUTES = new Set([
    "POST /AdminReg",
    "POST /AdminLogin",
    "POST /StudentLogin",
    "POST /TeacherLogin",
    "POST /AuthLogout",
]);

const SESSION_ONLY_ROUTES = new Set([
    "GET /AuthSession",
]);

const EXPECTED_ROLE_ROUTES = new Map([
    ["GET /Admin/:id", ["Admin"]],

    ["POST /StudentReg", ["Admin"]],
    ["GET /Students/:id", ["Admin", "Teacher"]],
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

function routeKey(route) {
    const method = Object.keys(route.methods).find((key) => route.methods[key]);
    return `${method.toUpperCase()} ${route.path}`;
}

function findRoute(key) {
    const layer = router.stack.find((entry) => entry.route && routeKey(entry.route) === key);
    assert.ok(layer, `Expected route ${key} to be registered`);
    return layer.route;
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
    }
});

test("the session inspection endpoint requires authentication without a role restriction", () => {
    const route = findRoute("GET /AuthSession");
    assert.equal(route.stack[0].handle, authenticateSession);
    assert.equal(
        route.stack.some((entry) => Array.isArray(entry.handle.allowedRoles)),
        false
    );
});

test("every other API route authenticates first and applies its explicit role allowlist", () => {
    for (const [key, expectedRoles] of EXPECTED_ROLE_ROUTES) {
        const route = findRoute(key);
        assert.equal(route.stack[0].handle, authenticateSession, `${key} must authenticate first`);

        const roleGuards = route.stack.filter((entry) =>
            Array.isArray(entry.handle.allowedRoles)
        );
        assert.equal(roleGuards.length, 1, `${key} must have exactly one role guard`);
        assert.deepEqual(roleGuards[0].handle.allowedRoles, expectedRoles, key);
    }
});
