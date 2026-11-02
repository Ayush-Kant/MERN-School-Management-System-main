const { sendApiError } = require("../utils/apiResponse.js");

function getErrorResponse(error) {
    if (error && error.type === "entity.too.large") {
        return {
            status: 413,
            code: "PAYLOAD_TOO_LARGE",
            message: "Request payload is too large",
        };
    }

    if (error && error.type === "entity.parse.failed") {
        return {
            status: 400,
            code: "INVALID_JSON",
            message: "Request body contains invalid JSON",
        };
    }

    if (error && error.code === "CORS_ORIGIN_NOT_ALLOWED") {
        return {
            status: 403,
            code: "ORIGIN_NOT_ALLOWED",
            message: "Request origin is not allowed",
        };
    }

    return {
        status: 500,
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred",
    };
}

function createApiErrorHandler({ logger = console } = {}) {
    return function apiErrorHandler(error, req, res, next) {
        if (res.headersSent) {
            return next(error);
        }

        const response = getErrorResponse(error);
        const requestId = res.locals && res.locals.requestId;

        // Do not log the error message, stack, request headers, body, cookies,
        // query string, or learner identifiers. Those can contain secrets or PII.
        if (logger && typeof logger.error === "function") {
            logger.error(JSON.stringify({
                event: "http_error",
                requestId: typeof requestId === "string" ? requestId : undefined,
                statusCode: response.status,
                errorName: error && typeof error.name === "string" &&
                    /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(error.name) ? error.name : "Error",
                errorCode: error && typeof error.code === "string" &&
                    /^[A-Z0-9_]{1,40}$/.test(error.code) ? error.code : undefined,
            }));
        }

        return sendApiError(res, response.status, response.message, response.code);
    };
}

function createNotFoundHandler() {
    return function notFoundHandler(req, res) {
        return sendApiError(res, 404, "Route not found", "ROUTE_NOT_FOUND");
    };
}

module.exports = {
    getErrorResponse,
    createApiErrorHandler,
    createNotFoundHandler,
};
