const { sendApiError } = require("../utils/apiResponse.js");

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const STATUSES = new Set(["draft", "published", "archived"]);
const PROVIDERS = new Set(["wordwall"]);
const ALLOWED_QUERY_FIELDS = new Set([
    "classId",
    "subjectId",
    "teacherId",
    "status",
    "provider",
    "search",
    "page",
    "limit",
]);

function isValidObjectId(value) {
    return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

function sameId(left, right) {
    return left !== undefined && left !== null &&
        right !== undefined && right !== null &&
        String(left).toLowerCase() === String(right).toLowerCase();
}

function validationError(res, message) {
    return sendApiError(res, 400, message);
}

function getAdminSchoolId(req, res) {
    const actor = req && req.actor;
    if (!actor || actor.role !== "Admin" || !isValidObjectId(actor.userId) ||
        !isValidObjectId(actor.schoolId) || !sameId(actor.userId, actor.schoolId)) {
        const forbidden = Boolean(actor && actor.role && actor.role !== "Admin");
        sendApiError(res, forbidden ? 403 : 401,
            forbidden
                ? "You are not allowed to access this resource"
                : "Authentication required");
        return null;
    }
    return actor.schoolId;
}

function parsePositiveInteger(value, fallback, maximum) {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) return null;
    return parsed;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
}

function makeFindQuery(Model, filter, projection, sort) {
    let query = Model.find(filter);
    if (projection && typeof query.select === "function") query = query.select(projection);
    if (sort && typeof query.sort === "function") query = query.sort(sort);
    return query;
}

async function executeQuery(query) {
    return query && typeof query.exec === "function" ? query.exec() : query;
}

