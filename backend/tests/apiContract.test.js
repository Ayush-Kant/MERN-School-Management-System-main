const test = require("node:test");
const assert = require("node:assert/strict");

const { sendApiError } = require("../utils/apiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { createRequestContext } = require("../middleware/requestContext.js");
const {
    getErrorResponse,
    createApiErrorHandler,
    createNotFoundHandler,
} = require("../middleware/apiErrorHandler.js");

function makeResponse({ headersSent = false } = {}) {
    return {
        statusCode: 200,
        body: undefined,
        headers: {},
        listeners: {},
        locals: {},
        headersSent,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
        setHeader(name, value) {
            this.headers[name] = value;
        },
        once(event, callback) {
            this.listeners[event] = callback;
        },
    };
}

test("API errors preserve the legacy message field and add a stable code", () => {
    const res = makeResponse();
    res.locals.requestId = "request-123";

    sendApiError(res, 400, "The title is invalid");

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        code: "VALIDATION_ERROR",
        message: "The title is invalid",
        requestId: "request-123",
    });
});

test("API error responses use stable status-to-code mappings", () => {
    const cases = [
        [401, "AUTHENTICATION_REQUIRED"],
        [403, "FORBIDDEN"],
        [404, "NOT_FOUND"],
        [409, "CONFLICT"],
        [413, "PAYLOAD_TOO_LARGE"],
        [429, "RATE_LIMITED"],
        [500, "INTERNAL_ERROR"],
        [503, "SERVICE_UNAVAILABLE"],
    ];

    for (const [status, code] of cases) {
        const res = makeResponse();
        sendApiError(res, status, "Safe message");
        assert.equal(res.body.code, code);
        assert.equal(res.body.message, "Safe message");
    }
});

test("API errors do not add a request id when request context is absent", () => {
    const res = makeResponse();
    sendApiError(res, 404, "Not found", "RESOURCE_NOT_FOUND");

    assert.deepEqual(res.body, {
        code: "RESOURCE_NOT_FOUND",
        message: "Not found",
    });
});

test("Express async wrapper forwards rejected promises to next", async () => {
    const expectedError = new Error("controlled async failure");
    const wrapped = asyncHandler(async () => {
        throw expectedError;
    });

    let forwarded;
    await wrapped({}, {}, (error) => {
        forwarded = error;
    });

    assert.equal(forwarded, expectedError);
});

test("Express async wrapper forwards synchronous throws to next", async () => {
    const expectedError = new Error("controlled sync failure");
    const wrapped = asyncHandler(() => {
        throw expectedError;
    });

    let forwarded;
    await wrapped({}, {}, (error) => {
        forwarded = error;
    });

    assert.equal(forwarded, expectedError);
});

test("async wrapper rejects non-function handlers at configuration time", () => {
    assert.throws(() => asyncHandler(null), TypeError);
});

test("request context adds a request id and logs only non-sensitive metadata", () => {
    const records = [];
    let now = 100;
    const middleware = createRequestContext({
        idFactory: () => "test-request-id",
        clock: () => now,
        logger: { info: (record) => records.push(record) },
    });

    const req = {
        method: "GET",
        headers: { cookie: "school_session=secret-session-token" },
        body: { studentName: "Private Student" },
        query: { studentId: "aaaaaaaaaaaaaaaaaaaaaaaa" },
        path: "/Student/aaaaaaaaaaaaaaaaaaaaaaaa",
    };
    const res = makeResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
        req.route = { path: "/Student/:id" };
    });

    assert.equal(nextCalled, true);
    assert.equal(req.requestId, "test-request-id");
    assert.equal(res.locals.requestId, "test-request-id");
    assert.equal(res.headers["X-Request-Id"], "test-request-id");

    now = 145;
    res.statusCode = 200;
    res.listeners.finish();

    assert.equal(records.length, 1);
    const log = JSON.parse(records[0]);
    assert.deepEqual(log, {
        event: "http_request",
        requestId: "test-request-id",
        method: "GET",
        route: "/Student/:id",
        statusCode: 200,
        durationMs: 45,
    });

    const serialized = JSON.stringify(log);
    assert.equal(serialized.includes("secret-session-token"), false);
    assert.equal(serialized.includes("Private Student"), false);
    assert.equal(serialized.includes("aaaaaaaaaaaaaaaaaaaaaaaa"), false);
});

test("request context uses an unmatched route label without logging raw paths or query data", () => {
    const records = [];
    const middleware = createRequestContext({
        idFactory: () => "unmatched-request",
        clock: () => 10,
        logger: { info: (record) => records.push(record) },
    });
    const req = {
        method: "GET",
        path: "/Student/secret-id",
        originalUrl: "/Student/secret-id?token=secret-query",
    };
    const res = makeResponse();

    middleware(req, res, () => {});
    res.listeners.finish();

    assert.equal(JSON.parse(records[0]).route, "unmatched");
    assert.equal(records[0].includes("secret-id"), false);
    assert.equal(records[0].includes("secret-query"), false);
});

test("global error middleware maps malformed JSON to a safe 400 contract", () => {
    const logs = [];
    const handler = createApiErrorHandler({
        logger: { error: (entry) => logs.push(entry) },
    });
    const res = makeResponse();
    res.locals.requestId = "request-json";
    const req = { method: "POST", route: { path: "/LearningQuizCreate" } };

    handler({ type: "entity.parse.failed", message: "body contained private content" }, req, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON",
        requestId: "request-json",
    });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].includes("private content"), false);
});

test("global error middleware maps oversized payloads and disallowed origins", () => {
    assert.deepEqual(getErrorResponse({ type: "entity.too.large" }), {
        status: 413,
        code: "PAYLOAD_TOO_LARGE",
        message: "Request payload is too large",
    });
    assert.deepEqual(getErrorResponse({ code: "CORS_ORIGIN_NOT_ALLOWED" }), {
        status: 403,
        code: "ORIGIN_NOT_ALLOWED",
        message: "Request origin is not allowed",
    });
});

test("global error middleware hides unknown internal error details", () => {
    const logs = [];
    const handler = createApiErrorHandler({
        logger: { error: (entry) => logs.push(entry) },
    });
    const res = makeResponse();
    const req = { method: "POST", headers: { cookie: "secret-cookie" } };
    const internalError = new Error("mongodb://user:password@host/private-db");

    handler(internalError, req, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred",
    });
    assert.equal(logs[0].includes("password"), false);
    assert.equal(logs[0].includes("secret-cookie"), false);
    assert.equal(logs[0].includes("private-db"), false);
});

test("global error middleware delegates when headers have already been sent", () => {
    const handler = createApiErrorHandler({ logger: { error() {} } });
    const res = makeResponse({ headersSent: true });
    const error = new Error("already streaming");
    let forwarded;

    handler(error, {}, res, (received) => {
        forwarded = received;
    });

    assert.equal(forwarded, error);
    assert.equal(res.body, undefined);
});

test("not-found middleware returns the stable API error contract", () => {
    const res = makeResponse();
    res.locals.requestId = "missing-route";
    createNotFoundHandler()({ method: "GET" }, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        code: "ROUTE_NOT_FOUND",
        message: "Route not found",
        requestId: "missing-route",
    });
});
