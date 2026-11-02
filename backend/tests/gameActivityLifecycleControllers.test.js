const test = require("node:test");
const assert = require("node:assert/strict");

const GameActivity = require("../models/gameActivitySchema.js");
const Sclass = require("../models/sclassSchema.js");
const Subject = require("../models/subjectSchema.js");
const Teacher = require("../models/teacherSchema.js");
const Student = require("../models/studentSchema.js");

const { deleteSclass, deleteSclasses } = require("../controllers/class-controller.js");
const {
    deleteSubject,
    deleteSubjects,
    deleteSubjectsByClass,
} = require("../controllers/subject-controller.js");
const {
    updateTeacherSubject,
    deleteTeacher,
    deleteTeachers,
    deleteTeachersByClass,
} = require("../controllers/teacher-controller.js");

const IDS = {
    school: "aaaaaaaaaaaaaaaaaaaaaaaa",
    class: "bbbbbbbbbbbbbbbbbbbbbbbb",
    subject: "cccccccccccccccccccccccc",
    nextSubject: "eeeeeeeeeeeeeeeeeeeeeeee",
    teacher: "dddddddddddddddddddddddd",
    otherTeacher: "888888888888888888888888",
};

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

async function withStubs(stubs, run) {
    const restorers = [];

    for (const [target, key, replacement] of stubs) {
        const hadOwnProperty = Object.hasOwn(target, key);
        const original = target[key];
        target[key] = replacement;
        restorers.push(() => {
            if (hadOwnProperty) target[key] = original;
            else delete target[key];
        });
    }

    try {
        return await run();
    } finally {
        restorers.reverse().forEach((restore) => restore());
    }
}

function queryReturning(records) {
    return {
        select() {
            return Promise.resolve(records);
        },
    };
}

test("deleting one Class archives its activities before deleting the Class", async () => {
    const events = [];
    const classRecord = { _id: IDS.class };
    const res = makeResponse();

    await withStubs([
        [Sclass, "findById", async () => classRecord],
        [GameActivity, "updateMany", async (filter, update) => {
            events.push({ type: "archive", filter, update });
            return { modifiedCount: 1 };
        }],
        [Sclass, "findByIdAndDelete", async () => {
            events.push({ type: "delete-class" });
            return classRecord;
        }],
        [Student, "deleteMany", async () => ({ deletedCount: 0 })],
        [Subject, "deleteMany", async () => ({ deletedCount: 0 })],
        [Teacher, "deleteMany", async () => ({ deletedCount: 0 })],
    ], async () => {
        await deleteSclass({ params: { id: IDS.class } }, res);
    });

    assert.equal(res.body, classRecord);
    assert.equal(events[0].type, "archive");
    assert.deepEqual(events[0].filter, {
        class: IDS.class,
        status: { $ne: "archived" },
    });
    assert.equal(events[0].update.$set.archiveReason, "class_deleted");
    assert.equal(events[1].type, "delete-class");
});

test("deleting all Classes in a school archives the school's GameActivity catalogue first", async () => {
    const events = [];
    const res = makeResponse();

    await withStubs([
        [Sclass, "find", () => queryReturning([{ _id: IDS.class }])],
        [GameActivity, "updateMany", async (filter, update) => {
            events.push({ type: "archive", filter, update });
            return { modifiedCount: 1 };
        }],
        [Sclass, "deleteMany", async () => {
            events.push({ type: "delete-classes" });
            return { deletedCount: 1 };
        }],
        [Student, "deleteMany", async () => ({ deletedCount: 0 })],
        [Subject, "deleteMany", async () => ({ deletedCount: 0 })],
        [Teacher, "deleteMany", async () => ({ deletedCount: 0 })],
    ], async () => {
        await deleteSclasses({ params: { id: IDS.school } }, res);
    });

    assert.equal(events[0].type, "archive");
    assert.deepEqual(events[0].filter, {
        school: IDS.school,
        status: { $ne: "archived" },
    });
    assert.equal(events[0].update.$set.archiveReason, "school_resources_deleted");
    assert.equal(events[1].type, "delete-classes");
});

