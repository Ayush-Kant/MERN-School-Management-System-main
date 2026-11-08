# Backend API contract

## Scope and compatibility

This contract is applied to the new Games Zone and Learning Quiz endpoints:

- `POST /GameActivityCreate`
- `GET /GameActivityList/:id`
- `PUT /GameActivityUpdate/:id`
- `PUT /GameActivityPublish/:id`
- `PUT /GameActivityUnpublish/:id`
- `PUT /GameActivityArchive/:id`
- `POST /LearningQuizCreate`
- `GET /LearningQuizList/:id`
- `PUT /LearningQuizPublish/:id`
- `POST /LearningQuizSubmit/:id`

Successful response bodies remain unchanged. Error responses keep the existing
root-level `message` property because current frontend screens read
`response.data.message`. The stable `code` and optional `requestId` fields
are additive.

## GameActivity lifecycle and ownership

The authenticated session and the current database Teacher/Student records determine
identity and school/class/subject scope. Request-supplied `teacherId` is accepted
only as an optional identity assertion; it cannot change the actor. School,
class, subject, creator, provider, and lifecycle status cannot be set through the
update payload.

| Method and path | Role | Behavior |
| --- | --- | --- |
| `POST /GameActivityCreate` | Teacher | Creates a draft using the Teacher's current school/class/subject assignment |
| `GET /GameActivityList/:id` | Teacher, Student | Teacher sees their own assigned-scope records; Student sees published records eligible for their own class and optional subject |
| `PUT /GameActivityUpdate/:id` | Teacher | Updates only the Teacher's own draft; mutable fields are title, description, topic, embedUrl, and originalUrl |
| `PUT /GameActivityPublish/:id` | Teacher | Transitions the Teacher's own draft to published |
| `PUT /GameActivityUnpublish/:id` | Teacher | Transitions the Teacher's own published activity back to draft and records `unpublishedAt` |
| `PUT /GameActivityArchive/:id` | Teacher | Archives the Teacher's own published activity |

A published activity must be unpublished before it can be edited. Archived
activities are immutable through this API. Each update uses an atomic scoped
write against creator, school, class, subject, and expected status. Mongoose
timestamps maintain `updatedAt`; publish, unpublish, and archive transitions
also record their corresponding lifecycle timestamps. Students cannot request
draft or archived records, and cannot supply teacher identity filters.

Existing root-mounted Teacher/Student GameActivity paths remain unchanged.
Admin catalogue management uses separate Admin-only endpoints; it does not widen
the existing Teacher lifecycle permissions or accept a client-controlled tenant.

## Admin Learning & Games catalogue

The Admin catalogue derives its tenant exclusively from the authenticated,
database-backed actor context. For an Admin, `req.actor.schoolId` must equal
the signed-in Admin's `req.actor.userId`. No school identifier is accepted in
the request path, query, or body.

| Method and path | Role | Behavior |
| --- | --- | --- |
| `GET /AdminGameActivityList` | Admin | Returns the signed-in school's catalogue, pagination, status summary, and school-scoped filter options |
| `PUT /AdminGameActivityUnpublish/:id` | Admin | Atomically transitions a published activity in the Admin's school to draft and records `unpublishedAt` |
| `PUT /AdminGameActivityArchive/:id` | Admin | Atomically transitions a published activity in the Admin's school to archived and records `archivedAt` with `archiveReason: "manual"` |

The list endpoint accepts these optional query parameters:

| Parameter | Allowed values / behavior |
| --- | --- |
| `classId` | A class ID that belongs to the signed-in Admin's school |
| `subjectId` | A subject ID that belongs to the school and, when supplied, the selected class |
| `teacherId` | A teacher ID that belongs to the signed-in Admin's school |
| `status` | `all`, `draft`, `published`, or `archived` |
| `provider` | `all` or `wordwall` |
| `search` | Optional literal text search over title, description, and topic; maximum 100 characters |
| `page` | Positive, one-based page number from 1 through 100000; default `1` |
| `limit` | Page size from 1 through 100; default `25` |

Unknown query parameters are rejected, including any attempted school/tenant
override. Supplied class, subject, and teacher IDs are resolved and checked
against the authenticated Admin's school before they are used as filters.
Search input is escaped before being used in a regular expression.

The successful list response has this shape:

```json
{
  "activities": [],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "totalPages": 0
  },
  "summary": {
    "total": 0,
    "draft": 0,
    "published": 0,
    "archived": 0
  },
  "filters": {
    "classes": [],
    "subjects": [],
    "teachers": []
  }
}
```

Each activity includes the stored source and lifecycle metadata. The class,
subject, and creator references are populated with only the fields needed by
the Admin catalogue (class name, subject name/code, and teacher name).

Admin unpublish/archive operations accept only a valid activity ID. Their
database writes constrain both the activity ID and the Admin's school and
require the current state to be `published`. Draft and archived activities
cannot be changed by these Admin actions. A missing/out-of-school activity
returns 404; a same-school activity in a non-published state returns 409.
These Admin operations do not permit editing, deletion, or publishing drafts.

The Admin routes use the same ordered middleware contract as other protected
routes: authenticate session, require the Admin role, then load persisted actor
context. The existing Teacher-only create/update/publish/unpublish/archive
endpoints remain Teacher-only.

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
