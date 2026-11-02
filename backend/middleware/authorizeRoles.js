const SUPPORTED_ROLES = new Set(["Admin", "Teacher", "Student"]);
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * Must be mounted after authenticateSession. The role is taken only from the
 * verified session claims attached by that middleware, never from req.body,
 * req.query, or a route parameter.
 */
function authorizeRoles(...allowedRoles) {
    if (
        allowedRoles.length === 0 ||
        allowedRoles.some((role) => !SUPPORTED_ROLES.has(role))
    ) {
        throw new TypeError("authorizeRoles requires one or more supported roles");
    }

    const roleSet = new Set(allowedRoles);
    const middleware = function authorizeRole(req, res, next) {
        const actor = req && req.auth;

        if (
            !actor ||
            !SUPPORTED_ROLES.has(actor.role) ||
            typeof actor.userId !== "string" ||
            !OBJECT_ID_PATTERN.test(actor.userId)
        ) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!roleSet.has(actor.role)) {
            return res.status(403).json({ message: "You are not allowed to access this resource" });
        }

        return next();
    };

    Object.defineProperty(middleware, "allowedRoles", {
        value: Object.freeze([...roleSet]),
        enumerable: true,
    });

    return middleware;
}

module.exports = { authorizeRoles };
