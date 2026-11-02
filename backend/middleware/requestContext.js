const { randomUUID } = require("node:crypto");

function createRequestContext({ logger = console, idFactory = randomUUID, clock = Date.now } = {}) {
    return function requestContext(req, res, next) {
        const requestId = idFactory();
        const startedAt = clock();

        req.requestId = requestId;
        res.locals = res.locals || {};
        res.locals.requestId = requestId;
        res.setHeader("X-Request-Id", requestId);

        res.once("finish", () => {
            // Deliberately log only route templates and response metadata.
            // Request bodies, query strings, headers, cookies, and path IDs can
            // contain credentials or student information and are never logged.
            const routePath = req.route && typeof req.route.path === "string"
                ? req.route.path
                : "unmatched";

            const record = {
                event: "http_request",
                requestId,
                method: String(req.method || "UNKNOWN"),
                route: routePath,
                statusCode: res.statusCode,
                durationMs: Math.max(0, clock() - startedAt),
            };

            if (logger && typeof logger.info === "function") {
                logger.info(JSON.stringify(record));
            }
        });

        return next();
    };
}

module.exports = { createRequestContext };
