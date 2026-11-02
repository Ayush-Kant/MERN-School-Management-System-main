# Backend API contract

## Scope and compatibility

This contract is applied to the new Games Zone and Learning Quiz endpoints:

- `POST /GameActivityCreate`
- `GET /GameActivityList/:id`
- `PUT /GameActivityPublish/:id`
- `PUT /GameActivityArchive/:id`
- `POST /LearningQuizCreate`
- `GET /LearningQuizList/:id`
- `PUT /LearningQuizPublish/:id`
- `POST /LearningQuizSubmit/:id`

Successful response bodies remain unchanged. Error responses keep the existing
root-level `message` property because current frontend screens read
`response.data.message`. The stable `code` and optional `requestId` fields
are additive.

## Error body

When request context is available:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "A safe, user-facing explanation",
  "requestId": "server-generated-request-id"
}
```

Without request context, `requestId` is omitted. Do not return stack traces,
database diagnostics, connection strings, cookies, or raw request data.

## Status and error codes

| HTTP status | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid request values or structure |
| 401 | `AUTHENTICATION_REQUIRED` | Missing or invalid authenticated identity |
| 403 | `FORBIDDEN` | Authenticated role or identity is not permitted |
| 404 | `NOT_FOUND` | Requested resource is unavailable in the caller's scope |
| 409 | `CONFLICT` | Requested state transition or operation conflicts with current state |
| 413 | `PAYLOAD_TOO_LARGE` | JSON request body exceeds the configured limit |
| 429 | `RATE_LIMITED` | Reserved for rate-limiting responses |
| 500 | `INTERNAL_ERROR` | Unexpected server failure |
| 503 | `SERVICE_UNAVAILABLE` | A required service or dependency cannot be verified |

Additional transport-level codes:

- `INVALID_JSON` — malformed JSON request body, HTTP 400.
- `ORIGIN_NOT_ALLOWED` — rejected CORS origin, HTTP 403.
- `ROUTE_NOT_FOUND` — no API route matched, HTTP 404.

Mongoose validation and cast failures are returned as a generic validation
message. Internal ODM messages are not sent to clients.

## Request tracing and logging

The server creates an opaque request ID for each request and returns it in the
`X-Request-Id` response header. Standardized API errors also include that ID
when available.

Access logs contain only the request ID, HTTP method, route template, status,
and duration. They intentionally omit request bodies, query strings, headers,
cookies, raw parameter values, IP addresses, and learner identifiers.
Unhandled error logs contain only sanitized error type/code metadata and the
request ID; they do not include exception messages or stacks.

## Async error handling

Express 4 does not automatically forward rejected async route handlers. The
Games and Learning Quiz route handlers are wrapped with `asyncHandler`, which
forwards rejected promises and synchronous throws to the application-level
error middleware. The middleware returns a generic 500 response unless the
error is a recognized malformed-JSON, oversized-body, or CORS error.

## Test isolation

Run from the `backend` directory:

```powershell
npm test
```

The test command preloads `tests/test-env.js`, forcing `NODE_ENV=test`, a
local `school_management_test` MongoDB URI, local frontend CORS origin, and a
test-only session secret. The current unit suite uses injected model doubles
and does not connect to MongoDB. Never point this suite at a development or
production database.
