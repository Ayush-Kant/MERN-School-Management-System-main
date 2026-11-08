const {
    validateLegacyGameCatalog,
} = require("./legacyGameCatalog");
const {
    sameReference,
    validateGameActivityRelationships,
} = require("./gameActivityIntegrity");

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const DEVELOPMENT_DATABASE_NAME = "school_management_dev";
const APPLY_CONFIRMATION = "IMPORT_CHEMAMAZE_TO_SCHOOL_MANAGEMENT_DEV";

function requireObjectId(value, label) {
    if (typeof value !== "string" || !OBJECT_ID_PATTERN.test(value)) {
        throw new TypeError(`${label} must be a 24-character MongoDB ObjectId`);
    }
    return value.toLowerCase();
}

function requireClassName(value, label) {
    if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 80) {
        throw new TypeError(`${label} must be a non-empty class name`);
    }
    return value.trim();
}

function validateDevelopmentImportTarget({ nodeEnv, databaseName, apply = false, confirmation } = {}) {
    if (nodeEnv !== "development") {
        throw new Error("Legacy game import is allowed only when NODE_ENV=development");
    }
    if (databaseName !== DEVELOPMENT_DATABASE_NAME) {
        throw new Error(
            `Legacy game import requires MongoDB database ${DEVELOPMENT_DATABASE_NAME}; received ${databaseName || "no database name"}`
        );
    }
    if (apply && confirmation !== APPLY_CONFIRMATION) {
        throw new Error(
            `Set CHEMAMAZE_SEED_CONFIRM=${APPLY_CONFIRMATION} to authorize the development-only write`
        );
    }
}

function normalizeAssignments(assignments, catalogRecords) {
    if (!assignments || typeof assignments !== "object" || Array.isArray(assignments)) {
        throw new TypeError("targets.assignments must be an object keyed by \"grade|subject\"");
    }

    const requiredKeys = [...new Set(
        catalogRecords.map((record) => `${record.grade}|${record.subject}`)
    )].sort();
    const suppliedKeys = Object.keys(assignments).sort();

    if (
        requiredKeys.length !== suppliedKeys.length ||
        requiredKeys.some((key, index) => key !== suppliedKeys[index])
    ) {
        throw new TypeError(
            `targets.assignments must contain exactly: ${requiredKeys.join(", ")}`
        );
    }

    const normalized = {};
    for (const key of requiredKeys) {
        const assignment = assignments[key];
        if (!assignment || typeof assignment !== "object" || Array.isArray(assignment)) {
            throw new TypeError(`targets.assignments[${key}] must be an object`);
        }

        const [gradeText] = key.split("|");
        const grade = Number(gradeText);
        if (Number(assignment.grade) !== grade) {
            throw new TypeError(`targets.assignments[${key}].grade must equal ${grade}`);
        }

        normalized[key] = {
            grade,
            classId: requireObjectId(assignment.classId, `targets.assignments[${key}].classId`),
            className: requireClassName(assignment.className, `targets.assignments[${key}].className`),
            subjectId: requireObjectId(assignment.subjectId, `targets.assignments[${key}].subjectId`),
            teacherId: requireObjectId(assignment.teacherId, `targets.assignments[${key}].teacherId`),
        };
    }

    return normalized;
}

async function getPlainDocument(Model, filter) {
    const query = Model.findOne(filter);
    if (query && typeof query.lean === "function") {
        const leanQuery = query.lean();
        if (leanQuery && typeof leanQuery.exec === "function") {
            return leanQuery.exec();
        }
        return leanQuery;
    }
    return query;
}

