const { clearSessionCookie } = require("../utils/authSession.js");

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
const SUPPORTED_ROLES = new Set(["Admin", "Teacher", "Student"]);

function normalizeObjectId(value) {
    const candidate = value && typeof value === "object" && value._id !== undefined
        ? value._id
        : value;

    if (candidate === undefined || candidate === null) return null;

    const normalized = String(candidate);
    return OBJECT_ID_PATTERN.test(normalized) ? normalized : null;
}

function selectFields(query, projection) {
    return query && typeof query.select === "function"
        ? query.select(projection)
        : query;
}

function safeClearSessionCookie(res) {
    try {
        clearSessionCookie(res);
    } catch {
        // A cookie-clearing failure must not turn an invalid session into access.
    }
}

/**
 * Resolve the account behind a verified session token.
 *
 * req.auth is cryptographically verified by authenticateSession. This
 * middleware confirms the account still exists, its persisted role still
 * matches the token, and its tenant/class assignments come from MongoDB.
 * No request body, query parameter, or route parameter is used as identity.
 */
function createLoadActorContext(models = {}) {
    const AdminModel = models.AdminModel || require("../models/adminSchema.js");
    const TeacherModel = models.TeacherModel || require("../models/teacherSchema.js");
    const StudentModel = models.StudentModel || require("../models/studentSchema.js");

    const modelByRole = {
        Admin: { model: AdminModel, projection: "_id role" },
        Teacher: {
            model: TeacherModel,
            projection: "_id role school teachSclass teachSubject",
        },
        Student: {
            model: StudentModel,
            projection: "_id role school sclassName",
        },
    };

    return async function loadActorContext(req, res, next) {
        const claims = req && req.auth;
        const userId = normalizeObjectId(claims && claims.userId);
        const role = claims && claims.role;

        if (!userId || !SUPPORTED_ROLES.has(role)) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const roleConfig = modelByRole[role];

        try {
            const query = roleConfig.model.findById(userId);
            const account = await selectFields(query, roleConfig.projection);

            if (
                !account ||
                normalizeObjectId(account._id) !== userId ||
                account.role !== role
            ) {
                safeClearSessionCookie(res);
                return res.status(401).json({
                    message: "The account for this session is no longer available",
                });
            }

            const schoolId = role === "Admin"
                ? userId
                : normalizeObjectId(account.school);

            if (!schoolId) {
                return res.status(403).json({
                    message: "This account is not assigned to a school",
                });
            }

            const classId = role === "Teacher"
                ? normalizeObjectId(account.teachSclass)
                : role === "Student"
                    ? normalizeObjectId(account.sclassName)
                    : null;

            const subjectId = role === "Teacher"
                ? normalizeObjectId(account.teachSubject)
                : null;

            req.actor = Object.freeze({
                userId,
                role,
                schoolId,
                classId,
                subjectId,
            });

            return next();
        } catch (error) {
            return res.status(503).json({
                message: "Unable to verify the authenticated account",
            });
        }
    };
}

const loadActorContext = createLoadActorContext();

module.exports = {
    loadActorContext,
    createLoadActorContext,
    normalizeObjectId,
};
