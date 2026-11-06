const test = require("node:test");
const assert = require("node:assert/strict");
const router = require("../routes/route");
const { authenticateSession } = require("../middleware/authenticateSession");
const { loadActorContext } = require("../middleware/loadActorContext");

function findRoute(method, path) {
    const layer = router.stack.find((item) =>
        item.route &&
        item.route.path === path &&
        item.route.methods[method.toLowerCase()]
    );
    assert.ok(layer, `Expected ${method.toUpperCase()} ${path} to be registered`);
    return layer.route.stack.map((item) => item.handle);
}

function assertProtectedRoute(method, path, roles) {
    const handlers = findRoute(method, path);

    assert.equal(handlers[0], authenticateSession, `${method} ${path} must authenticate first`);
    assert.deepEqual(
        handlers[1].allowedRoles,
        roles,
        `${method} ${path} must enforce the expected role allowlist`
    );
    assert.equal(handlers[2], loadActorContext, `${method} ${path} must load database-backed actor context after the role guard`);
    assert.equal(handlers.length, 4, `${method} ${path} should have auth, role, actor context, and controller handlers`);
    assert.equal(typeof handlers[3], "function", `${method} ${path} must finish with a controller handler`);
    assert.equal(handlers[3].isAsyncHandler, true, `${method} ${path} must forward async controller failures`);
}

test("Game Zone create and state transitions require a Teacher session", () => {
    assertProtectedRoute("post", "/GameActivityCreate", ["Teacher"]);
    assertProtectedRoute("put", "/GameActivityPublish/:id", ["Teacher"]);
    assertProtectedRoute("put", "/GameActivityUpdate/:id", ["Teacher"]);
    assertProtectedRoute("put", "/GameActivityUnpublish/:id", ["Teacher"]);
    assertProtectedRoute("put", "/GameActivityArchive/:id", ["Teacher"]);
});

test("Game Zone listing requires an authenticated Teacher or Student", () => {
    assertProtectedRoute("get", "/GameActivityList/:id", ["Teacher", "Student"]);
});

test("quiz authoring and publishing require a Teacher session", () => {
    assertProtectedRoute("post", "/LearningQuizCreate", ["Teacher"]);
    assertProtectedRoute("put", "/LearningQuizPublish/:id", ["Teacher"]);
});

test("quiz listing allows only authenticated Teachers and Students", () => {
    assertProtectedRoute("get", "/LearningQuizList/:id", ["Teacher", "Student"]);
});

test("quiz submission requires a Student session", () => {
    assertProtectedRoute("post", "/LearningQuizSubmit/:id", ["Student"]);
});

test("the session profile endpoint remains authenticated without an unnecessary role restriction", () => {
    const handlers = findRoute("get", "/AuthSession");
    assert.equal(handlers[0], authenticateSession);
    assert.equal(handlers.length, 2);
});
