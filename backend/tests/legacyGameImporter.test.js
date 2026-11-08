const test = require("node:test");
const assert = require("node:assert/strict");
const catalog = require("../seeds/chemamaze-cbse-games.json");
const {
    DEVELOPMENT_DATABASE_NAME,
    APPLY_CONFIRMATION,
    validateDevelopmentImportTarget,
    prepareLegacyGameImport,
    applyLegacyGameImport,
} = require("../services/learning/legacyGameImporter");

const SCHOOL_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

const assignmentIds = {
    "6|Science": { classId: "111111111111111111111111", subjectId: "111111111111111111111112", teacherId: "111111111111111111111113" },
    "6|Mathematics": { classId: "111111111111111111111111", subjectId: "111111111111111111111114", teacherId: "111111111111111111111115" },
    "7|Science": { classId: "222222222222222222222221", subjectId: "222222222222222222222222", teacherId: "222222222222222222222223" },
    "7|Mathematics": { classId: "222222222222222222222221", subjectId: "222222222222222222222224", teacherId: "222222222222222222222225" },
    "8|Science": { classId: "333333333333333333333331", subjectId: "333333333333333333333332", teacherId: "333333333333333333333333" },
    "8|Mathematics": { classId: "333333333333333333333331", subjectId: "333333333333333333333334", teacherId: "333333333333333333333335" },
};

function createTargets(overrides = {}) {
    const assignments = {};
    for (const [key, ids] of Object.entries(assignmentIds)) {
        const [gradeText] = key.split("|");
        assignments[key] = {
            grade: Number(gradeText),
            className: "Class " + gradeText,
            ...ids,
            ...(overrides[key] || {}),
        };
    }

    return {
        schoolId: SCHOOL_ID,
        assignments,
    };
}

function createModels(overrides = {}) {
    const school = { _id: SCHOOL_ID, schoolName: "Development School" };
    const classes = new Map();
    const subjects = new Map();
    const teachers = new Map();
    const records = new Map();
    const created = [];

    for (const [key, ids] of Object.entries(assignmentIds)) {
        const [gradeText, subjectName] = key.split("|");
        if (!classes.has(ids.classId)) {
            classes.set(ids.classId, {
                _id: ids.classId,
                school: SCHOOL_ID,
                sclassName: "Class " + gradeText,
            });
        }
        subjects.set(ids.subjectId, {
            _id: ids.subjectId,
            school: SCHOOL_ID,
            sclassName: ids.classId,
            subName: subjectName,
            teacher: ids.teacherId,
        });
        teachers.set(ids.teacherId, {
            _id: ids.teacherId,
            school: SCHOOL_ID,
            teachSclass: ids.classId,
            teachSubject: ids.subjectId,
        });
    }

    const GameActivityModel = {
        findOne(filter) {
            const key = String(filter.school) + "|" + filter["legacySource.sourceKey"];
            return {
                lean() {
                    return Promise.resolve(records.get(key) || null);
                },
            };
        },
        async create(document) {
            const key = String(document.school) + "|" + document.legacySource.sourceKey;
            if (records.has(key)) {
                const error = new Error("duplicate key");
                error.code = 11000;
                throw error;
            }
            const saved = { ...document };
            records.set(key, saved);
            created.push(saved);
            return saved;
        },
    };

    return {
        models: {
            AdminModel: {
                async findById(id) {
                    if (overrides.schoolMissing || String(id) !== SCHOOL_ID) return null;
                    return school;
                },
            },
            SclassModel: {
                async findById(id) {
                    return overrides.classOverrides?.[String(id)] || classes.get(String(id)) || null;
                },
            },
            SubjectModel: {
                async findById(id) {
                    return overrides.subjectOverrides?.[String(id)] || subjects.get(String(id)) || null;
                },
            },
            TeacherModel: {
                async findById(id) {
                    return overrides.teacherOverrides?.[String(id)] || teachers.get(String(id)) || null;
                },
            },
            GameActivityModel,
        },
        GameActivityModel,
        records,
        created,
        school,
        classes,
        subjects,
        teachers,
    };
}

test("development import is blocked outside the dedicated development database", () => {
    assert.throws(
        () => validateDevelopmentImportTarget({
            nodeEnv: "production",
            databaseName: DEVELOPMENT_DATABASE_NAME,
        }),
        /NODE_ENV=development/
    );

    assert.throws(
        () => validateDevelopmentImportTarget({
            nodeEnv: "development",
            databaseName: "school_management",
        }),
        /school_management_dev/
    );
});

test("apply mode requires the explicit development import confirmation", () => {
    assert.throws(
        () => validateDevelopmentImportTarget({
            nodeEnv: "development",
            databaseName: DEVELOPMENT_DATABASE_NAME,
            apply: true,
            confirmation: "yes",
        }),
        /CHEMAMAZE_SEED_CONFIRM/
    );

    assert.doesNotThrow(
        () => validateDevelopmentImportTarget({
            nodeEnv: "development",
            databaseName: DEVELOPMENT_DATABASE_NAME,
            apply: true,
            confirmation: APPLY_CONFIRMATION,
        })
    );
});

