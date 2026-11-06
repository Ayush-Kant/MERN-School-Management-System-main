const test = require("node:test");
const assert = require("node:assert/strict");
const { createGameActivityController } = require("../controllers/game-activity-controller");

const SCHOOL_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_SCHOOL_ID = "ffffffffffffffffffffffff";
const TEACHER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const OTHER_TEACHER_ID = "eeeeeeeeeeeeeeeeeeeeeeee";
const STUDENT_ID = "eeeeeeeeeeeeeeeeeeeeeeee";
const CLASS_ID = "cccccccccccccccccccccccc";
const OTHER_CLASS_ID = "999999999999999999999999";
const SUBJECT_ID = "dddddddddddddddddddddddd";
const ACTIVITY_ID = "111111111111111111111111";
const NUMERIC_HEX_ID = "1234567890abcdef12345678";

const validTeacher = {
    _id: TEACHER_ID,
    school: SCHOOL_ID,
    teachSclass: CLASS_ID,
    teachSubject: SUBJECT_ID,
};
const validClass = { _id: CLASS_ID, school: SCHOOL_ID };
const validStudent = { _id: STUDENT_ID, school: SCHOOL_ID, sclassName: CLASS_ID };
const validSubject = {
    _id: SUBJECT_ID,
    school: SCHOOL_ID,
    sclassName: CLASS_ID,
    teacher: TEACHER_ID,
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
    };
}

function makeHarness(overrides = {}) {
    const calls = {
        teacherLookup: [],
        schoolLookup: [],
        studentLookup: [],
        classLookup: [],
        subjectLookup: [],
        createdData: null,
        listFilter: null,
        populated: [],
        sort: null,
        transitionFilter: null,
        transitionUpdate: null,
        transitionOptions: null,
        ownedLookupFilter: null,
    };

    const teacher = Object.hasOwn(overrides, "teacher") ? overrides.teacher : validTeacher;
    const schoolClass = Object.hasOwn(overrides, "schoolClass") ? overrides.schoolClass : validClass;
    const subject = Object.hasOwn(overrides, "subject") ? overrides.subject : validSubject;
    const student = Object.hasOwn(overrides, "student") ? overrides.student : validStudent;

    class FakeGameActivity {
        constructor(data) {
            calls.createdData = data;
        }

        async save() {
            if (overrides.saveError) throw overrides.saveError;
            return { _id: ACTIVITY_ID, ...calls.createdData };
        }

        static async findOneAndUpdate(filter, update, options) {
            calls.transitionFilter = filter;
            calls.transitionUpdate = update;
            calls.transitionOptions = options;
            if (overrides.transitionError) throw overrides.transitionError;
            return overrides.transitionResult || null;
        }

        static async findOne(filter) {
            calls.ownedLookupFilter = filter;
            if (overrides.ownedLookupError) throw overrides.ownedLookupError;
            return Object.hasOwn(overrides, "ownedActivity") ? overrides.ownedActivity : null;
        }

        static find(filter) {
            calls.listFilter = filter;
            return {
                populate(path, fields) {
                    calls.populated.push({ path, fields });
                    return this;
                },
                sort(specification) {
                    calls.sort = specification;
                    return this;
                },
                async exec() {
                    if (overrides.listError) throw overrides.listError;
                    return overrides.listRecords || [];
                },
            };
        }
    }

    const controller = createGameActivityController({
        GameActivityModel: FakeGameActivity,
        AdminModel: {
            async findById(id) {
                calls.schoolLookup.push(id);
                if (Object.hasOwn(overrides, "school")) return overrides.school;
                return { _id: SCHOOL_ID };
            },
        },
        TeacherModel: {
            async findById(id) {
                calls.teacherLookup.push(id);
                if (typeof overrides.findTeacher === "function") {
                    return overrides.findTeacher(id);
                }
                return teacher;
            },
        },
        SclassModel: {
            async findById(id) {
                calls.classLookup.push(id);
                return schoolClass;
            },
        },
        SubjectModel: {
            async findById(id) {
                calls.subjectLookup.push(id);
                return subject;
            },
        },
        StudentModel: {
            async findById(id) {
                calls.studentLookup.push(id);
                return student;
            },
        },
    });

    const originalMethods = { ...controller };
    for (const [methodName, method] of Object.entries(originalMethods)) {
        controller[methodName] = (req, res) => {
            const authenticatedRequest = { ...req };
            if (!Object.prototype.hasOwnProperty.call(authenticatedRequest, "auth")) {
                authenticatedRequest.auth = { userId: TEACHER_ID, role: "Teacher" };
            }
            return method(authenticatedRequest, res);
        };
    }

    return { controller, calls };
}

