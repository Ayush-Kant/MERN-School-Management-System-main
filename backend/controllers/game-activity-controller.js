const { validateWordwallEmbedUrl } = require("../utils/wordwallUrl");
const { sendApiError } = require("../utils/apiResponse.js");
const {
    validateGameActivityRelationships,
} = require("../services/learning/gameActivityIntegrity.js");

const GAME_STATUSES = new Set(["draft", "published", "archived"]);
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function isValidObjectId(value) {
    return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

function sameId(left, right) {
    return left !== undefined && left !== null &&
        right !== undefined && right !== null &&
        String(left) === String(right);
}

function validationErrorResponse(res, message) {
    return sendApiError(res, 400, message);
}

function getAuthenticatedActor(req, res, allowedRoles) {
    const actor = req && req.auth;
    if (
        !actor ||
        !isValidObjectId(actor.userId) ||
        !["Admin", "Teacher", "Student"].includes(actor.role)
    ) {
        sendApiError(res, 401, "Authentication required");
        return null;
    }

    if (!allowedRoles.includes(actor.role)) {
        sendApiError(res, 403, "You are not allowed to access this resource");
        return null;
    }

    return { userId: actor.userId, role: actor.role };
}

function rejectIdentityOverride(suppliedId, authenticatedId, res, fieldName) {
    if (suppliedId === undefined) return false;

    if (!isValidObjectId(suppliedId)) {
        validationErrorResponse(res, `${fieldName} must be a valid id`);
        return true;
    }

    if (!sameId(suppliedId, authenticatedId)) {
        sendApiError(res, 403, `${fieldName} does not match the authenticated account`);
        return true;
    }

    return false;
}

/**
 * Dependencies are injected so the controller can be tested without a live
 * MongoDB connection. Production handlers lazily supply the existing models.
 */
function createGameActivityController({
    GameActivityModel,
    TeacherModel,
    SclassModel,
    SubjectModel,
    StudentModel,
    validateEmbedUrl = validateWordwallEmbedUrl,
}) {
    const gameActivityCreate = async (req, res) => {
        const actor = getAuthenticatedActor(req, res, ["Teacher"]);
        if (!actor) return;

        const body = req.body || {};
        if (rejectIdentityOverride(body.teacherId, actor.userId, res, "teacherId")) return;

        const {
            title,
            description = "",
            embedUrl,
            originalUrl = "",
            topic = "",
        } = body;
        const teacherId = actor.userId;

        if (!isValidObjectId(teacherId)) {
            return sendApiError(res, 401, "Authentication required");
        }

        if (typeof title !== "string" || title.trim().length < 2 || title.trim().length > 120) {
            return validationErrorResponse(res, "Title must contain between 2 and 120 characters");
        }

        if (typeof description !== "string" || description.trim().length > 1000) {
            return validationErrorResponse(res, "Description must be a string of at most 1000 characters");
        }

        if (typeof topic !== "string" || topic.trim().length > 160) {
            return validationErrorResponse(res, "Topic must be a string of at most 160 characters");
        }

        if (typeof originalUrl !== "string" || originalUrl.trim().length > 2048) {
            return validationErrorResponse(res, "Original URL must be a string of at most 2048 characters");
        }

        let normalizedEmbedUrl;
        try {
            normalizedEmbedUrl = validateEmbedUrl(embedUrl);
        } catch (error) {
            return validationErrorResponse(
                res,
                error instanceof Error ? error.message : "Enter a valid Wordwall embed URL"
            );
        }

        try {
            const teacher = await TeacherModel.findById(teacherId);
            if (!teacher) {
                return sendApiError(res, 404, "Teacher not found");
            }

            const [schoolClass, subject] = await Promise.all([
                SclassModel.findById(teacher.teachSclass),
                SubjectModel.findById(teacher.teachSubject),
            ]);

            const relationshipError = validateGameActivityRelationships({
                teacher,
                schoolClass,
                subject,
            });
            if (relationshipError) {
                if (relationshipError.status === 400) {
                    return validationErrorResponse(res, relationshipError.message);
                }
                return sendApiError(res, relationshipError.status, relationshipError.message);
            }

            // The first API slice always creates a draft. Publishing will be a
            // separate, explicit workflow so a client cannot publish on create.
            const activity = new GameActivityModel({
                title: title.trim(),
                description: description.trim(),
                provider: "wordwall",
                embedUrl: normalizedEmbedUrl,
                originalUrl: originalUrl.trim(),
                school: teacher.school,
                class: teacher.teachSclass,
                subject: teacher.teachSubject,
                createdByTeacher: teacher._id || teacherId,
                topic: topic.trim(),
                status: "draft",
            });

            const savedActivity = await activity.save();
            return res.status(201).json(savedActivity);
        } catch (error) {
            if (error && (error.name === "ValidationError" || error.name === "CastError")) {
                return validationErrorResponse(res, "Request data failed validation");
            }
            return sendApiError(res, 500, "Unable to create game activity");
        }
    };

    const gameActivityList = async (req, res) => {
        const actor = getAuthenticatedActor(req, res, ["Teacher", "Student"]);
        if (!actor) return;

        const schoolId = req.params && req.params.id;
        const queryParams = (req && req.query) || {};
        const { classId, subjectId, teacherId, status } = queryParams;

        if (!isValidObjectId(schoolId)) {
            return validationErrorResponse(res, "A valid school id is required");
        }

        if (classId !== undefined && !isValidObjectId(classId)) {
            return validationErrorResponse(res, "classId must be a valid id");
        }

        if (subjectId !== undefined && !isValidObjectId(subjectId)) {
            return validationErrorResponse(res, "subjectId must be a valid id");
        }

        if (teacherId !== undefined && !isValidObjectId(teacherId)) {
            return validationErrorResponse(res, "teacherId must be a valid id");
        }

        if (status !== undefined && !GAME_STATUSES.has(status)) {
            return validationErrorResponse(res, "status must be draft, published, or archived");
        }

        try {
            let filter;

            if (actor.role === "Teacher") {
                if (rejectIdentityOverride(teacherId, actor.userId, res, "teacherId")) return;

                const teacher = await TeacherModel.findById(actor.userId);
                if (!teacher || !teacher.school || !teacher.teachSclass || !teacher.teachSubject) {
                    return sendApiError(res, 404, "Teacher not found or not assigned to a class and subject");
                }

                if (!sameId(teacher.school, schoolId)) {
                    return sendApiError(res, 404, "Game activities not found for this school");
                }

                if (classId !== undefined && !sameId(classId, teacher.teachSclass)) {
                    return sendApiError(res, 403, "You cannot list activities outside your assigned class");
                }

                if (subjectId !== undefined && !sameId(subjectId, teacher.teachSubject)) {
                    return sendApiError(res, 403, "You cannot list activities outside your assigned subject");
                }

                const [schoolClass, subject] = await Promise.all([
                    SclassModel.findById(teacher.teachSclass),
                    SubjectModel.findById(teacher.teachSubject),
                ]);

                if (
                    !schoolClass ||
                    !subject ||
                    !sameId(schoolClass.school, teacher.school) ||
                    !sameId(subject.school, teacher.school) ||
                    !sameId(subject.sclassName, teacher.teachSclass) ||
                    (subject.teacher && !sameId(subject.teacher, actor.userId))
                ) {
                    return sendApiError(res, 403, "Your current class and subject assignments are not valid");
                }

                filter = {
                    school: teacher.school,
                    class: teacher.teachSclass,
                    subject: teacher.teachSubject,
                    createdByTeacher: actor.userId,
                };
                if (status) filter.status = status;
            } else {
                if (teacherId !== undefined) {
                    return sendApiError(res, 403, "Student requests cannot use a teacher identity");
                }
                if (status !== undefined && status !== "published") {
                    return sendApiError(res, 403, "Students can only list published game activities");
                }

                const student = await StudentModel.findById(actor.userId);
                if (!student || !student.school || !student.sclassName) {
                    return sendApiError(res, 404, "Student not found or not assigned to a class");
                }

                if (!sameId(student.school, schoolId)) {
                    return sendApiError(res, 404, "Game activities not found for this school");
                }

                if (classId !== undefined && !sameId(classId, student.sclassName)) {
                    return sendApiError(res, 403, "You cannot list activities outside your assigned class");
                }

                const schoolClass = await SclassModel.findById(student.sclassName);
                if (!schoolClass || !sameId(schoolClass.school, student.school)) {
                    return sendApiError(res, 404, "Student class not found in this school");
                }

                filter = {
                    school: student.school,
                    class: student.sclassName,
                    status: "published",
                };

                if (subjectId !== undefined) {
                    const subject = await SubjectModel.findById(subjectId);
                    if (
                        !subject ||
                        !sameId(subject.school, student.school) ||
                        !sameId(subject.sclassName, student.sclassName)
                    ) {
                        return sendApiError(res, 404, "Subject not found in the student's class");
                    }
                    filter.subject = subject._id || subjectId;
                }
            }

            const activities = await GameActivityModel.find(filter)
                .populate("class", "sclassName")
                .populate("subject", "subName subCode")
                .populate("createdByTeacher", "name")
                .sort({ createdAt: -1 })
                .exec();

            return res.status(200).json(activities);
        } catch (error) {
            return sendApiError(res, 500, "Unable to list game activities");
        }
    };

    const transitionGameActivity = (nextStatus) => async (req, res) => {
        const actor = getAuthenticatedActor(req, res, ["Teacher"]);
        if (!actor) return;

        const activityId = req.params && req.params.id;
        const body = req.body || {};

        if (!isValidObjectId(activityId)) {
            return validationErrorResponse(res, "A valid game activity id is required");
        }
        if (rejectIdentityOverride(body.teacherId, actor.userId, res, "teacherId")) return;

        const expectedStatus = nextStatus === "published" ? "draft" : "published";
        const update = { $set: { status: nextStatus } };

        if (nextStatus === "published") {
            update.$set.publishedAt = new Date();
        } else if (nextStatus === "archived") {
            update.$set.archivedAt = new Date();
            update.$set.archiveReason = "manual";
        }

        try {
            const teacher = await TeacherModel.findById(actor.userId);
            if (!teacher) {
                return sendApiError(res, 404, "Teacher not found");
            }
            if (!teacher.school || !teacher.teachSclass || !teacher.teachSubject) {
                return sendApiError(res, 403, "A current school, class, and subject assignment is required");
            }

            const [schoolClass, subject] = await Promise.all([
                SclassModel.findById(teacher.teachSclass),
                SubjectModel.findById(teacher.teachSubject),
            ]);
            if (
                !schoolClass ||
                !subject ||
                !sameId(schoolClass.school, teacher.school) ||
                !sameId(subject.school, teacher.school) ||
                !sameId(subject.sclassName, teacher.teachSclass) ||
                (subject.teacher && !sameId(subject.teacher, actor.userId))
            ) {
                return sendApiError(res, 403, "Your current class and subject assignments are not valid");
            }

            // Actor identity and the currently assigned school/class/subject
            // come from the verified session and database, not the request.
            const activityScope = {
                _id: activityId,
                createdByTeacher: actor.userId,
                school: teacher.school,
                class: teacher.teachSclass,
                subject: teacher.teachSubject,
            };

            const updatedActivity = await GameActivityModel.findOneAndUpdate(
                { ...activityScope, status: expectedStatus },
                update,
                { new: true, runValidators: true }
            );

            if (updatedActivity) {
                return res.status(200).json(updatedActivity);
            }

            const ownedActivity = await GameActivityModel.findOne(activityScope);
            if (!ownedActivity) {
                return sendApiError(res, 404, "Game activity not found for this teacher");
            }

            const message = nextStatus === "published"
                ? "Only draft activities can be published"
                : "Only published activities can be archived";

            return sendApiError(res, 409, message);
        } catch (error) {
            if (error && (error.name === "ValidationError" || error.name === "CastError")) {
                return validationErrorResponse(res, "Request data failed validation");
            }
            const failureMessage = nextStatus === "published"
                ? "Unable to publish game activity"
                : "Unable to archive game activity";
            return sendApiError(res, 500, failureMessage);
        }
    };

    const publishGameActivity = transitionGameActivity("published");
    const archiveGameActivity = transitionGameActivity("archived");

    return { gameActivityCreate, gameActivityList, publishGameActivity, archiveGameActivity };
}

let defaultController;

function getDefaultController() {
    if (!defaultController) {
        defaultController = createGameActivityController({
            GameActivityModel: require("../models/gameActivitySchema.js"),
            TeacherModel: require("../models/teacherSchema.js"),
            SclassModel: require("../models/sclassSchema.js"),
            SubjectModel: require("../models/subjectSchema.js"),
            StudentModel: require("../models/studentSchema.js"),
        });
    }
    return defaultController;
}

// These thin wrappers preserve the controller import pattern used by route.js.
const gameActivityCreate = (req, res) =>
    getDefaultController().gameActivityCreate(req, res);
const gameActivityList = (req, res) =>
    getDefaultController().gameActivityList(req, res);

const publishGameActivity = (req, res) =>
    getDefaultController().publishGameActivity(req, res);
const archiveGameActivity = (req, res) =>
    getDefaultController().archiveGameActivity(req, res);

module.exports = {
    gameActivityCreate,
    gameActivityList,
    publishGameActivity,
    archiveGameActivity,
    createGameActivityController,
};