test("prepares all 18 entries using verified school/class/subject/teacher assignments", async () => {
    const fake = createModels();
    const targets = createTargets();

    const plan = await prepareLegacyGameImport({
        catalog,
        schoolId: targets.schoolId,
        assignments: targets.assignments,
        models: fake.models,
    });

    assert.equal(plan.total, 18);
    assert.equal(plan.toInsert.length, 18);
    assert.equal(plan.alreadyPresent.length, 0);
    assert.equal(plan.conflicts.length, 0);
    assert.equal(fake.created.length, 0, "Planning must not write records");

    const scienceClass6 = plan.toInsert.find((item) =>
        item.sourceKey === "chemamaze-cbse:science:class-6:chapter-1"
    ).document;

    assert.equal(scienceClass6.school, SCHOOL_ID);
    assert.equal(scienceClass6.class, assignmentIds["6|Science"].classId);
    assert.equal(scienceClass6.subject, assignmentIds["6|Science"].subjectId);
    assert.equal(scienceClass6.createdByTeacher, assignmentIds["6|Science"].teacherId);
    assert.equal(scienceClass6.status, "draft");
    assert.equal(scienceClass6.originalUrl, catalog.records[0].originalUrl);
    assert.equal(scienceClass6.embedUrl, catalog.records[0].embedUrl);
    assert.equal(scienceClass6.legacySource.grade, 6);
    assert.equal(scienceClass6.legacySource.chapter, "Chapter 1");
});

test("rejects a teacher who is not assigned to the target class and subject", async () => {
    const wrongTeacher = {
        _id: assignmentIds["6|Science"].teacherId,
        school: SCHOOL_ID,
        teachSclass: assignmentIds["6|Science"].classId,
        teachSubject: assignmentIds["6|Mathematics"].subjectId,
    };
    const fake = createModels({
        teacherOverrides: {
            [wrongTeacher._id]: wrongTeacher,
        },
    });
    const targets = createTargets();

    await assert.rejects(
        prepareLegacyGameImport({
            catalog,
            schoolId: targets.schoolId,
            assignments: targets.assignments,
            models: fake.models,
        }),
        /Teacher assignment for 6\|Science is invalid/
    );
});

test("rejects cross-school class, wrong subject, and mismatched class-name mappings", async () => {
    const targets = createTargets();
    const foreignClassId = assignmentIds["6|Science"].classId;
    const foreignClass = {
        _id: foreignClassId,
        school: "ffffffffffffffffffffffff",
        sclassName: "Class 6",
    };
    const classModels = createModels({ classOverrides: { [foreignClassId]: foreignClass } });

    await assert.rejects(
        prepareLegacyGameImport({
            catalog,
            schoolId: targets.schoolId,
            assignments: targets.assignments,
            models: classModels.models,
        }),
        /does not belong to the selected development school/
    );

    const wrongClassNameModels = createModels();
    const wrongTargets = createTargets({
        "6|Science": { className: "Class 7" },
    });

    await assert.rejects(
        prepareLegacyGameImport({
            catalog,
            schoolId: wrongTargets.schoolId,
            assignments: wrongTargets.assignments,
            models: wrongClassNameModels.models,
        }),
        /Class name mismatch/
    );
});

test("requires a complete six-scope assignment map", async () => {
    const fake = createModels();
    const targets = createTargets();
    delete targets.assignments["8|Mathematics"];

    await assert.rejects(
        prepareLegacyGameImport({
            catalog,
            schoolId: targets.schoolId,
            assignments: targets.assignments,
            models: fake.models,
        }),
        /must contain exactly/
    );
});

test("applies the seed once and treats a repeat run as unchanged", async () => {
    const fake = createModels();
    const targets = createTargets();
    const firstPlan = await prepareLegacyGameImport({
        catalog,
        schoolId: targets.schoolId,
        assignments: targets.assignments,
        models: fake.models,
    });

    const firstRun = await applyLegacyGameImport(firstPlan, fake.GameActivityModel);
    assert.equal(firstRun.inserted, 18);
    assert.equal(firstRun.unchanged, 0);
    assert.equal(firstRun.failures.length, 0);
    assert.equal(fake.created.length, 18);

    const secondPlan = await prepareLegacyGameImport({
        catalog,
        schoolId: targets.schoolId,
        assignments: targets.assignments,
        models: fake.models,
    });

    assert.equal(secondPlan.toInsert.length, 0);
    assert.equal(secondPlan.alreadyPresent.length, 18);
    const secondRun = await applyLegacyGameImport(secondPlan, fake.GameActivityModel);

    assert.equal(secondRun.inserted, 0);
    assert.equal(secondRun.unchanged, 18);
    assert.equal(fake.created.length, 18);
});

test("blocks the whole planned import when an existing source record was edited", async () => {
    const fake = createModels();
    const targets = createTargets();
    const firstPlan = await prepareLegacyGameImport({
        catalog,
        schoolId: targets.schoolId,
        assignments: targets.assignments,
        models: fake.models,
    });
    await applyLegacyGameImport(firstPlan, fake.GameActivityModel);

    const key = SCHOOL_ID + "|chemamaze-cbse:science:class-6:chapter-1";
    fake.records.get(key).title = "Edited after import";

    const repeatedPlan = await prepareLegacyGameImport({
        catalog,
        schoolId: targets.schoolId,
        assignments: targets.assignments,
        models: fake.models,
    });

    assert.equal(repeatedPlan.conflicts.length, 1);
    assert.equal(repeatedPlan.conflicts[0].sourceKey, "chemamaze-cbse:science:class-6:chapter-1");
    await assert.rejects(
        applyLegacyGameImport(repeatedPlan, fake.GameActivityModel),
        /no records were inserted/
    );
    assert.equal(fake.created.length, 18);
});

