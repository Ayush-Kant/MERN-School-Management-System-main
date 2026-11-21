const test = require("node:test");
const assert = require("node:assert/strict");
const {
    DEMO_PASSWORDS,
    ensureChemAmazeDemoData,
} = require("../services/learning/chemamazeDemoSeed");

function createModel() {
    const documents = [];
    let nextId = 1;

    function matches(document, filter) {
        return Object.entries(filter).every(([field, expected]) => {
            if (field === "$or") {
                return expected.some((branch) => matches(document, branch));
            }

            const actual = document[field];
            if (expected && typeof expected === "object" && !Array.isArray(expected)) {
                if (Object.prototype.hasOwnProperty.call(expected, "$exists")) {
                    return expected.$exists ? actual !== undefined : actual === undefined;
                }
                if (Object.prototype.hasOwnProperty.call(expected, "$in")) {
                    return expected.$in.some((value) => value === actual || (value === null && actual === undefined));
                }
            }

            return expected === actual;
        });
    }

    return {
        documents,
        async findOne(filter) {
            return documents.find((document) => matches(document, filter)) || null;
        },
        async findById(id) {
            return documents.find((document) => document._id === id) || null;
        },
        async create(document) {
            const created = {
                _id: String(nextId++).padStart(24, "0"),
                ...structuredClone(document),
            };
            documents.push(created);
            return created;
        },
        async updateOne(filter, update) {
            const document = documents.find((item) => matches(item, filter));
            if (!document) return { matchedCount: 0, modifiedCount: 0 };
            Object.assign(document, structuredClone(update.$set || {}));
            return { matchedCount: 1, modifiedCount: 1 };
        },
    };
}

function createModels() {
    return {
        AdminModel: createModel(),
        SclassModel: createModel(),
        SubjectModel: createModel(),
        TeacherModel: createModel(),
        StudentModel: createModel(),
    };
}

function createHashers() {
    const calls = { admin: [], other: [] };
    return {
        calls,
        async hashAdminPassword(password) {
            calls.admin.push(password);
            return `hashed-admin:${password}`;
        },
        async hashPassword(password) {
            calls.other.push(password);
            return `hashed-user:${password}`;
        },
    };
}

test("creates the complete demo school scope and six importer assignments", async () => {
    const models = createModels();
    const hashers = createHashers();

    const seeded = await ensureChemAmazeDemoData({
        models,
        ...hashers,
    });

    assert.equal(seeded.school.schoolName, "ChemAmaze Demo School");
    assert.equal(models.AdminModel.documents.length, 1);
    assert.equal(models.SclassModel.documents.length, 3);
    assert.equal(models.SubjectModel.documents.length, 6);
    assert.equal(models.TeacherModel.documents.length, 6);
    assert.equal(models.StudentModel.documents.length, 3);

    assert.deepEqual(
        Object.keys(seeded.assignments).sort(),
        [
            "6|Mathematics",
            "6|Science",
            "7|Mathematics",
            "7|Science",
            "8|Mathematics",
            "8|Science",
        ]
    );

    for (const [key, assignment] of Object.entries(seeded.assignments)) {
        const subject = models.SubjectModel.documents.find(
            (item) => String(item._id) === assignment.subjectId
        );
        const teacher = models.TeacherModel.documents.find(
            (item) => String(item._id) === assignment.teacherId
        );

        assert.ok(subject, `Missing subject for ${key}`);
        assert.ok(teacher, `Missing teacher for ${key}`);
        assert.equal(subject.teacher, teacher._id);
        assert.equal(teacher.school, seeded.school._id);
        assert.equal(teacher.teachSclass, assignment.classId);
        assert.equal(teacher.teachSubject, assignment.subjectId);
    }

    assert.equal(models.AdminModel.documents[0].password, `hashed-admin:${DEMO_PASSWORDS.admin}`);
    assert.equal(models.TeacherModel.documents[0].password, `hashed-user:${DEMO_PASSWORDS.teacher}`);
    assert.equal(models.StudentModel.documents[0].password, `hashed-user:${DEMO_PASSWORDS.student}`);
    assert.deepEqual(seeded.counts.created, {
        school: 1,
        classes: 3,
        subjects: 6,
        teachers: 6,
        students: 3,
    });
});

test("is idempotent and does not reset existing demo account passwords", async () => {
    const models = createModels();
    const hashers = createHashers();

    await ensureChemAmazeDemoData({ models, ...hashers });
    const passwordBefore = models.TeacherModel.documents[0].password;
    const hashCallCounts = {
        admin: hashers.calls.admin.length,
        other: hashers.calls.other.length,
    };

    const secondRun = await ensureChemAmazeDemoData({ models, ...hashers });

    assert.deepEqual(secondRun.counts.created, {
        school: 0,
        classes: 0,
        subjects: 0,
        teachers: 0,
        students: 0,
    });
    assert.deepEqual(secondRun.counts.reused, {
        school: 1,
        classes: 3,
        subjects: 6,
        teachers: 6,
        students: 3,
    });
    assert.equal(models.AdminModel.documents.length, 1);
    assert.equal(models.SclassModel.documents.length, 3);
    assert.equal(models.SubjectModel.documents.length, 6);
    assert.equal(models.TeacherModel.documents.length, 6);
    assert.equal(models.StudentModel.documents.length, 3);
    assert.equal(models.TeacherModel.documents[0].password, passwordBefore);
    assert.deepEqual(
        { admin: hashers.calls.admin.length, other: hashers.calls.other.length },
        hashCallCounts
    );
});

test("refuses to merge an existing Admin email and school name from different records", async () => {
    const models = createModels();
    models.AdminModel.documents.push(
        { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", email: "admin@chemamaze.demo", schoolName: "Other School", role: "Admin" },
        { _id: "bbbbbbbbbbbbbbbbbbbbbbbb", email: "other@chemamaze.demo", schoolName: "ChemAmaze Demo School", role: "Admin" }
    );

    await assert.rejects(
        ensureChemAmazeDemoData({
            models,
            async hashAdminPassword(password) { return password; },
            async hashPassword(password) { return password; },
        }),
        /already belong to different records/
    );
    assert.equal(models.SclassModel.documents.length, 0);
});

test("refuses to reassign an existing demo Teacher or a Subject owned by another Teacher", async () => {
    const models = createModels();
    const hashers = createHashers();
    const seeded = await ensureChemAmazeDemoData({ models, ...hashers });

    const teacher = models.TeacherModel.documents[0];
    teacher.teachSubject = "ffffffffffffffffffffffff";

    await assert.rejects(
        ensureChemAmazeDemoData({ models, ...hashers }),
        /Conflicting demo Teacher assignment/
    );
    assert.equal(teacher.teachSubject, "ffffffffffffffffffffffff");
    assert.equal(seeded.school._id, models.AdminModel.documents[0]._id);
});
