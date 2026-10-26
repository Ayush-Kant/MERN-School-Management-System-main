const { validateWordwallEmbedUrl } = require("../utils/wordwallUrl");

const GAME_STATUSES = new Set(["draft", "published", "archived"]);
const OBJECT_ID_PATTERN = /^[a-f\\d]{24}$/i;

function isValidObjectId(value) {
    return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

function sameId(left, right) {
    return left !== undefined && left !== null &&
        right !== undefined && right !== null &&
        String(left) === String(right);
}

function validationErrorResponse(res, message) {
    return res.status(400).json({ message });
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
    validateEmbedUrl = validateWordwallEmbedUrl,
}) {
    const gameActivityCreate = async (req, res) => {
        const body = req.body || {};
        const {
            teacherId,
            title,
            description = "",
            embedUrl,
            originalUrl = "",
            topic = "",
        } = body;

        if (!isValidObjectId(teacherId)) {
            return validationErrorResponse(res, "A valid teacherId is required");
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
                return res.status(404).json({ message: "Teacher not found" });
            }

            if (!teacher.school || !teacher.teachSclass || !teacher.teachSubject) {
                return validationErrorResponse(
                    res,
                    "The teacher must be assigned to a school, class, and subject before creating a game"
                );
            }

            const [schoolClass, subject] = await Promise.all([
                SclassModel.findById(teacher.teachSclass),
                SubjectModel.findById(teacher.teachSubject),
            ]);

            if (!schoolClass || !subject) {
                return validationErrorResponse(
                    res,
                    "The teacher's assigned class or subject could not be found"
                );
            }

            const assignmentsMatch =
                sameId(schoolClass.school, teacher.school) &&
                sameId(subject.school, teacher.school) &&
                sameId(subject.sclassName, teacher.teachSclass);

            if (!assignmentsMatch) {
                return validationErrorResponse(
                    res,
                    "The teacher's class and subject must belong to the same school and class"
                );
            }

            if (subject.teacher && !sameId(subject.teacher, teacher._id)) {
                return res.status(409).json({
                    message: "The assigned subject is linked to a different teacher",
                });
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
                return validationErrorResponse(res, error.message);
            }
            return res.status(500).json({ message: "Unable to create game activity" });
        }
    };

    const gameActivityList = async (req, res) => {
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

        // Without a teacher context, this endpoint is suitable for student
        // browsing and exposes only published activities.
        if (!teacherId && status && status !== "published") {
            return res.status(403).json({
                message: "Only teachers can list non-published game activities",
            });
        }

        try {
            const filter = { school: schoolId };

            if (classId) filter.class = classId;
            if (subjectId) filter.subject = subjectId;

            if (teacherId) {
                const teacher = await TeacherModel.findById(teacherId);
                if (!teacher || !sameId(teacher.school, schoolId)) {
                    return res.status(404).json({ message: "Teacher not found in this school" });
                }

                filter.createdByTeacher = teacher._id || teacherId;
                if (status) filter.status = status;
                // No status filter in teacher context means all of this teacher's
                // activities (draft, published, and archived).
            } else {
                filter.status = "published";
            }

            const activities = await GameActivityModel.find(filter)
                .populate("class", "sclassName")
                .populate("subject", "subName subCode")
                .populate("createdByTeacher", "name")
                .sort({ createdAt: -1 })
                .exec();

            return res.status(200).json(activities);
        } catch (error) {
            return res.status(500).json({ message: "Unable to list game activities" });
        }
    };

    return { gameActivityCreate, gameActivityList };
}

let defaultController;

function getDefaultController() {
    if (!defaultController) {
        defaultController = createGameActivityController({
            GameActivityModel: require("../models/gameActivitySchema.js"),
            TeacherModel: require("../models/teacherSchema.js"),
            SclassModel: require("../models/sclassSchema.js"),
            SubjectModel: require("../models/subjectSchema.js"),
        });
    }
    return defaultController;
}

// These thin wrappers preserve the controller import pattern used by route.js.
const gameActivityCreate = (req, res) =>
    getDefaultController().gameActivityCreate(req, res);
const gameActivityList = (req, res) =>
    getDefaultController().gameActivityList(req, res);

module.exports = {
    gameActivityCreate,
    gameActivityList,
    createGameActivityController,
};
