const OBJECT_ID_PATTERN = /^[a-f\\d]{24}$/i;

const GAME_ACTIVITY_ARCHIVE_REASONS = Object.freeze([
    "manual",
    "teacher_deleted",
    "teacher_reassigned",
    "class_deleted",
    "subject_deleted",
    "school_resources_deleted",
]);

function normalizeReferenceId(value) {
    if (value && typeof value === "object" && value._id !== undefined) {
        return normalizeReferenceId(value._id);
    }
    if (value === undefined || value === null) return null;

    const normalized = String(value);
    return OBJECT_ID_PATTERN.test(normalized) ? normalized.toLowerCase() : null;
}

function sameReference(left, right) {
    const leftId = normalizeReferenceId(left);
    const rightId = normalizeReferenceId(right);
    return leftId !== null && rightId !== null && leftId === rightId;
}

/**
 * Validate the persisted Teacher -> school/class/subject relationship before
 * creating a GameActivity. The caller loads the three documents from MongoDB;
 * request-supplied identifiers are never used as relationship authority.
 */
function validateGameActivityRelationships({ teacher, schoolClass, subject } = {}) {
    if (!teacher || !normalizeReferenceId(teacher._id)) {
        return { status: 404, message: "Teacher not found" };
    }

    if (
        !normalizeReferenceId(teacher.school) ||
        !normalizeReferenceId(teacher.teachSclass) ||
        !normalizeReferenceId(teacher.teachSubject)
    ) {
        return {
            status: 400,
            message: "The teacher must be assigned to a school, class, and subject before creating a game",
        };
    }

    if (
        !schoolClass ||
        !subject ||
        !sameReference(schoolClass._id, teacher.teachSclass) ||
        !sameReference(subject._id, teacher.teachSubject)
    ) {
        return {
            status: 400,
            message: "The teacher's assigned class or subject could not be found",
        };
    }

    if (
        !sameReference(schoolClass.school, teacher.school) ||
        !sameReference(subject.school, teacher.school) ||
        !sameReference(subject.sclassName, teacher.teachSclass)
    ) {
        return {
            status: 400,
            message: "The teacher's class and subject must belong to the same school and class",
        };
    }

    if (subject.teacher && !sameReference(subject.teacher, teacher._id)) {
        return {
            status: 409,
            message: "The assigned subject is linked to a different teacher",
        };
    }

    return null;
}

function createGameActivityLifecycle({ GameActivityModel, clock = () => new Date() } = {}) {
    if (!GameActivityModel || typeof GameActivityModel.updateMany !== "function") {
        throw new TypeError("createGameActivityLifecycle requires a GameActivity model with updateMany");
    }
    if (typeof clock !== "function") {
        throw new TypeError("GameActivity lifecycle clock must be a function");
    }

    const requireId = (value, label) => {
        const id = normalizeReferenceId(value);
        if (!id) throw new TypeError(`${label} must be a valid ObjectId`);
        return id;
    };

    async function archive(filter, reason) {
        if (!GAME_ACTIVITY_ARCHIVE_REASONS.includes(reason)) {
            throw new TypeError("Unsupported GameActivity archive reason");
        }

        const archivedAt = clock();
        if (!(archivedAt instanceof Date) || Number.isNaN(archivedAt.getTime())) {
            throw new TypeError("GameActivity lifecycle clock must return a valid Date");
        }

        return GameActivityModel.updateMany(
            { ...filter, status: { $ne: "archived" } },
            {
                $set: {
                    status: "archived",
                    archivedAt,
                    archiveReason: reason,
                },
            },
            { runValidators: true }
        );
    }

    return Object.freeze({
        archiveBySchool(schoolId) {
            return archive(
                { school: requireId(schoolId, "schoolId") },
                "school_resources_deleted"
            );
        },

        archiveByClass(classId) {
            return archive(
                { class: requireId(classId, "classId") },
                "class_deleted"
            );
        },

        archiveBySubject(subjectId) {
            return archive(
                { subject: requireId(subjectId, "subjectId") },
                "subject_deleted"
            );
        },

        archiveByTeacher(teacherId) {
            return archive(
                { createdByTeacher: requireId(teacherId, "teacherId") },
                "teacher_deleted"
            );
        },

        archiveBySubjects(subjectIds) {
            if (!Array.isArray(subjectIds)) {
                throw new TypeError("subjectIds must be an array");
            }
            if (subjectIds.length === 0) {
                return Promise.resolve(null);
            }

            const normalizedIds = [...new Set(
                subjectIds.map((subjectId) => requireId(subjectId, "subjectId"))
            )];

            return archive(
                { subject: { $in: normalizedIds } },
                "subject_deleted"
            );
        },

        archiveByTeachers(teacherIds) {
            if (!Array.isArray(teacherIds)) {
                throw new TypeError("teacherIds must be an array");
            }
            if (teacherIds.length === 0) {
                return Promise.resolve(null);
            }

            const normalizedIds = [...new Set(
                teacherIds.map((teacherId) => requireId(teacherId, "teacherId"))
            )];

            return archive(
                { createdByTeacher: { $in: normalizedIds } },
                "teacher_deleted"
            );
        },

        archiveForTeacherReassignment(teacherId, nextAssignment = {}) {
            const normalizedTeacherId = requireId(teacherId, "teacherId");
            const schoolId = requireId(nextAssignment.schoolId, "schoolId");
            const classId = requireId(nextAssignment.classId, "classId");
            const subjectId = requireId(nextAssignment.subjectId, "subjectId");

            return archive(
                {
                    createdByTeacher: normalizedTeacherId,
                    $or: [
                        { school: { $ne: schoolId } },
                        { class: { $ne: classId } },
                        { subject: { $ne: subjectId } },
                    ],
                },
                "teacher_reassigned"
            );
        },
    });
}

module.exports = {
    GAME_ACTIVITY_ARCHIVE_REASONS,
    normalizeReferenceId,
    sameReference,
    validateGameActivityRelationships,
    createGameActivityLifecycle,
};