test("deleting one Subject archives only activities referencing that Subject first", async () => {
    const events = [];
    const subjectRecord = { _id: IDS.subject };
    const res = makeResponse();

    await withStubs([
        [Subject, "findById", async () => subjectRecord],
        [GameActivity, "updateMany", async (filter, update) => {
            events.push({ type: "archive", filter, update });
            return { modifiedCount: 1 };
        }],
        [Subject, "findByIdAndDelete", async () => {
            events.push({ type: "delete-subject" });
            return subjectRecord;
        }],
        [Teacher, "updateMany", async () => ({ modifiedCount: 1 })],
        [Student, "updateMany", async () => ({ modifiedCount: 1 })],
    ], async () => {
        await deleteSubject({ params: { id: IDS.subject } }, res);
    });

    assert.equal(res.body, subjectRecord);
    assert.equal(events[0].type, "archive");
    assert.deepEqual(events[0].filter, {
        subject: IDS.subject,
        status: { $ne: "archived" },
    });
    assert.equal(events[0].update.$set.archiveReason, "subject_deleted");
    assert.equal(events[1].type, "delete-subject");
});

test("bulk Subject deletion archives the exact set of deleted Subject references first", async () => {
    for (const [operation, filter] of [
        ["deleteSubjects", { school: IDS.school }],
        ["deleteSubjectsByClass", { sclassName: IDS.class }],
    ]) {
        const events = [];
        const res = makeResponse();
        const subjectRecords = [{ _id: IDS.subject }, { _id: IDS.nextSubject }];

        await withStubs([
            [Subject, "find", () => queryReturning(subjectRecords)],
            [GameActivity, "updateMany", async (archiveFilter, update) => {
                events.push({ type: "archive", filter: archiveFilter, update });
                return { modifiedCount: 2 };
            }],
            [Subject, "deleteMany", async (deleteFilter) => {
                events.push({ type: "delete-subjects", filter: deleteFilter });
                return { deletedCount: 2 };
            }],
            [Teacher, "updateMany", async () => ({ modifiedCount: 1 })],
            [Student, "updateMany", async () => ({ modifiedCount: 1 })],
        ], async () => {
            await ({ deleteSubjects, deleteSubjectsByClass })[operation](
                { params: { id: operation === "deleteSubjects" ? IDS.school : IDS.class } },
                res
            );
        });

        assert.equal(events[0].type, "archive");
        assert.deepEqual(events[0].filter, {
            subject: { $in: [IDS.subject, IDS.nextSubject] },
            status: { $ne: "archived" },
        });
        assert.equal(events[0].update.$set.archiveReason, "subject_deleted");
        assert.equal(events[1].type, "delete-subjects");
        assert.deepEqual(events[1].filter, filter);
    }
});

test("Teacher reassignment archives only activities outside the new assignment before updating it", async () => {
    const events = [];
    const teacher = {
        _id: IDS.teacher,
        school: IDS.school,
        teachSclass: IDS.class,
        teachSubject: IDS.subject,
    };
    const nextSubject = {
        _id: IDS.nextSubject,
        school: IDS.school,
        sclassName: IDS.class,
        teacher: null,
    };
    const updatedTeacher = { ...teacher, teachSubject: IDS.nextSubject };
    const res = makeResponse();

    await withStubs([
        [Teacher, "findById", async () => teacher],
        [Subject, "findById", async () => nextSubject],
        [GameActivity, "updateMany", async (filter, update) => {
            events.push({ type: "archive", filter, update });
            return { modifiedCount: 1 };
        }],
        [Teacher, "findByIdAndUpdate", async () => {
            events.push({ type: "update-teacher" });
            return updatedTeacher;
        }],
        [Subject, "updateOne", async (filter, update) => {
            events.push({ type: "update-subject", filter, update });
            return { modifiedCount: 1 };
        }],
    ], async () => {
        await updateTeacherSubject({
            body: { teacherId: IDS.teacher, teachSubject: IDS.nextSubject },
        }, res);
    });

    assert.equal(res.body, updatedTeacher);
    assert.equal(events[0].type, "archive");
    assert.deepEqual(events[0].filter, {
        createdByTeacher: IDS.teacher,
        $or: [
            { school: { $ne: IDS.school } },
            { class: { $ne: IDS.class } },
            { subject: { $ne: IDS.nextSubject } },
        ],
        status: { $ne: "archived" },
    });
    assert.equal(events[0].update.$set.archiveReason, "teacher_reassigned");
    assert.equal(events[1].type, "update-teacher");
    assert.equal(events[2].type, "update-subject");
    assert.equal(events[3].type, "update-subject");
});