function createAdminGameActivityController({
    GameActivityModel,
    SclassModel,
    SubjectModel,
    TeacherModel,
}) {
    const adminGameActivityList = async (req, res) => {
        const schoolId = getAdminSchoolId(req, res);
        if (!schoolId) return;

        const query = (req && req.query) || {};
        const unknownFields = Object.keys(query).filter((field) => !ALLOWED_QUERY_FIELDS.has(field));
        if (unknownFields.length > 0) {
            return validationError(res, "Unsupported filter: " + unknownFields[0]);
        }

        const { classId, subjectId, teacherId } = query;
        for (const [field, value] of Object.entries({ classId, subjectId, teacherId })) {
            if (value !== undefined && !isValidObjectId(value)) {
                return validationError(res, field + " must be a valid id");
            }
        }

        const status = query.status === undefined ? "all" : query.status;
        if (status !== "all" && !STATUSES.has(status)) {
            return validationError(res, "status must be all, draft, published, or archived");
        }

        const provider = query.provider === undefined ? "all" : query.provider;
        if (provider !== "all" && !PROVIDERS.has(provider)) {
            return validationError(res, "provider must be all or wordwall");
        }

        if (query.search !== undefined &&
            (typeof query.search !== "string" || query.search.trim().length > 100)) {
            return validationError(res, "search must be a string of at most 100 characters");
        }

        const page = parsePositiveInteger(query.page, 1, 100000);
        const limit = parsePositiveInteger(query.limit, 25, 100);
        if (page === null) return validationError(res, "page must be a positive integer");
        if (limit === null) return validationError(res, "limit must be an integer between 1 and 100");

        try {
            // Filter IDs are resolved against this Admin's tenant before use.
            // A client-provided school ID is intentionally not an accepted field.
            let selectedClass = null;
            if (classId !== undefined) {
                selectedClass = await SclassModel.findById(classId);
                if (!selectedClass || !sameId(selectedClass.school, schoolId)) {
                    return sendApiError(res, 404, "Class not found in this school");
                }
            }

            if (subjectId !== undefined) {
                const selectedSubject = await SubjectModel.findById(subjectId);
                if (!selectedSubject || !sameId(selectedSubject.school, schoolId) ||
                    (selectedClass && !sameId(selectedSubject.sclassName, selectedClass._id))) {
                    return sendApiError(res, 404, "Subject not found in the selected school and class");
                }
            }

            if (teacherId !== undefined) {
                const selectedTeacher = await TeacherModel.findById(teacherId);
                if (!selectedTeacher || !sameId(selectedTeacher.school, schoolId)) {
                    return sendApiError(res, 404, "Teacher not found in this school");
                }
            }

            const filter = { school: schoolId };
            if (classId !== undefined) filter.class = classId;
            if (subjectId !== undefined) filter.subject = subjectId;
            if (teacherId !== undefined) filter.createdByTeacher = teacherId;
            if (status !== "all") filter.status = status;
            if (provider !== "all") filter.provider = provider;

            const search = typeof query.search === "string" ? query.search.trim() : "";
            if (search) {
                const expression = new RegExp(escapeRegExp(search), "i");
                filter.$or = [
                    { title: expression },
                    { description: expression },
                    { topic: expression },
                ];
            }

            const skip = (page - 1) * limit;
            const activityQuery = makeFindQuery(GameActivityModel, filter, null, {
                createdAt: -1,
                _id: -1,
            });
            if (typeof activityQuery.populate === "function") {
                activityQuery.populate("class", "sclassName");
                activityQuery.populate("subject", "subName subCode");
                activityQuery.populate("createdByTeacher", "name");
            }
            if (typeof activityQuery.skip === "function") activityQuery.skip(skip);
            if (typeof activityQuery.limit === "function") activityQuery.limit(limit);

            const summaryFilter = { school: schoolId };
            const [activities, total, draftCount, publishedCount, archivedCount,
                classes, subjects, teachers] = await Promise.all([
                executeQuery(activityQuery),
                GameActivityModel.countDocuments(filter),
                GameActivityModel.countDocuments({ ...summaryFilter, status: "draft" }),
                GameActivityModel.countDocuments({ ...summaryFilter, status: "published" }),
                GameActivityModel.countDocuments({ ...summaryFilter, status: "archived" }),
                executeQuery(makeFindQuery(SclassModel, { school: schoolId }, "_id sclassName", { sclassName: 1 })),
                executeQuery(makeFindQuery(SubjectModel, { school: schoolId }, "_id subName subCode sclassName", { subName: 1 })),
                executeQuery(makeFindQuery(TeacherModel, { school: schoolId }, "_id name", { name: 1 })),
            ]);

            return res.status(200).json({
                activities,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                summary: {
                    total: draftCount + publishedCount + archivedCount,
                    draft: draftCount,
                    published: publishedCount,
                    archived: archivedCount,
                },
                filters: { classes, subjects, teachers },
            });
        } catch (error) {
            return sendApiError(res, 500, "Unable to load the school's game catalogue");
        }
    };

    const transitionAdminGameActivity = (nextStatus) => async (req, res) => {
        const schoolId = getAdminSchoolId(req, res);
        if (!schoolId) return;

        const activityId = req && req.params && req.params.id;
        if (!isValidObjectId(activityId)) {
            return validationError(res, "A valid game activity id is required");
        }

        const update = { $set: { status: nextStatus } };
        if (nextStatus === "draft") {
            update.$set.unpublishedAt = new Date();
        } else if (nextStatus === "archived") {
            update.$set.archivedAt = new Date();
            update.$set.archiveReason = "manual";
        }

        const activityScope = {
            _id: activityId,
            school: schoolId,
            status: "published",
        };

        try {
            const updatedActivity = await GameActivityModel.findOneAndUpdate(
                activityScope,
                update,
                { new: true, runValidators: true }
            );

            if (updatedActivity) {
                return res.status(200).json(updatedActivity);
            }

            const existingActivity = await GameActivityModel.findOne({
                _id: activityId,
                school: schoolId,
            });

            if (!existingActivity) {
                return sendApiError(res, 404, "Game activity not found in this school");
            }

            return sendApiError(res, 409,
                "Only published activities can be unpublished or archived");
        } catch (error) {
            if (error && (error.name === "ValidationError" || error.name === "CastError")) {
                return validationError(res, "Request data failed validation");
            }
            return sendApiError(res, 500,
                nextStatus === "draft"
                    ? "Unable to unpublish game activity"
                    : "Unable to archive game activity");
        }
    };

    return {
        adminGameActivityList,
        adminUnpublishGameActivity: transitionAdminGameActivity("draft"),
        adminArchiveGameActivity: transitionAdminGameActivity("archived"),
    };
}

let defaultController;

function getDefaultController() {
    if (!defaultController) {
        defaultController = createAdminGameActivityController({
            GameActivityModel: require("../models/gameActivitySchema.js"),
            SclassModel: require("../models/sclassSchema.js"),
            SubjectModel: require("../models/subjectSchema.js"),
            TeacherModel: require("../models/teacherSchema.js"),
        });
    }
    return defaultController;
}

const adminGameActivityList = (req, res) =>
    getDefaultController().adminGameActivityList(req, res);
const adminUnpublishGameActivity = (req, res) =>
    getDefaultController().adminUnpublishGameActivity(req, res);
const adminArchiveGameActivity = (req, res) =>
    getDefaultController().adminArchiveGameActivity(req, res);

module.exports = {
    adminGameActivityList,
    adminUnpublishGameActivity,
    adminArchiveGameActivity,
    createAdminGameActivityController,
    parsePositiveInteger,
    escapeRegExp,
};
