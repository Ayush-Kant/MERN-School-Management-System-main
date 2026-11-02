const test = require("node:test");
const assert = require("node:assert/strict");
const { createUpdateStudentHandler } = require("../controllers/student_controller.js");

const STUDENT_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

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
        send(body) {
            this.body = body;
            return this;
        },
    };
}

function makeStudentModel(result = { _id: STUDENT_ID }) {
    const calls = [];
    return {
        calls,
        async findByIdAndUpdate(...args) {
            calls.push(args);
            return result ? { ...result } : null;
        },
    };
}

async function invoke(handler, body, StudentModel, extra = {}) {
    const req = {
        params: { id: STUDENT_ID },
        body,
        ...extra,
    };
    const res = makeResponse();
    await handler(req, res);
    return { req, res };
}

test("updates only the supported student profile fields", async () => {
    const StudentModel = makeStudentModel({ _id: STUDENT_ID, name: "Updated", rollNum: 12 });
    const handler = createUpdateStudentHandler({ StudentModel });
    const { res } = await invoke(handler, { name: "Updated", rollNum: 12 }, StudentModel);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(StudentModel.calls[0], [
        STUDENT_ID,
        { $set: { name: "Updated", rollNum: 12 } },
        { new: true, runValidators: true },
    ]);
});

test("hashes a supplied password before saving it", async () => {
    const StudentModel = makeStudentModel({ _id: STUDENT_ID, name: "Student" });
    const hashPassword = async (password) => `bcrypt-hash:${password}`;
    const handler = createUpdateStudentHandler({ StudentModel, hashPassword });
    const { res } = await invoke(handler, { password: "new-password" }, StudentModel);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(StudentModel.calls[0][1], {
        $set: { password: "bcrypt-hash:new-password" },
    });
    assert.equal(res.body.password, undefined);
});

test("rejects school and role changes without touching the database", async () => {
    const StudentModel = makeStudentModel();
    const handler = createUpdateStudentHandler({ StudentModel });
    const { res } = await invoke(handler, {
        name: "Updated",
        school: "bbbbbbbbbbbbbbbbbbbbbbbb",
        role: "Admin",
    }, StudentModel);

    assert.equal(res.statusCode, 400);
    assert.equal(StudentModel.calls.length, 0);
});

test("rejects attempts to overwrite academic records through the profile endpoint", async () => {
    const StudentModel = makeStudentModel();
    const handler = createUpdateStudentHandler({ StudentModel });
    const { res } = await invoke(handler, {
        attendance: [],
        examResult: [],
    }, StudentModel);

    assert.equal(res.statusCode, 400);
    assert.equal(StudentModel.calls.length, 0);
});

test("rejects malformed, empty, and unsupported update payloads", async () => {
    const StudentModel = makeStudentModel();
    const handler = createUpdateStudentHandler({ StudentModel });

    const malformed = await invoke(handler, null, StudentModel);
    const empty = await invoke(handler, {}, StudentModel);
    const unsupported = await invoke(handler, { email: "student@example.com" }, StudentModel);
    const emptyPassword = await invoke(handler, { password: "" }, StudentModel);

    assert.equal(malformed.res.statusCode, 400);
    assert.equal(empty.res.statusCode, 400);
    assert.equal(unsupported.res.statusCode, 400);
    assert.equal(emptyPassword.res.statusCode, 400);
    assert.equal(StudentModel.calls.length, 0);
});

test("returns not found when the target student no longer exists", async () => {
    const StudentModel = makeStudentModel(null);
    const handler = createUpdateStudentHandler({ StudentModel });
    const { res } = await invoke(handler, { name: "Updated" }, StudentModel);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: "Student not found" });
});