test("rejects a missing referenced school before creating a GameActivity", async () => {
    const { controller, calls } = makeHarness({ school: null });
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: {
            teacherId: TEACHER_ID,
            title: "Valid title",
            embedUrl: "https://wordwall.net/embed/1",
        },
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "School not found for this Teacher");
    assert.equal(calls.createdData, null);
});

test("creates a draft scoped to the teacher's assigned school, class, and subject", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: {
            teacherId: TEACHER_ID,
            title: "  Fractions Challenge  ",
            description: "  Practise fractions  ",
            embedUrl: "  https://wordwall.net/embed/123456  ",
            topic: "  Fractions  ",
            status: "published",
        },
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body._id, ACTIVITY_ID);
    assert.equal(calls.createdData.title, "Fractions Challenge");
    assert.equal(calls.createdData.description, "Practise fractions");
    assert.equal(calls.createdData.topic, "Fractions");
    assert.equal(calls.createdData.embedUrl, "https://wordwall.net/embed/123456");
    assert.equal(calls.createdData.school, SCHOOL_ID);
    assert.equal(calls.createdData.class, CLASS_ID);
    assert.equal(calls.createdData.subject, SUBJECT_ID);
    assert.equal(calls.createdData.createdByTeacher, TEACHER_ID);
    assert.equal(calls.createdData.status, "draft");
});

test("rejects a missing or malformed teacher id before querying models", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: { teacherId: "not-an-object-id", title: "Valid title", embedUrl: "https://wordwall.net/embed/1" },
    }, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /teacherId/);
    assert.deepEqual(calls.teacherLookup, []);
});

test("rejects invalid Wordwall embed URLs before looking up the teacher", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: { teacherId: TEACHER_ID, title: "Valid title", embedUrl: "https://example.com/embed/1" },
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, "VALIDATION_ERROR");
    assert.match(res.body.message, /Wordwall/);
    assert.deepEqual(calls.teacherLookup, []);
});

test("extracts and validates the src when a teacher submits an official iframe snippet", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: {
            teacherId: TEACHER_ID,
            title: "Fractions Challenge",
            embedUrl: '<iframe width="800" src="https://wordwall.net/embed/123456?themeId=1&amp;templateId=2" allowfullscreen></iframe>',
        },
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(
        calls.createdData.embedUrl,
        "https://wordwall.net/embed/123456?themeId=1&templateId=2"
    );
    assert.equal(calls.createdData.status, "draft");
});

test("returns 404 when the teacher does not exist", async () => {
    const { controller } = makeHarness({ teacher: null });
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: { teacherId: TEACHER_ID, title: "Valid title", embedUrl: "https://wordwall.net/embed/1" },
    }, res);

    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Teacher not found/);
});

test("does not create an activity for a teacher without all assignments", async () => {
    const { controller, calls } = makeHarness({
        teacher: { ...validTeacher, teachSubject: null },
    });
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: { teacherId: TEACHER_ID, title: "Valid title", embedUrl: "https://wordwall.net/embed/1" },
    }, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /assigned to a school, class, and subject/);
    assert.equal(calls.createdData, null);
});

test("rejects a class or subject assigned to a different school or class", async () => {
    const mismatchCases = [
        { schoolClass: { ...validClass, school: OTHER_SCHOOL_ID } },
        { subject: { ...validSubject, school: OTHER_SCHOOL_ID } },
        { subject: { ...validSubject, sclassName: OTHER_CLASS_ID } },
    ];

    for (const overrides of mismatchCases) {
        const { controller, calls } = makeHarness(overrides);
        const res = makeResponse();

        await controller.gameActivityCreate({
            body: { teacherId: TEACHER_ID, title: "Valid title", embedUrl: "https://wordwall.net/embed/1" },
        }, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /same school and class/);
        assert.equal(calls.createdData, null);
    }
});

test("rejects a subject already linked to a different teacher", async () => {
    const { controller } = makeHarness({
        subject: { ...validSubject, teacher: OTHER_TEACHER_ID },
    });
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: { teacherId: TEACHER_ID, title: "Valid title", embedUrl: "https://wordwall.net/embed/1" },
    }, res);

    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /different teacher/);
});

