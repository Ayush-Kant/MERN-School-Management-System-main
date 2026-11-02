const test = require("node:test");
const assert = require("node:assert/strict");
const {
    GAME_ACTIVITY_ARCHIVE_REASONS,
    normalizeReferenceId,
    validateGameActivityRelationships,
    createGameActivityLifecycle,
} = require("../services/learning/gameActivityIntegrity.js");

const IDS = {
    school: "aaaaaaaaaaaaaaaaaaaaaaaa",
    otherSchool: "eeeeeeeeeeeeeeeeeeeeeeee",
    class: "bbbbbbbbbbbbbbbbbbbbbbbb",
    otherClass: "ffffffffffffffffffffffff",
    subject: "cccccccccccccccccccccccc",
    otherSubject: "999999999999999999999999",
    teacher: "dddddddddddddddddddddddd",
    otherTeacher: "888888888888888888888888",
};

const validTeacher = {
    _id: IDS.teacher,
    school: IDS.school,
    teachSclass: IDS.class,
    teachSubject: IDS.subject,
};
const validClass = { _id: IDS.class, school: IDS.school };
const validSubject = {
    _id: IDS.subject,
    school: IDS.school,
    sclassName: IDS.class,
    teacher: IDS.teacher,
};

function makeLifecycle(overrides = {}) {
    const calls = [];
    const timestamp = new Date("2026-11-02T12:00:00.000Z");
    const GameActivityModel = {
        async updateMany(filter, update, options) {
            calls.push({ filter, update, options });
            if (overrides.updateError) throw overrides.updateError;
            return { acknowledged: true, matchedCount: 2, modifiedCount: 2 };
        },
    };
    const lifecycle = createGameActivityLifecycle({
        GameActivityModel,
        clock: overrides.clock || (() => timestamp),
    });
    return { lifecycle, calls, timestamp };
}

test("reference normalization accepts ObjectId strings and populated references", () => {
    assert.equal(normalizeReferenceId(IDS.teacher), IDS.teacher);
    assert.equal(normalizeReferenceId({ _id: IDS.teacher }), IDS.teacher);
    assert.equal(normalizeReferenceId("invalid"), null);
    assert.equal(normalizeReferenceId(null), null);
});

test("valid Teacher, class, and subject relationships are accepted", () => {
    assert.equal(
        validateGameActivityRelationships({
            teacher: validTeacher,
            schoolClass: validClass,
            subject: validSubject,
        }),
        null
    );
});

test("relationship validation rejects missing or incomplete Teacher assignments", () => {
    assert.deepEqual(
        validateGameActivityRelationships({ teacher: null }),
        { status: 404, message: "Teacher not found" }
    );

    const unassignedTeacher = { ...validTeacher, teachSubject: null };
    const result = validateGameActivityRelationships({
        teacher: unassignedTeacher,
        schoolClass: validClass,
        subject: validSubject,
    });
    assert.equal(result.status, 400);
    assert.match(result.message, /assigned to a school, class, and subject/);
});

test("relationship validation rejects missing or mismatched class and subject references", () => {
    const missingClass = validateGameActivityRelationships({
        teacher: validTeacher,
        schoolClass: null,
        subject: validSubject,
    });
    assert.equal(missingClass.status, 400);
    assert.match(missingClass.message, /could not be found/);

    const classIdMismatch = validateGameActivityRelationships({
        teacher: validTeacher,
        schoolClass: { ...validClass, _id: IDS.otherClass },
        subject: validSubject,
    });
    assert.equal(classIdMismatch.status, 400);

    const subjectIdMismatch = validateGameActivityRelationships({
        teacher: validTeacher,
        schoolClass: validClass,
        subject: { ...validSubject, _id: IDS.otherSubject },
    });
    assert.equal(subjectIdMismatch.status, 400);
});

test("relationship validation rejects cross-school and cross-class references", () => {
    const classSchoolMismatch = validateGameActivityRelationships({
        teacher: validTeacher,
        schoolClass: { ...validClass, school: IDS.otherSchool },
        subject: validSubject,
    });
    assert.equal(classSchoolMismatch.status, 400);
    assert.match(classSchoolMismatch.message, /same school and class/);

    const subjectSchoolMismatch = validateGameActivityRelationships({
        teacher: validTeacher,
        schoolClass: validClass,
        subject: { ...validSubject, school: IDS.otherSchool },
    });
    assert.equal(subjectSchoolMismatch.status, 400);

    const subjectClassMismatch = validateGameActivityRelationships({
        teacher: validTeacher,
        schoolClass: validClass,
        subject: { ...validSubject, sclassName: IDS.otherClass },
    });
    assert.equal(subjectClassMismatch.status, 400);
});

