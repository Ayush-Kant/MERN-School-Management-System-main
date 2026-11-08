const test = require("node:test");
const assert = require("node:assert/strict");
const {
    createAdminGameActivityController,
    escapeRegExp,
} = require("../controllers/admin-game-activity-controller");

const SCHOOL_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_SCHOOL_ID = "ffffffffffffffffffffffff";
const CLASS_ID = "cccccccccccccccccccccccc";
const SUBJECT_ID = "dddddddddddddddddddddddd";
const TEACHER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const ACTIVITY_ID = "111111111111111111111111";

const validClass = { _id: CLASS_ID, school: SCHOOL_ID, sclassName: "Class 8" };
const validSubject = {
    _id: SUBJECT_ID,
    school: SCHOOL_ID,
    sclassName: CLASS_ID,
    subName: "Science",
    subCode: "SCI",
};
const validTeacher = { _id: TEACHER_ID, school: SCHOOL_ID, name: "Teacher One" };

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

function queryResult(data, calls, label) {
    const query = {
        select(projection) {
            calls[label + "Projection"] = projection;
            return this;
        },
        sort(sort) {
            calls[label + "Sort"] = sort;
            return this;
        },
        populate(path, projection) {
            calls.populate.push({ path, projection });
            return this;
        },
        skip(value) {
            calls.skip = value;
            return this;
        },
        limit(value) {
            calls.limit = value;
            return this;
        },
        async exec() {
            return data;
        },
    };
    return query;
}

function makeHarness(overrides = {}) {
    const calls = {
        activityFilter: null,
        countFilters: [],
        populate: [],
        skip: null,
        limit: null,
        sort: null,
        transitionFilter: null,
        transitionUpdate: null,
        transitionOptions: null,
        existingFilter: null,
    };

    const classes = Object.hasOwn(overrides, "classes")
        ? overrides.classes
        : [validClass];
    const subjects = Object.hasOwn(overrides, "subjects")
        ? overrides.subjects
        : [validSubject];
    const teachers = Object.hasOwn(overrides, "teachers")
        ? overrides.teachers
        : [validTeacher];

    const GameActivityModel = {
        find(filter) {
            calls.activityFilter = filter;
            return queryResult(overrides.activities || [], calls, "activities");
        },
        async countDocuments(filter) {
            calls.countFilters.push(filter);
            if (typeof overrides.countDocuments === "function") {
                return overrides.countDocuments(filter);
            }
            if (filter.status === "draft") return 2;
            if (filter.status === "published") return 3;
            if (filter.status === "archived") return 1;
            return 4;
        },
        async findOneAndUpdate(filter, update, options) {
            calls.transitionFilter = filter;
            calls.transitionUpdate = update;
            calls.transitionOptions = options;
            if (overrides.transitionError) throw overrides.transitionError;
            return overrides.transitionResult || null;
        },
        async findOne(filter) {
            calls.existingFilter = filter;
            return Object.hasOwn(overrides, "existingActivity")
                ? overrides.existingActivity
                : null;
        },
    };

    const SclassModel = {
        async findById(id) {
            if (Object.hasOwn(overrides, "classById")) return overrides.classById;
            return id === CLASS_ID ? validClass : null;
        },
        find(filter) {
            calls.classFilter = filter;
            return queryResult(classes, calls, "classes");
        },
    };
    const SubjectModel = {
        async findById(id) {
            if (Object.hasOwn(overrides, "subjectById")) return overrides.subjectById;
            return id === SUBJECT_ID ? validSubject : null;
        },
        find(filter) {
            calls.subjectFilter = filter;
            return queryResult(subjects, calls, "subjects");
        },
    };
    const TeacherModel = {
        async findById(id) {
            if (Object.hasOwn(overrides, "teacherById")) return overrides.teacherById;
            return id === TEACHER_ID ? validTeacher : null;
        },
        find(filter) {
            calls.teacherFilter = filter;
            return queryResult(teachers, calls, "teachers");
        },
    };

    const controller = createAdminGameActivityController({
        GameActivityModel,
        SclassModel,
        SubjectModel,
        TeacherModel,
    });

    return { controller, calls };
}