test("deleting one Teacher archives activities by creator before deleting the Teacher", async () => {
    const events = [];
    const teacher = { _id: IDS.teacher };
    const res = makeResponse();

    await withStubs([
        [Teacher, "findById", async () => teacher],
        [GameActivity, "updateMany", async (filter, update) => {
            events.push({ type: "archive", filter, update });
            return { modifiedCount: 1 };
        }],
        [Teacher, "findByIdAndDelete", async () => {
            events.push({ type: "delete-teacher" });
            return teacher;
        }],
        [Subject, "updateOne", async () => ({ modifiedCount: 1 })],
    ], async () => {
        await deleteTeacher({ params: { id: IDS.teacher } }, res);
    });

    assert.equal(res.body, teacher);
    assert.equal(events[0].type, "archive");
    assert.deepEqual(events[0].filter, {
        createdByTeacher: IDS.teacher,
        status: { $ne: "archived" },
    });
    assert.equal(events[0].update.$set.archiveReason, "teacher_deleted");
    assert.equal(events[1].type, "delete-teacher");
});

test("bulk Teacher deletion archives all selected creators before deleting them", async () => {
    const events = [];
    const teacherRecords = [{ _id: IDS.teacher }, { _id: IDS.otherTeacher }];
    const res = makeResponse();

    await withStubs([
        [Teacher, "find", () => queryReturning(teacherRecords)],
        [GameActivity, "updateMany", async (filter, update) => {
            events.push({ type: "archive", filter, update });
            return { modifiedCount: 2 };
        }],
        [Teacher, "deleteMany", async () => {
            events.push({ type: "delete-teachers" });
            return { deletedCount: 2 };
        }],
        [Subject, "updateMany", async () => ({ modifiedCount: 2 })],
    ], async () => {
        await deleteTeachers({ params: { id: IDS.school } }, res);
    });

    assert.equal(events[0].type, "archive");
    assert.deepEqual(events[0].filter, {
        createdByTeacher: { $in: [IDS.teacher, IDS.otherTeacher] },
        status: { $ne: "archived" },
    });
    assert.equal(events[0].update.$set.archiveReason, "teacher_deleted");
    assert.equal(events[1].type, "delete-teachers");
});

test("bulk Teacher deletion by Class uses the Teacher assignment field and archives selected creators", async () => {
    const events = [];
    const teacherRecords = [{ _id: IDS.teacher }];
    const res = makeResponse();

    await withStubs([
        [Teacher, "find", (filter) => {
            events.push({ type: "find-teachers", filter });
            return queryReturning(teacherRecords);
        }],
        [GameActivity, "updateMany", async (filter, update) => {
            events.push({ type: "archive", filter, update });
            return { modifiedCount: 1 };
        }],
        [Teacher, "deleteMany", async (filter) => {
            events.push({ type: "delete-teachers", filter });
            return { deletedCount: 1 };
        }],
        [Subject, "updateMany", async () => ({ modifiedCount: 1 })],
    ], async () => {
        await deleteTeachersByClass({ params: { id: IDS.class } }, res);
    });

    assert.deepEqual(events[0], {
        type: "find-teachers",
        filter: { teachSclass: IDS.class },
    });
    assert.deepEqual(events[1].filter, {
        createdByTeacher: { $in: [IDS.teacher] },
        status: { $ne: "archived" },
    });
    assert.equal(events[1].update.$set.archiveReason, "teacher_deleted");
    assert.deepEqual(events[2], {
        type: "delete-teachers",
        filter: { teachSclass: IDS.class },
    });
});