function buildSeedDocument({ catalogSource, record, school, schoolClass, subject, teacher }) {
    return {
        title: record.title,
        description: `Imported from ${catalogSource.label}; ${record.chapter}.`,
        provider: "wordwall",
        embedUrl: record.embedUrl,
        originalUrl: record.originalUrl,
        school: school._id,
        class: schoolClass._id,
        subject: subject._id,
        createdByTeacher: teacher._id,
        topic: record.topic,
        status: "draft",
        legacySource: {
            sourceKey: record.sourceKey,
            label: catalogSource.label,
            repository: catalogSource.repository,
            revision: catalogSource.revision,
            path: catalogSource.path,
            grade: record.grade,
            chapter: record.chapter,
        },
    };
}

function compareImportedRecord(existing, expected) {
    const referenceFields = ["school", "class", "subject", "createdByTeacher"];
    const stringFields = [
        "title",
        "description",
        "provider",
        "embedUrl",
        "originalUrl",
        "topic",
    ];
    const changedFields = [];

    for (const field of referenceFields) {
        if (!sameReference(existing[field], expected[field])) changedFields.push(field);
    }
    for (const field of stringFields) {
        if (existing[field] !== expected[field]) changedFields.push(field);
    }

    const actualSource = existing.legacySource || {};
    for (const field of ["sourceKey", "label", "repository", "revision", "path", "grade", "chapter"]) {
        if (String(actualSource[field] ?? "") !== String(expected.legacySource[field] ?? "")) {
            changedFields.push(`legacySource.${field}`);
        }
    }

    // Lifecycle status and timestamps are intentionally not compared or
    // overwritten. A Teacher/Admin may publish or archive an imported draft.
    return changedFields;
}

async function prepareLegacyGameImport({
    catalog,
    schoolId,
    assignments,
    models,
} = {}) {
    const validatedCatalog = validateLegacyGameCatalog(catalog);
    const normalizedSchoolId = requireObjectId(schoolId, "targets.schoolId");
    const normalizedAssignments = normalizeAssignments(assignments, validatedCatalog.records);

    const {
        AdminModel,
        SclassModel,
        SubjectModel,
        TeacherModel,
        GameActivityModel,
    } = models || {};

    for (const [name, Model] of Object.entries({
        AdminModel,
        SclassModel,
        SubjectModel,
        TeacherModel,
        GameActivityModel,
    })) {
        if (!Model) throw new TypeError(`prepareLegacyGameImport requires ${name}`);
    }

    const school = await AdminModel.findById(normalizedSchoolId);
    if (!school || !sameReference(school._id, normalizedSchoolId)) {
        throw new Error("The selected development school was not found");
    }

    const resolvedAssignments = new Map();
    const gradeClassIds = new Map();

    for (const [key, assignment] of Object.entries(normalizedAssignments)) {
        const [gradeText, subjectName] = key.split("|");
        const grade = Number(gradeText);
        const [schoolClass, subject, teacher] = await Promise.all([
            SclassModel.findById(assignment.classId),
            SubjectModel.findById(assignment.subjectId),
            TeacherModel.findById(assignment.teacherId),
        ]);

        if (!schoolClass || !sameReference(schoolClass._id, assignment.classId)) {
            throw new Error(`Class target for ${key} was not found`);
        }
        if (!sameReference(schoolClass.school, school._id)) {
            throw new Error(`Class target for ${key} does not belong to the selected development school`);
        }
        if (String(schoolClass.sclassName || "").trim() !== assignment.className) {
            throw new Error(`Class name mismatch for ${key}; expected the exact database class name`);
        }
        if (!subject || !sameReference(subject._id, assignment.subjectId)) {
            throw new Error(`Subject target for ${key} was not found`);
        }
        if (
            !sameReference(subject.school, school._id) ||
            !sameReference(subject.sclassName, schoolClass._id) ||
            String(subject.subName || "").trim() !== subjectName
        ) {
            throw new Error(`Subject target for ${key} must be ${subjectName} in the selected school/class`);
        }
        if (!teacher || !sameReference(teacher._id, assignment.teacherId)) {
            throw new Error(`Teacher target for ${key} was not found`);
        }

        const relationshipError = validateGameActivityRelationships({
            teacher,
            schoolRecord: school,
            schoolClass,
            subject,
        });
        if (relationshipError) {
            throw new Error(`Teacher assignment for ${key} is invalid: ${relationshipError.message}`);
        }

        const priorClassId = gradeClassIds.get(grade);
        if (priorClassId && !sameReference(priorClassId, schoolClass._id)) {
            throw new Error(`Class ${grade} Science and Mathematics targets must resolve to the same class record`);
        }
        gradeClassIds.set(grade, schoolClass._id);
        resolvedAssignments.set(key, { schoolClass, subject, teacher });
    }

    const toInsert = [];
    const alreadyPresent = [];
    const conflicts = [];

    for (const record of validatedCatalog.records) {
        const assignment = resolvedAssignments.get(`${record.grade}|${record.subject}`);
        const expected = buildSeedDocument({
            catalogSource: validatedCatalog.source,
            record,
            school,
            ...assignment,
        });

        const existing = await getPlainDocument(GameActivityModel, {
            school: school._id,
            "legacySource.sourceKey": record.sourceKey,
        });

        if (!existing) {
            toInsert.push({ sourceKey: record.sourceKey, document: expected });
            continue;
        }

        const changedFields = compareImportedRecord(existing, expected);
        if (changedFields.length) {
            conflicts.push({ sourceKey: record.sourceKey, changedFields });
        } else {
            alreadyPresent.push(record.sourceKey);
        }
    }

    return {
        source: validatedCatalog.source,
        schoolId: String(school._id),
        total: validatedCatalog.records.length,
        toInsert,
        alreadyPresent,
        conflicts,
    };
}