function adminRequest(extra = {}) {
    return {
        actor: { userId: SCHOOL_ID, schoolId: SCHOOL_ID, role: "Admin" },
        query: {},
        params: {},
        ...extra,
    };
}

test("lists the signed-in school's catalogue, status summary, and school-scoped filter options", async () => {
    const activity = {
        _id: ACTIVITY_ID,
        title: "Fractions Challenge",
        status: "published",
    };
    const { controller, calls } = makeHarness({ activities: [activity] });
    const res = makeResponse();

    await controller.adminGameActivityList(adminRequest(), res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.activities, [activity]);
    assert.deepEqual(res.body.pagination, {
        page: 1,
        limit: 25,
        total: 4,
        totalPages: 1,
    });
    assert.deepEqual(res.body.summary, {
        total: 6,
        draft: 2,
        published: 3,
        archived: 1,
    });
    assert.deepEqual(res.body.filters.classes, [validClass]);
    assert.deepEqual(res.body.filters.subjects, [validSubject]);
    assert.deepEqual(res.body.filters.teachers, [validTeacher]);
    assert.deepEqual(calls.activityFilter, { school: SCHOOL_ID });
    assert.deepEqual(calls.classFilter, { school: SCHOOL_ID });
    assert.deepEqual(calls.subjectFilter, { school: SCHOOL_ID });
    assert.deepEqual(calls.teacherFilter, { school: SCHOOL_ID });
    assert.deepEqual(calls.populate, [
        { path: "class", projection: "sclassName" },
        { path: "subject", projection: "subName subCode" },
        { path: "createdByTeacher", projection: "name" },
    ]);
});

test("applies class, subject, teacher, status, provider, search, and pagination filters", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.adminGameActivityList(adminRequest({
        query: {
            classId: CLASS_ID,
            subjectId: SUBJECT_ID,
            teacherId: TEACHER_ID,
            status: "published",
            provider: "wordwall",
            search: "A+B",
            page: "2",
            limit: "10",
        },
    }), res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls.activityFilter, {
        school: SCHOOL_ID,
        class: CLASS_ID,
        subject: SUBJECT_ID,
        createdByTeacher: TEACHER_ID,
        status: "published",
        provider: "wordwall",
        $or: [
            { title: /A\+B/i },
            { description: /A\+B/i },
            { topic: /A\+B/i },
        ],
    });
    assert.equal(calls.skip, 10);
    assert.equal(calls.limit, 10);
    assert.deepEqual(calls.countFilters[0], calls.activityFilter);
});

test("rejects a class filter belonging to another school before querying activities", async () => {
    const { controller, calls } = makeHarness({
        classById: { ...validClass, school: OTHER_SCHOOL_ID },
    });
    const res = makeResponse();

    await controller.adminGameActivityList(adminRequest({
        query: { classId: CLASS_ID },
    }), res);

    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Class not found in this school/);
    assert.equal(calls.activityFilter, null);
});

test("rejects a subject from another school or a different selected class", async () => {
    const cases = [
        { subjectById: { ...validSubject, school: OTHER_SCHOOL_ID }, query: { subjectId: SUBJECT_ID } },
        {
            subjectById: { ...validSubject, sclassName: "999999999999999999999999" },
            query: { classId: CLASS_ID, subjectId: SUBJECT_ID },
        },
    ];

    for (const item of cases) {
        const { controller, calls } = makeHarness(item);
        const res = makeResponse();
        await controller.adminGameActivityList(adminRequest({ query: item.query }), res);
        assert.equal(res.statusCode, 404);
        assert.equal(calls.activityFilter, null);
    }
});

test("rejects a teacher filter belonging to another school", async () => {
    const { controller, calls } = makeHarness({
        teacherById: { ...validTeacher, school: OTHER_SCHOOL_ID },
    });
    const res = makeResponse();

    await controller.adminGameActivityList(adminRequest({
        query: { teacherId: TEACHER_ID },
    }), res);

    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Teacher not found in this school/);
    assert.equal(calls.activityFilter, null);
});