test("returns a client error for Mongoose validation failures", async () => {
    const { controller } = makeHarness({
        saveError: Object.assign(new Error("Activity validation failed"), { name: "ValidationError" }),
    });
    const res = makeResponse();

    await controller.gameActivityCreate({
        body: { teacherId: TEACHER_ID, title: "Valid title", embedUrl: "https://wordwall.net/embed/1" },
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Request data failed validation");
});

test("lists only published activities for student-facing requests and applies scope filters", async () => {
    const { controller, calls } = makeHarness({ listRecords: [{ _id: ACTIVITY_ID }] });
    const res = makeResponse();

    await controller.gameActivityList({
        auth: { userId: STUDENT_ID, role: "Student" },
        params: { id: SCHOOL_ID },
        query: { classId: CLASS_ID, subjectId: SUBJECT_ID },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ _id: ACTIVITY_ID }]);
    assert.deepEqual(calls.listFilter, {
        school: SCHOOL_ID,
        class: CLASS_ID,
        subject: SUBJECT_ID,
        status: "published",
    });
    assert.deepEqual(calls.sort, { createdAt: -1 });
    assert.deepEqual(calls.populated.map(item => item.path), ["class", "subject", "createdByTeacher"]);
});

test("lists a teacher's activities and applies an explicit status filter when supplied", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityList({
        params: { id: SCHOOL_ID },
        query: { teacherId: TEACHER_ID, status: "draft" },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls.listFilter, {
        school: SCHOOL_ID,
        class: CLASS_ID,
        subject: SUBJECT_ID,
        createdByTeacher: TEACHER_ID,
        status: "draft",
    });
});

test("teacher listings without a status include all of that teacher's statuses", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityList({
        params: { id: SCHOOL_ID },
        query: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls.listFilter, {
        school: SCHOOL_ID,
        class: CLASS_ID,
        subject: SUBJECT_ID,
        createdByTeacher: TEACHER_ID,
    });
});

test("rejects invalid ids and disallows draft listing without a teacher context", async () => {
    const cases = [
        { params: { id: "bad-school-id" }, query: {}, expected: 400 },
        { params: { id: SCHOOL_ID }, query: { classId: "bad-class-id" }, expected: 400 },
        { params: { id: SCHOOL_ID }, query: { subjectId: "bad-subject-id" }, expected: 400 },
        { params: { id: SCHOOL_ID }, query: { status: "unknown" }, expected: 400 },
        { params: { id: SCHOOL_ID }, query: { status: "draft" }, auth: { userId: STUDENT_ID, role: "Student" }, expected: 403 },
    ];

    for (const request of cases) {
        const { controller } = makeHarness();
        const res = makeResponse();
        await controller.gameActivityList(request, res);
        assert.equal(res.statusCode, request.expected);
    }
});

test("does not list a teacher's activities outside that teacher's school", async () => {
    const { controller, calls } = makeHarness({
        teacher: { ...validTeacher, school: OTHER_SCHOOL_ID },
    });
    const res = makeResponse();

    await controller.gameActivityList({
        params: { id: SCHOOL_ID },
        query: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Game activities not found for this school");
    assert.equal(calls.listFilter, null);
});

test("returns a generic server error when listing fails", async () => {
    const { controller } = makeHarness({ listError: new Error("database internals") });
    const res = makeResponse();

    await controller.gameActivityList({
        params: { id: SCHOOL_ID },
        query: {},
    }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.code, "INTERNAL_ERROR");
    assert.equal(res.body.message, "Unable to list game activities");
    assert.equal(JSON.stringify(res.body).includes("database internals"), false);
});


test("publishes a draft activity atomically and records publishedAt", async () => {
    const publishedAt = new Date("2026-10-26T08:00:00.000Z");
    const { controller, calls } = makeHarness({
        transitionResult: { _id: ACTIVITY_ID, status: "published", publishedAt },
    });
    const res = makeResponse();

    await controller.publishGameActivity({
        params: { id: ACTIVITY_ID },
        body: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, "published");
    assert.equal(calls.transitionFilter._id, ACTIVITY_ID);
    assert.equal(calls.transitionFilter.createdByTeacher, TEACHER_ID);
    assert.equal(calls.transitionFilter.school, SCHOOL_ID);
    assert.equal(calls.transitionFilter.class, CLASS_ID);
    assert.equal(calls.transitionFilter.subject, SUBJECT_ID);
    assert.equal(calls.transitionFilter.status, "draft");
    assert.equal(calls.transitionUpdate.$set.status, "published");
    assert.ok(calls.transitionUpdate.$set.publishedAt instanceof Date);
    assert.deepEqual(calls.transitionOptions, { new: true, runValidators: true });
    assert.equal(calls.ownedLookupFilter, null);
});

test("archives a published activity without overwriting its original publish timestamp", async () => {
    const { controller, calls } = makeHarness({
        transitionResult: { _id: ACTIVITY_ID, status: "archived" },
    });
    const res = makeResponse();

    await controller.archiveGameActivity({
        params: { id: ACTIVITY_ID },
        body: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, "archived");
    assert.equal(calls.transitionFilter._id, ACTIVITY_ID);
    assert.equal(calls.transitionFilter.createdByTeacher, TEACHER_ID);
    assert.equal(calls.transitionFilter.school, SCHOOL_ID);
    assert.equal(calls.transitionFilter.class, CLASS_ID);
    assert.equal(calls.transitionFilter.subject, SUBJECT_ID);
    assert.equal(calls.transitionFilter.status, "published");
    assert.equal(calls.transitionUpdate.$set.status, "archived");
    assert.ok(calls.transitionUpdate.$set.archivedAt instanceof Date);
    assert.equal(calls.transitionUpdate.$set.archiveReason, "manual");
});

test("rejects invalid activity and teacher ids before querying MongoDB", async () => {
    const cases = [
        { params: { id: "bad-id" }, body: { teacherId: TEACHER_ID } },
        { params: { id: ACTIVITY_ID }, body: { teacherId: "bad-id" } },
    ];

    for (const request of cases) {
        const { controller, calls } = makeHarness();
        const res = makeResponse();

        await controller.publishGameActivity(request, res);

        assert.equal(res.statusCode, 400);
        assert.equal(calls.transitionFilter, null);
        assert.equal(calls.ownedLookupFilter, null);
    }
});

test("returns not found if the activity is missing or not owned by the supplied teacher", async () => {
    const { controller, calls } = makeHarness({ ownedActivity: null });
    const res = makeResponse();

    await controller.publishGameActivity({
        params: { id: ACTIVITY_ID },
        body: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /not found for this teacher/);
    assert.deepEqual(calls.ownedLookupFilter, {
        _id: ACTIVITY_ID,
        createdByTeacher: TEACHER_ID,
        school: SCHOOL_ID,
        class: CLASS_ID,
        subject: SUBJECT_ID,
    });
});

test("rejects publishing non-draft activities and archiving non-published activities", async () => {
    const cases = [
        {
            operation: "publishGameActivity",
            ownedActivity: { status: "published" },
            expectedMessage: /Only draft activities can be published/,
        },
        {
            operation: "publishGameActivity",
            ownedActivity: { status: "archived" },
            expectedMessage: /Only draft activities can be published/,
        },
        {
            operation: "archiveGameActivity",
            ownedActivity: { status: "draft" },
            expectedMessage: /Only published activities can be archived/,
        },
        {
            operation: "archiveGameActivity",
            ownedActivity: { status: "archived" },
            expectedMessage: /Only published activities can be archived/,
        },
    ];

    for (const item of cases) {
        const { controller, calls } = makeHarness({ ownedActivity: item.ownedActivity });
        const res = makeResponse();

        await controller[item.operation]({
            params: { id: ACTIVITY_ID },
            body: { teacherId: TEACHER_ID },
        }, res);

        assert.equal(res.statusCode, 409);
        assert.match(res.body.message, item.expectedMessage);
        assert.ok(calls.transitionFilter);
        assert.ok(calls.ownedLookupFilter);
    }
});

test("returns a generic error if a publish or archive database update fails", async () => {
    const cases = [
        { operation: "publishGameActivity", expectedMessage: "Unable to publish game activity" },
        { operation: "archiveGameActivity", expectedMessage: "Unable to archive game activity" },
    ];

    for (const item of cases) {
        const { controller } = makeHarness({
            transitionError: new Error("private database diagnostic"),
        });
        const res = makeResponse();

        await controller[item.operation]({
            params: { id: ACTIVITY_ID },
            body: { teacherId: TEACHER_ID },
        }, res);

        assert.equal(res.statusCode, 500);
        assert.equal(res.body.message, item.expectedMessage);
        assert.equal(JSON.stringify(res.body).includes("private database diagnostic"), false);
    }
});


test("accepts valid ObjectIds containing digits", async () => {
    const { controller, calls } = makeHarness({
        teacher: { ...validTeacher, school: NUMERIC_HEX_ID },
        schoolClass: { ...validClass, school: NUMERIC_HEX_ID },
        subject: { ...validSubject, school: NUMERIC_HEX_ID },
        listRecords: [],
    });
    const res = makeResponse();

    await controller.gameActivityList({
        params: { id: NUMERIC_HEX_ID },
        query: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls.listFilter, {
        school: NUMERIC_HEX_ID,
        class: CLASS_ID,
        subject: SUBJECT_ID,
        createdByTeacher: TEACHER_ID,
    });
});

test("rejects a game request when the server-side session is missing", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityCreate({
        auth: null,
        body: { title: "Valid title", embedUrl: "https://wordwall.net/embed/1" },
    }, res);

    assert.equal(res.statusCode, 401);
    assert.equal(calls.teacherLookup.length, 0);
});

test("does not let a teacher create or transition games as another teacher", async () => {
    const createHarness = makeHarness();
    const createRes = makeResponse();
    await createHarness.controller.gameActivityCreate({
        body: {
            teacherId: OTHER_TEACHER_ID,
            title: "Valid title",
            embedUrl: "https://wordwall.net/embed/1",
        },
    }, createRes);

    assert.equal(createRes.statusCode, 403);
    assert.equal(createHarness.calls.teacherLookup.length, 0);

    const transitionHarness = makeHarness();
    const transitionRes = makeResponse();
    await transitionHarness.controller.publishGameActivity({
        params: { id: ACTIVITY_ID },
        body: { teacherId: OTHER_TEACHER_ID },
    }, transitionRes);

    assert.equal(transitionRes.statusCode, 403);
    assert.equal(transitionHarness.calls.transitionFilter, null);
});

test("does not let a student list another class's games", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityList({
        auth: { userId: STUDENT_ID, role: "Student" },
        params: { id: SCHOOL_ID },
        query: { classId: OTHER_CLASS_ID },
    }, res);

    assert.equal(res.statusCode, 403);
    assert.equal(calls.listFilter, null);
});

test("does not let a teacher list games from another school", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.gameActivityList({
        params: { id: OTHER_SCHOOL_ID },
        query: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(calls.listFilter, null);
});


test("updates only a teacher-owned draft and records the scoped update", async () => {
    const { controller, calls } = makeHarness({
        transitionResult: { _id: ACTIVITY_ID, title: "Updated Fractions", status: "draft" },
    });
    const res = makeResponse();

    await controller.gameActivityUpdate({
        params: { id: ACTIVITY_ID },
        body: {
            teacherId: TEACHER_ID,
            title: "  Updated Fractions  ",
            description: "  Revised practice  ",
            topic: "  Equivalent fractions  ",
            embedUrl: "https://wordwall.net/embed/987654",
            originalUrl: "  https://wordwall.net/resource/987654  ",
        },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.title, "Updated Fractions");
    assert.deepEqual(calls.transitionFilter, {
        _id: ACTIVITY_ID,
        createdByTeacher: TEACHER_ID,
        school: SCHOOL_ID,
        class: CLASS_ID,
        subject: SUBJECT_ID,
        status: "draft",
    });
    assert.deepEqual(calls.transitionUpdate, {
        $set: {
            title: "Updated Fractions",
            description: "Revised practice",
            topic: "Equivalent fractions",
            embedUrl: "https://wordwall.net/embed/987654",
            originalUrl: "https://wordwall.net/resource/987654",
        },
    });
    assert.deepEqual(calls.transitionOptions, { new: true, runValidators: true });
});

test("rejects update attempts to change lifecycle, ownership, or scope fields", async () => {
    const invalidBodies = [
        { status: "published" },
        { school: OTHER_SCHOOL_ID },
        { class: OTHER_CLASS_ID },
        { subject: SUBJECT_ID },
        { createdByTeacher: OTHER_TEACHER_ID },
        { provider: "custom" },
    ];

    for (const body of invalidBodies) {
        const { controller, calls } = makeHarness();
        const res = makeResponse();
        await controller.gameActivityUpdate({
            params: { id: ACTIVITY_ID },
            body,
        }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(calls.transitionFilter, null);
        assert.equal(calls.ownedLookupFilter, null);
    }
});

test("rejects empty, invalid, and mismatched update requests before persistence", async () => {
    const cases = [
        { body: {} },
        { body: { title: "x" } },
        { body: { description: 12 } },
        { body: { topic: "x".repeat(161) } },
        { body: { embedUrl: "https://example.com/embed/123" } },
        { body: { originalUrl: "x".repeat(2049) } },
        { body: { teacherId: OTHER_TEACHER_ID, title: "A valid title" }, expected: 403 },
    ];

    for (const item of cases) {
        const { controller, calls } = makeHarness();
        const res = makeResponse();
        await controller.gameActivityUpdate({
            params: { id: ACTIVITY_ID },
            body: item.body,
        }, res);
        assert.equal(res.statusCode, item.expected || 400);
        assert.equal(calls.transitionFilter, null);
    }
});

test("prevents editing published or archived activities until their lifecycle permits it", async () => {
    for (const item of [
        { status: "published", expected: /Unpublish the activity before editing/ },
        { status: "archived", expected: /Archived activities cannot be edited/ },
    ]) {
        const { controller, calls } = makeHarness({ ownedActivity: item });
        const res = makeResponse();
        await controller.gameActivityUpdate({
            params: { id: ACTIVITY_ID },
            body: { title: "Updated title" },
        }, res);
        assert.equal(res.statusCode, 409);
        assert.match(res.body.message, item.expected);
        assert.deepEqual(calls.ownedLookupFilter, {
            _id: ACTIVITY_ID,
            createdByTeacher: TEACHER_ID,
            school: SCHOOL_ID,
            class: CLASS_ID,
            subject: SUBJECT_ID,
        });
    }
});

test("unpublishes a published activity back to draft and records unpublishedAt", async () => {
    const { controller, calls } = makeHarness({
        transitionResult: {
            _id: ACTIVITY_ID,
            status: "draft",
            unpublishedAt: new Date("2026-11-06T08:00:00.000Z"),
        },
    });
    const res = makeResponse();

    await controller.unpublishGameActivity({
        params: { id: ACTIVITY_ID },
        body: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, "draft");
    assert.equal(calls.transitionFilter.status, "published");
    assert.equal(calls.transitionFilter.createdByTeacher, TEACHER_ID);
    assert.equal(calls.transitionFilter.school, SCHOOL_ID);
    assert.equal(calls.transitionFilter.class, CLASS_ID);
    assert.equal(calls.transitionFilter.subject, SUBJECT_ID);
    assert.equal(calls.transitionUpdate.$set.status, "draft");
    assert.ok(calls.transitionUpdate.$set.unpublishedAt instanceof Date);
    assert.deepEqual(calls.transitionOptions, { new: true, runValidators: true });
});

test("rejects unpublishing a draft or archived activity", async () => {
    for (const status of ["draft", "archived"]) {
        const { controller } = makeHarness({ ownedActivity: { status } });
        const res = makeResponse();
        await controller.unpublishGameActivity({
            params: { id: ACTIVITY_ID },
            body: { teacherId: TEACHER_ID },
        }, res);
        assert.equal(res.statusCode, 409);
        assert.match(res.body.message, /Only published activities can be unpublished/);
    }
});

test("denies Student and Admin update/unpublish actions", async () => {
    for (const role of ["Student", "Admin"]) {
        const { controller, calls } = makeHarness();
        const updateRes = makeResponse();
        await controller.gameActivityUpdate({
            auth: { userId: STUDENT_ID, role },
            params: { id: ACTIVITY_ID },
            body: { title: "Updated title" },
        }, updateRes);
        assert.equal(updateRes.statusCode, 403);
        assert.equal(calls.transitionFilter, null);

        const unpublishRes = makeResponse();
        await controller.unpublishGameActivity({
            auth: { userId: STUDENT_ID, role },
            params: { id: ACTIVITY_ID },
            body: {},
        }, unpublishRes);
        assert.equal(unpublishRes.statusCode, 403);
        assert.equal(calls.transitionFilter, null);
    }
});