test("relationship validation rejects a subject owned by another Teacher", () => {
    const result = validateGameActivityRelationships({
        teacher: validTeacher,
        schoolClass: validClass,
        subject: { ...validSubject, teacher: IDS.otherTeacher },
    });

    assert.equal(result.status, 409);
    assert.match(result.message, /different teacher/);
});

test("archive operations exclude already archived records and use validators", async () => {
    const { lifecycle, calls, timestamp } = makeLifecycle();

    await lifecycle.archiveByClass(IDS.class);

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].filter, {
        class: IDS.class,
        status: { $ne: "archived" },
    });
    assert.deepEqual(calls[0].update, {
        $set: {
            status: "archived",
            archivedAt: timestamp,
            archiveReason: "class_deleted",
        },
    });
    assert.deepEqual(calls[0].options, { runValidators: true });
});

test("subject, Teacher, Teacher batch, and school lifecycle filters are scoped precisely", async () => {
    const { lifecycle, calls } = makeLifecycle();

    await lifecycle.archiveBySubject(IDS.subject);
    await lifecycle.archiveByTeacher(IDS.teacher);
    await lifecycle.archiveByTeachers([IDS.teacher, IDS.otherTeacher, IDS.teacher]);
    await lifecycle.archiveBySchool(IDS.school);

    assert.deepEqual(calls[0].filter, {
        subject: IDS.subject,
        status: { $ne: "archived" },
    });
    assert.equal(calls[0].update.$set.archiveReason, "subject_deleted");

    assert.deepEqual(calls[1].filter, {
        createdByTeacher: IDS.teacher,
        status: { $ne: "archived" },
    });
    assert.equal(calls[1].update.$set.archiveReason, "teacher_deleted");

    assert.deepEqual(calls[2].filter, {
        createdByTeacher: { $in: [IDS.teacher, IDS.otherTeacher] },
        status: { $ne: "archived" },
    });
    assert.equal(calls[2].update.$set.archiveReason, "teacher_deleted");

    assert.deepEqual(calls[3].filter, {
        school: IDS.school,
        status: { $ne: "archived" },
    });
    assert.equal(calls[3].update.$set.archiveReason, "school_resources_deleted");
});

test("Teacher reassignment archives only activities outside the new assignment", async () => {
    const { lifecycle, calls } = makeLifecycle();

    await lifecycle.archiveForTeacherReassignment(IDS.teacher, {
        schoolId: IDS.school,
        classId: IDS.class,
        subjectId: IDS.otherSubject,
    });

    assert.deepEqual(calls[0].filter, {
        createdByTeacher: IDS.teacher,
        $or: [
            { school: { $ne: IDS.school } },
            { class: { $ne: IDS.class } },
            { subject: { $ne: IDS.otherSubject } },
        ],
        status: { $ne: "archived" },
    });
    assert.equal(calls[0].update.$set.archiveReason, "teacher_reassigned");
});

test("archive operations reject malformed identifiers and invalid dependency configuration", async () => {
    const { lifecycle } = makeLifecycle();

    await assert.rejects(
        lifecycle.archiveByClass("bad-id"),
        /classId must be a valid ObjectId/
    );
    await assert.rejects(
        lifecycle.archiveForTeacherReassignment(IDS.teacher, {
            schoolId: IDS.school,
            classId: IDS.class,
            subjectId: "bad-id",
        }),
        /subjectId must be a valid ObjectId/
    );
    assert.throws(
        () => createGameActivityLifecycle({ GameActivityModel: {} }),
        /requires a GameActivity model/
    );
    assert.throws(
        () => createGameActivityLifecycle({
            GameActivityModel: { updateMany() {} },
            clock: "not-a-function",
        }),
        /clock must be a function/
    );
});

test("archive operations reject invalid clock values and propagate persistence failures", async () => {
    const invalidClock = createGameActivityLifecycle({
        GameActivityModel: { async updateMany() { return {}; } },
        clock: () => "not-a-date",
    });
    await assert.rejects(
        invalidClock.archiveByTeacher(IDS.teacher),
        /must return a valid Date/
    );

    const failing = makeLifecycle({ updateError: new Error("database unavailable") });
    await assert.rejects(
        failing.lifecycle.archiveByTeacher(IDS.teacher),
        /database unavailable/
    );
});

test("the lifecycle exposes only the documented archive reasons", () => {
    assert.deepEqual(GAME_ACTIVITY_ARCHIVE_REASONS, [
        "manual",
        "teacher_deleted",
        "teacher_reassigned",
        "class_deleted",
        "subject_deleted",
        "school_resources_deleted",
    ]);
});