test("does not accept a client-supplied school override or unsupported filters", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.adminGameActivityList(adminRequest({
        query: { schoolId: OTHER_SCHOOL_ID },
    }), res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Unsupported filter/);
    assert.equal(calls.activityFilter, null);
});

test("rejects invalid filter values and pagination bounds", async () => {
    const cases = [
        { status: "removed" },
        { provider: "unknown" },
        { classId: "not-an-id" },
        { search: "x".repeat(101) },
        { page: "0" },
        { limit: "101" },
    ];

    for (const query of cases) {
        const { controller, calls } = makeHarness();
        const res = makeResponse();
        await controller.adminGameActivityList(adminRequest({ query }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(calls.activityFilter, null);
    }
});

test("rejects non-Admin actors and Admin actor contexts with mismatched school identity", async () => {
    const cases = [
        { actor: { userId: TEACHER_ID, schoolId: SCHOOL_ID, role: "Teacher" } },
        { actor: { userId: SCHOOL_ID, schoolId: OTHER_SCHOOL_ID, role: "Admin" } },
        { actor: { userId: "bad-id", schoolId: SCHOOL_ID, role: "Admin" } },
    ];

    for (const actor of cases) {
        const { controller, calls } = makeHarness();
        const res = makeResponse();
        await controller.adminGameActivityList(adminRequest({ actor }), res);
        assert.ok([401, 403].includes(res.statusCode));
        assert.equal(calls.activityFilter, null);
    }
});

test("unpublishes a published activity atomically within the Admin's school", async () => {
    const { controller, calls } = makeHarness({
        transitionResult: { _id: ACTIVITY_ID, status: "draft" },
    });
    const res = makeResponse();

    await controller.adminUnpublishGameActivity(adminRequest({
        params: { id: ACTIVITY_ID },
    }), res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, "draft");
    assert.deepEqual(calls.transitionFilter, {
        _id: ACTIVITY_ID,
        school: SCHOOL_ID,
        status: "published",
    });
    assert.equal(calls.transitionUpdate.$set.status, "draft");
    assert.ok(calls.transitionUpdate.$set.unpublishedAt instanceof Date);
    assert.deepEqual(calls.transitionOptions, { new: true, runValidators: true });
    assert.equal(calls.existingFilter, null);
});

test("archives a published activity atomically with manual archive metadata", async () => {
    const { controller, calls } = makeHarness({
        transitionResult: { _id: ACTIVITY_ID, status: "archived" },
    });
    const res = makeResponse();

    await controller.adminArchiveGameActivity(adminRequest({
        params: { id: ACTIVITY_ID },
    }), res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, "archived");
    assert.deepEqual(calls.transitionFilter, {
        _id: ACTIVITY_ID,
        school: SCHOOL_ID,
        status: "published",
    });
    assert.equal(calls.transitionUpdate.$set.status, "archived");
    assert.ok(calls.transitionUpdate.$set.archivedAt instanceof Date);
    assert.equal(calls.transitionUpdate.$set.archiveReason, "manual");
});

test("returns 404 for records outside the Admin's school and 409 for non-published records", async () => {
    const cases = [
        { existingActivity: null, expected: 404 },
        { existingActivity: { _id: ACTIVITY_ID, status: "draft" }, expected: 409 },
        { existingActivity: { _id: ACTIVITY_ID, status: "archived" }, expected: 409 },
    ];

    for (const item of cases) {
        const { controller, calls } = makeHarness(item);
        const res = makeResponse();
        await controller.adminArchiveGameActivity(adminRequest({
            params: { id: ACTIVITY_ID },
        }), res);
        assert.equal(res.statusCode, item.expected);
        assert.deepEqual(calls.existingFilter, {
            _id: ACTIVITY_ID,
            school: SCHOOL_ID,
        });
    }
});

test("rejects malformed activity IDs before attempting a transition", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.adminArchiveGameActivity(adminRequest({
        params: { id: "invalid" },
    }), res);

    assert.equal(res.statusCode, 400);
    assert.equal(calls.transitionFilter, null);
});

test("escapes regular-expression metacharacters in catalogue search input", () => {
    assert.equal(escapeRegExp("a+b(c)"), "a\\+b\\(c\\)");
});
