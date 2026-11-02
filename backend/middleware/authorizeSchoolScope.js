const { normalizeObjectId } = require("./loadActorContext.js");

const RESOURCE_DEFINITIONS = {
    class: {
        modelName: "SclassModel",
        projection: "_id school",
    },
    student: {
        modelName: "StudentModel",
        projection: "_id school sclassName",
    },
    teacher: {
        modelName: "TeacherModel",
        projection: "_id school teachSclass teachSubject",
    },
    subject: {
        modelName: "SubjectModel",
        projection: "_id school sclassName teacher",
    },
    notice: {
        modelName: "NoticeModel",
        projection: "_id school",
    },
    complaint: {
        modelName: "ComplainModel",
        projection: "_id school",
    },
};

const SIMPLE_RESOURCES = new Set(["school", "self"]);
const SUPPORTED_ROLES = new Set(["Admin", "Teacher", "Student"]);

function readPath(root, path) {
    return path.split(".").reduce((value, segment) => {
        if (value === undefined || value === null) return undefined;
        return value[segment];
    }, root);
}

function sameId(left, right) {
    const leftId = normalizeObjectId(left);
    const rightId = normalizeObjectId(right);
    return Boolean(leftId && rightId && leftId === rightId);
}

function selectFields(query, projection) {
    return query && typeof query.select === "function"
        ? query.select(projection)
        : query;
}

/**
 * Create resource ownership guards for school-scoped routes.
 *
 * Every request is evaluated against req.actor, which must be populated by
 * loadActorContext after authenticateSession and authorizeRoles. Route/body
 * IDs select a resource; they never establish the caller's identity or school.
 */
function createAuthorizeSchoolScope(models = {}) {
    return function authorizeSchoolScope(options = {}) {
        const { resource, from, as, belongsTo, optional = false } = options;

        if (
            (!SIMPLE_RESOURCES.has(resource) && !RESOURCE_DEFINITIONS[resource]) ||
            typeof from !== "string" ||
            !/^(params|body|query)[.][A-Za-z0-9_.]+$/.test(from)
        ) {
            throw new TypeError("authorizeSchoolScope requires a supported resource and request source");
        }

        if (
            belongsTo &&
            (
                typeof belongsTo.field !== "string" ||
                typeof belongsTo.resource !== "string" ||
                typeof belongsTo.resourceField !== "string"
            )
        ) {
            throw new TypeError("belongsTo requires field, resource, and resourceField");
        }

        const definition = RESOURCE_DEFINITIONS[resource];
        const Model = definition
            ? models[definition.modelName] || require(`../models/${{
                class: "sclassSchema",
                student: "studentSchema",
                teacher: "teacherSchema",
                subject: "subjectSchema",
                notice: "noticeSchema",
                complaint: "complainSchema",
            }[resource]}.js`)
            : null;

        const middleware = async function schoolScopeAuthorization(req, res, next) {
            const actor = req && req.actor;
            if (
                !actor ||
                !SUPPORTED_ROLES.has(actor.role) ||
                !normalizeObjectId(actor.userId) ||
                !normalizeObjectId(actor.schoolId)
            ) {
                return res.status(401).json({ message: "Authentication required" });
            }

            const rawId = readPath(req, from);
            if (optional && (rawId === undefined || rawId === null || rawId === "")) {
                return next();
            }

            const resourceId = normalizeObjectId(rawId);
            if (!resourceId) {
                return res.status(400).json({ message: "A valid resource id is required" });
            }

            if (resource === "school") {
                if (!sameId(resourceId, actor.schoolId)) {
                    return res.status(404).json({ message: "Resource not found" });
                }
                return next();
            }

            if (resource === "self") {
                if (!sameId(resourceId, actor.userId)) {
                    return res.status(404).json({ message: "Resource not found" });
                }
                return next();
            }

            try {
                const query = Model.findById(resourceId);
                const document = await selectFields(query, definition.projection);

                if (!document || !sameId(document.school, actor.schoolId)) {
                    return res.status(404).json({ message: "Resource not found" });
                }

                // A Teacher or Student may only traverse the class assigned to
                // their own account, never another class in the same school.
                if (
                    resource === "class" &&
                    actor.role !== "Admin" &&
                    !sameId(document._id, actor.classId)
                ) {
                    return res.status(404).json({ message: "Resource not found" });
                }

                // A Student may inspect only their own record. A Teacher may
                // inspect students in their currently assigned class.
                if (
                    resource === "student" &&
                    (
                        (actor.role === "Student" && !sameId(document._id, actor.userId)) ||
                        (actor.role === "Teacher" && !sameId(document.sclassName, actor.classId))
                    )
                ) {
                    return res.status(404).json({ message: "Resource not found" });
                }

                // Teachers may inspect only their own profile; students have no
                // direct teacher-record endpoint.
                if (
                    resource === "teacher" &&
                    (
                        (actor.role === "Teacher" && !sameId(document._id, actor.userId)) ||
                        actor.role === "Student"
                    )
                ) {
                    return res.status(404).json({ message: "Resource not found" });
                }

                // Teachers are limited to their assigned subject. Students may
                // inspect subjects only within their own class.
                if (
                    resource === "subject" &&
                    (
                        (actor.role === "Teacher" && (
                            !sameId(document._id, actor.subjectId) ||
                            (document.teacher && !sameId(document.teacher, actor.userId))
                        )) ||
                        (actor.role === "Student" && !sameId(document.sclassName, actor.classId))
                    )
                ) {
                    return res.status(404).json({ message: "Resource not found" });
                }

                if (belongsTo) {
                    const relatedResource = req.authorizationResources &&
                        req.authorizationResources[belongsTo.resource];
                    if (
                        !relatedResource ||
                        !sameId(
                            readPath(document, belongsTo.field),
                            readPath(relatedResource, belongsTo.resourceField)
                        )
                    ) {
                        return res.status(404).json({ message: "Resource not found" });
                    }
                }

                req.authorizationResources = req.authorizationResources || Object.create(null);
                req.authorizationResources[as || resource] = document;

                return next();
            } catch (error) {
                return res.status(503).json({
                    message: "Unable to verify resource access",
                });
            }
        };

        Object.defineProperty(middleware, "scope", {
            value: Object.freeze({ resource, from, as: as || resource, belongsTo, optional }),
            enumerable: true,
        });

        return middleware;
    };
}

const authorizeSchoolScope = createAuthorizeSchoolScope();

module.exports = {
    authorizeSchoolScope,
    createAuthorizeSchoolScope,
    readPath,
    sameId,
};
