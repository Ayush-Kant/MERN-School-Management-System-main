const STATUS_ERROR_CODES = Object.freeze({
    400: "VALIDATION_ERROR",
    401: "AUTHENTICATION_REQUIRED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
    503: "SERVICE_UNAVAILABLE",
});

function sendApiError(res, status, message, code) {
    const payload = {
        code: code || STATUS_ERROR_CODES[status] || "API_ERROR",
        message: typeof message === "string" && message.trim()
            ? message
            : "The request could not be completed",
    };

    const requestId = res && res.locals && res.locals.requestId;
    if (typeof requestId === "string" && requestId) {
        payload.requestId = requestId;
    }

    return res.status(status).json(payload);
}

module.exports = {
    STATUS_ERROR_CODES,
    sendApiError,
};