async function applyLegacyGameImport(plan, GameActivityModel) {
    if (!plan || !Array.isArray(plan.toInsert) || !Array.isArray(plan.conflicts)) {
        throw new TypeError("applyLegacyGameImport requires a prepared import plan");
    }
    if (!GameActivityModel || typeof GameActivityModel.create !== "function") {
        throw new TypeError("applyLegacyGameImport requires a GameActivity model with create");
    }
    if (plan.conflicts.length > 0) {
        throw new Error("Import stopped: existing records conflict with the legacy source; no records were inserted");
    }

    const inserted = [];
    const unchanged = [...plan.alreadyPresent];
    const failures = [];

    for (const item of plan.toInsert) {
        try {
            await GameActivityModel.create(item.document);
            inserted.push(item.sourceKey);
        } catch (error) {
            // A concurrent/repeated run can win the unique source-key index.
            // Re-read and accept only an identical import; never overwrite it.
            if (error && error.code === 11000) {
                try {
                    const existing = await getPlainDocument(GameActivityModel, {
                        school: plan.schoolId,
                        "legacySource.sourceKey": item.sourceKey,
                    });
                    const changedFields = existing
                        ? compareImportedRecord(existing, item.document)
                        : ["record-not-found-after-duplicate-key"];

                    if (existing && changedFields.length === 0) {
                        unchanged.push(item.sourceKey);
                        continue;
                    }
                    failures.push({ sourceKey: item.sourceKey, message: "Duplicate source key conflicts with existing data" });
                    continue;
                } catch {
                    failures.push({ sourceKey: item.sourceKey, message: "Duplicate source key could not be reconciled" });
                    continue;
                }
            }

            failures.push({
                sourceKey: item.sourceKey,
                message: error && typeof error.message === "string"
                    ? error.message
                    : "Database insert failed",
            });
        }
    }

    return {
        inserted: inserted.length,
        unchanged: unchanged.length,
        failures,
        insertedSourceKeys: inserted,
    };
}

module.exports = {
    DEVELOPMENT_DATABASE_NAME,
    APPLY_CONFIRMATION,
    validateDevelopmentImportTarget,
    normalizeAssignments,
    buildSeedDocument,
    compareImportedRecord,
    prepareLegacyGameImport,
    applyLegacyGameImport,
};
