# AI Learning Module Boundaries and Route Integration Design

**Phase:** 08 — Learning module boundaries and route integration design  
**Implementation branch:** \`feature/learning-game-zones\`  
**Design baseline:** branch head \`f8fc836a52180dfdb5768f5710f76cdd6a61c35a\`  
**Status:** Design proposal; no runtime code changes in this phase

## 1. Purpose and scope

This document defines how Games Zone and AI Learning Studio fit into the existing MERN School Management System. It records the currently implemented routes and screens, defines the boundaries between the school platform, external Wordwall activities, and first-party learning features, and proposes the smallest file and API structure needed for later phases.

Phase 08 is intentionally a design-only phase. It does not add pages, change endpoint behavior, move existing files, introduce new models, or redesign the existing dashboards.

### Product boundaries

The system has three related but separate domains:

1. **School Management** remains the source of truth for authentication, roles, schools, classes, subjects, teachers, and students.
2. **Games Zone** stores and serves external Wordwall activity metadata. The application can observe its own catalogue and launch actions, but must not infer Wordwall answers, scores, or in-iframe time from an embedded page.
3. **AI Learning Studio** owns first-party quizzes, server-graded attempts, concept mastery, revision recommendations, approved curriculum retrieval, and teacher-reviewed generated content. Its learning evidence comes from first-party questions and submissions—not from Wordwall launches.

These domains may share school/class/subject references, but they must not share data semantics. A Wordwall launch is not a quiz attempt; a quiz attempt is not an attendance entry or an exam-result update.

## 2. Verified current implementation

The following observations are based on the current implementation branch, not inferred from the planning document.

### Backend layout and ownership

| Existing path | Current responsibility |
| --- | --- |
| \`backend/routes/route.js\` | Central Express router; registers the legacy school APIs, session endpoints, Game Zone endpoints, and Learning Quiz endpoints |
| \`backend/controllers/*-controller.js\` | Existing HTTP/controller convention; Game Activity and Learning Quiz have separate controllers |
| \`backend/models/gameActivitySchema.js\` | Separate Wordwall activity collection |
| \`backend/models/learningQuizSchema.js\` | First-party quiz, embedded questions/options, answer keys, status, and version |
| \`backend/models/learningAttemptSchema.js\` | Server-recorded student attempts and per-question response events |
| \`backend/middleware/authenticateSession.js\` | Verifies the signed HttpOnly session cookie and attaches verified claims to \`req.auth\` |
| \`backend/middleware/authorizeRoles.js\` | Enforces an explicit role allowlist |
| \`backend/middleware/loadActorContext.js\` | Reloads the account from MongoDB and attaches persisted school/class/subject scope as \`req.actor\` |
| \`backend/middleware/authorizeSchoolScope.js\` | Reusable school/resource ownership checks for routes |
| \`backend/utils/apiResponse.js\` | Shared structured API error response helper |
| \`backend/middleware/requestContext.js\` | Request ID and metadata-only request logging |
| \`backend/middleware/apiErrorHandler.js\` | Application-level error and not-found responses |

The backend uses CommonJS modules and Mongoose models. The current route registry is centralized in one \`route.js\` file and mounted at the Express root in \`backend/index.js\`.

### Frontend layout and ownership

| Existing path | Current responsibility |
| --- | --- |
| \`frontend/src/App.js\` | Restores the signed-in session and selects the Admin, Teacher, or Student dashboard |
| \`frontend/src/pages/admin/AdminDashboard.js\` | Admin nested route surface |
| \`frontend/src/pages/admin/SideBar.js\` | Admin navigation |
| \`frontend/src/pages/teacher/TeacherDashboard.js\` | Teacher nested route surface |
| \`frontend/src/pages/teacher/TeacherSideBar.js\` | Teacher navigation |
| \`frontend/src/pages/teacher/TeacherGameZone.js\` | Existing teacher Game Zone screen |
| \`frontend/src/pages/student/StudentDashboard.js\` | Student nested route surface |
| \`frontend/src/pages/student/StudentSideBar.js\` | Student navigation |
| \`frontend/src/pages/student/StudentGameZone.js\` | Existing student Game Zone screen |
| \`frontend/src/redux/userRelated/userHandle.js\` | Login, session restoration, logout, and existing user-related requests |
| \`frontend/src/utils/wordwallUrl.js\` | Client-side Wordwall URL helper |

The frontend uses React Router, Redux for user/session state, Material UI, styled-components, and Axios. The two existing Game Zone pages currently make their own Axios calls rather than using a feature API service.

### Current navigation map

| Role | Existing route | Existing navigation label | Status |
| --- | --- | --- | --- |
| Admin | No Learning & Games route | No learning/game item | Not implemented |
| Teacher | \`/Teacher/game-zone\` | Game Zone | Implemented |
| Student | \`/Student/game-zone\` | Game Zone | Implemented |

There is no teacher quiz-authoring page or student first-party quiz-taking page in the inspected dashboard route trees. The Learning Quiz backend API exists, but those UI workflows are still future work.

## 3. Backend module boundary proposal

Do not reorganize the existing backend directories. Continue using the established CommonJS and Mongoose conventions.

### Keep these existing layer responsibilities

- **Routes** declare URL, HTTP method, authentication, role, and route-level resource guards. They should not contain database queries or business rules.
- **Controllers** translate HTTP requests into domain operations and HTTP responses. They should not become a home for BKT calculations, recommendation algorithms, retrieval ranking, or model-training code.
- **Models** define persistence shape, field-level validation, indexes, and references. They should not contain Express request logic or frontend assumptions.
- **Middleware** handles authentication, persisted actor context, role checks, resource/tenant guards, and transport-level concerns.
- **Utilities** remain small, reusable, side-effect-limited functions such as URL validation, response formatting, or session signing.

The existing Game Activity and Learning Quiz controllers already inject model dependencies for deterministic tests. Retain that testability pattern for new domain controllers.

### Add a small service boundary only when a phase needs it

When concepts, mastery, recommendations, or curriculum retrieval are introduced, add a focused service directory rather than adding algorithmic logic to route files or React components:

~~~text
backend/
  controllers/
    game-activity-controller.js       # existing
    learning-quiz-controller.js       # existing
    learning-concept-controller.js    # future, only when concept APIs exist
    learning-content-controller.js    # future, only when content APIs exist
  models/
    gameActivitySchema.js             # existing
    learningQuizSchema.js             # existing
    learningAttemptSchema.js          # existing
    learningConceptSchema.js          # future
    learningMasterySchema.js          # future
    curriculumSourceSchema.js         # future
  services/
    learning/
      conceptService.js               # future concept lookup/validation
      masteryService.js               # future mastery state calculation
      recommendationService.js        # future deterministic selection policy
      curriculumRetrievalService.js   # future approved-source retrieval adapter
  middleware/
    ...                               # existing authentication and guards
  routes/
    route.js                          # existing central route registry
  utils/
    ...                               # existing shared utilities
~~~

The paths marked future are proposals, not files that should be created in Phase 08. Add a service only when it contains reusable domain logic with its own unit tests. Do not create empty folders or placeholder services.

Keep the existing flat \`backend/models\` and \`backend/controllers\` conventions for now. Do not move or rename existing model/controller files. Keep route registration in \`backend/routes/route.js\` until the number of feature routes makes a dedicated router justified; if that point is reached, mount the feature router from the central registry rather than changing the Express entry point.

### Domain ownership rules

- Game Activity owns external provider metadata, embed URL, school/class/subject links, creator, and publication state.
- Learning Quiz owns first-party quiz content, answer keys, publication state, and content version.
- Learning Attempt owns server-derived correctness, quiz-version reference, idempotency, and response history.
- Future Concept/Mastery/Recommendation records must be separate from existing attendance and examination-result records.
- Do not add unbounded arrays of activities or attempts to Admin, Teacher, Student, Class, or Subject documents.
- Do not store the Wordwall iframe HTML. Store and validate the URL; render the iframe using fixed React markup.
- Do not persist or display a mastery score until it is derived from first-party learning events and its model/version semantics are defined.

## 4. Frontend module boundary proposal

Keep the existing role dashboard shells and visual system. New pages should be added inside the role-specific page directories already used by the app.

### Proposed API client boundary

Introduce one credential-aware Axios client for new and migrated feature calls:

~~~text
frontend/src/
  api/
    apiClient.js                    # future shared Axios instance
    learning/
      gamesApi.js                   # Game Activity request functions
      quizzesApi.js                 # Learning Quiz request functions
      conceptsApi.js                # future concept lookups
      masteryApi.js                 # future learner mastery/progress
      recommendationsApi.js         # future revision suggestions
      contentApi.js                 # future grounded content/assistant calls
  pages/
    admin/
      AdminLearningGames.js         # future school catalogue management
    teacher/
      TeacherGameZone.js            # existing
      TeacherQuizManagement.js      # future quiz list/review
      TeacherQuizAuthoring.js       # future quiz authoring
    student/
      StudentGameZone.js            # existing
      StudentLearningStudio.js      # future quiz/topic discovery
      StudentQuizAttempt.js         # future first-party quiz attempt
      StudentLearningProgress.js    # future own progress/revision view
~~~

This is an incremental addition, not a migration of every existing school-management API. Keep the existing Redux user/session flow as the single owner of authenticated UI identity. Feature pages should not maintain a second copy of the session or treat IDs read from Redux as authorization.

For new Learning Studio pages:

- UI components call functions from the relevant API module; they do not construct raw URLs or repeat Axios configuration.
- API modules use the shared client and return the existing success payloads without silently reshaping them.
- Normalize errors in one place while retaining the backend's \`message\`, \`code\`, and request ID when present.
- Use page-local state for page-specific lists/forms/attempts. Do not add a large Redux feature slice until state genuinely needs to be shared across pages.
- Keep Wordwall URL presentation/validation helpers separate from first-party quiz and mastery logic.

### Credential transport requirement

Protected API requests must include the signed session cookie. The login, session-restore, and logout functions in \`userHandle.js\` explicitly set \`withCredentials: true\`. The current \`TeacherGameZone.js\` and \`StudentGameZone.js\` Axios calls do not explicitly set it.

When the frontend and backend are on different origins (for example, a local frontend on port 3000 and backend on port 5000), the browser will not send the cross-origin cookie unless the request opts into credentials. The backend CORS configuration already enables credentials and an origin allowlist.

**Required integration action:** implement the shared credential-aware client and migrate the existing Game Zone calls before treating browser-based Game Zone flows as verified across separate frontend/backend origins. This is recorded here rather than changed during this design-only phase.

## 5. Dashboard navigation proposal

The labels below are proposed. Existing items and paths remain unchanged.

| Role | Navigation item | Proposed route | Scope |
| --- | --- | --- | --- |
| Admin | Learning & Games | \`/Admin/learning-games\` | Own school's Game Activity catalogue and permitted aggregated content/learning status |
| Teacher | Game Zone | \`/Teacher/game-zone\` | Existing teacher-managed Wordwall records |
| Teacher | AI Learning Studio | \`/Teacher/learning-studio/quizzes\` | Teacher's own first-party quizzes and class/subject assignment |
| Student | Game Zone | \`/Student/game-zone\` | Published Wordwall activities eligible for the student's class |
| Student | AI Learning Studio | \`/Student/learning-studio\` | Published first-party quizzes available to the student's class |
| Student | My Learning Progress | \`/Student/learning-studio/progress\` | Only the signed-in student's own attempts, mastery estimates, and revision suggestions |

### Nested page routes

~~~text
Admin
  /Admin/learning-games
    catalogue filters
    activity details and moderation actions
    aggregate content-review status (when supported)

Teacher
  /Teacher/game-zone
    existing activity list/create/preview/publish/archive
  /Teacher/learning-studio/quizzes
    own quiz list and draft/published status
  /Teacher/learning-studio/quizzes/new
    quiz authoring
  /Teacher/learning-studio/quizzes/:quizId
    quiz preview/review; editable actions only after an explicit update contract exists

Student
  /Student/game-zone
    existing published Wordwall catalogue
  /Student/learning-studio
    published quiz/topic discovery
  /Student/learning-studio/quizzes/:quizId
    native first-party quiz attempt
  /Student/learning-studio/progress
    own progress and revision
~~~

The Admin screen is not an unrestricted learner-monitoring screen. The product requirement is school-level catalogue management and suitably aggregated learning/content status. Individual student answer histories, explanations, or chat content are not made visible to an Admin by default.

Navigation visibility is only a user-experience measure. Every route still depends on authenticated backend permissions.

## 6. Existing API ownership and request contracts

The current backend routes are registered in \`backend/routes/route.js\` and are mounted at the Express root. The endpoint names below are the current contract; this phase does not rename them.

### Games Zone

| Method and path | Current allowed role | Purpose and ownership |
| --- | --- | --- |
| \`POST /GameActivityCreate\` | Teacher | Create a draft for the signed-in Teacher's current school/class/subject |
| \`GET /GameActivityList/:schoolId\` | Teacher, Student | Teacher receives their own assigned-scope activities; Student receives published activities for their own school/class |
| \`PUT /GameActivityPublish/:id\` | Teacher | Publish the Teacher's own draft in their current assigned scope |
| \`PUT /GameActivityArchive/:id\` | Teacher | Archive the Teacher's own published activity |

Current create payload:

~~~json
{
  "title": "Fractions Challenge",
  "description": "Practise fractions",
  "topic": "Fractions",
  "embedUrl": "https://wordwall.net/embed/123456",
  "originalUrl": "https://wordwall.net/resource/123456"
}
~~~

- \`title\`, \`embedUrl\` are required; \`description\`, \`topic\`, and \`originalUrl\` are optional.
- The backend derives Teacher, school, class, and subject from the authenticated actor and current database assignment.
- A supplied \`teacherId\` is only checked as an identity match; it is not authority.
- Create always stores \`status: "draft"\`; a client cannot publish during creation.
- Publish and archive accept the activity ID in the path. A supplied body \`teacherId\` is checked against the session.
- The current API does not provide activity editing, a distinct unpublish transition, Admin catalogue endpoints, or launch analytics.

Current list query parameters:

| Parameter | Teacher behavior | Student behavior |
| --- | --- | --- |
| \`classId\` | Optional filter; must match assigned class | Optional filter; if supplied, must match own class; the server always derives the actual class |
| \`subjectId\` | Optional filter; must match assigned subject | Optional; server verifies the subject belongs to the student's school/class |
| \`teacherId\` | Optional identity assertion; must match session | Rejected |
| \`status\` | Optional \`draft\`, \`published\`, or \`archived\` filter | Only \`published\` is permitted |

The student page also filters unexpected response entries to published records and validates the embed URL before rendering. That client-side defense supplements—but never replaces—the backend query scope.

### AI Learning Studio — current first-party quiz API

| Method and path | Current allowed role | Purpose and ownership |
| --- | --- | --- |
| \`POST /LearningQuizCreate\` | Teacher | Create a draft quiz in the Teacher's assigned school/class/subject |
| \`GET /LearningQuizList/:schoolId\` | Teacher, Student | Teacher lists own quizzes; Student lists published quizzes for own class |
| \`PUT /LearningQuizPublish/:id\` | Teacher | Publish the Teacher's own draft quiz |
| \`POST /LearningQuizSubmit/:id\` | Student | Submit answers for a published quiz; the backend derives the student and grades the attempt |

Current quiz create payload:

~~~json
{
  "title": "Cell Structure Practice",
  "description": "Check the key ideas",
  "topic": "Cell Structure",
  "questions": [
    {
      "prompt": "Which structure contains the genetic material?",
      "concept": "Nucleus",
      "options": [
        { "optionId": "a", "text": "Nucleus" },
        { "optionId": "b", "text": "Cell wall" }
      ],
      "correctOptionId": "a",
      "explanation": "The nucleus contains most of the cell's genetic material."
    }
  ]
}
~~~

- A quiz is created as a draft. Question and option IDs are controlled by the server/Mongoose document; clients must not submit persistent question IDs during creation.
- The Teacher's school/class/subject and creator are derived from the persisted Teacher assignment.
- Teacher list requests are owner- and assignment-scoped. Student list requests require \`classId\`, reject \`teacherId\`, and return only published quizzes.
- The student-facing list projection omits \`correctOptionId\` and \`explanation\`.
- The API currently has no quiz update/edit or archive endpoint. Do not make the future authoring screen imply that saved questions can be edited until a versioned update contract and provenance rules are implemented.

Current quiz submission payload:

~~~json
{
  "idempotencyKey": "client-generated-unique-key",
  "answers": [
    { "questionId": "server-question-id", "selectedOptionId": "a" }
  ],
  "durationMs": 42000
}
~~~

- \`studentId\` is not required; if supplied, the controller rejects a mismatch with the authenticated Student.
- \`answers\` may be partial. Unanswered questions are recorded as incorrect by the server.
- \`durationMs\` is optional and bounded by the API validator.
- The backend validates question/option membership, calculates correctness using the stored answer key, and persists the attempt with the quiz version and idempotency key.
- A first successful submission returns HTTP 201 with the attempt and post-submission feedback. A replay with the same idempotency key returns the original attempt with \`replayed: true\`.
- The result feedback may include correctness, correct option ID, and explanation after submission. Those values must not appear in the pre-attempt student quiz payload.

### Future API ownership

The following responsibilities are not current endpoints and must be designed in their relevant phases:

| Future domain | Owns | Must not own |
| --- | --- | --- |
| Concept catalogue | Stable concept IDs, subject/class mapping, prerequisites, approved curriculum references | Quiz attempts or Wordwall scores |
| Mastery | Versioned concept mastery estimates derived from first-party attempts | Attendance, exam grades, or inferred Wordwall performance |
| Recommendation | Eligible published first-party items and human-readable selection rationale | Publishing or editing source questions |
| Curriculum retrieval | Approved source versions, chunks, provenance, retrieval evaluation | Student identity or answer-key authority |
| Grounded assistant | Explanations grounded in approved retrieved material and source references | Unreviewed curriculum facts or unrestricted learner records |
| Question generation/review | Candidate provenance, validation, reviewer decision, immutable published question versions | Automatic publication of generated content |

The existing Games and Quiz URLs are root-mounted and already used by the frontend. Do not change those URLs as part of Phase 08. The planning architecture's future versioned-learning route direction should be applied deliberately when adding the next new API family; exact versioned endpoints and any compatibility aliases should be finalized before those endpoints are implemented. Do not silently mix a path migration into a feature change.

## 7. Authorization and data-scope matrix

| Capability | Admin | Teacher | Student |
| --- | --- | --- | --- |
| Manage school Game Activity catalogue | Own school only; future Admin endpoint/UI required | No cross-teacher ownership; current endpoints manage own records | No |
| Create Wordwall activity | No current endpoint | Own assigned school/class/subject | No |
| Publish/archive Wordwall activity | Future moderation contract for Admin; no current Admin route | Own activity and current assignment only | No |
| List Wordwall activities | Future Admin catalogue endpoint | Own created records in current assignment | Published records in own class; subject must belong to same class |
| Create/publish first-party quiz | No current endpoint | Own assigned school/class/subject; draft before publish | No |
| List first-party quizzes | No current Admin endpoint | Own quizzes | Published quizzes for own class |
| Submit quiz attempt | No | No | Own authenticated student identity only |
| View individual attempts/mastery | No unrestricted access by default | Future class-level/appropriate teacher insights only | Own records only |
| View aggregated learning/content status | Own-school aggregation only, once designed and privacy-reviewed | Assigned class/subject aggregates, once designed | Own progress only |

### Authorization invariants

1. The verified session establishes identity. The persisted account record establishes current role and school/class/subject assignment.
2. Request body/query/path IDs are selectors, not proof of permission.
3. A Teacher's current assignment must be revalidated against the class and subject records and their school relationships.
4. A Student's class and school come from the Student record. Optional subject filters must belong to that same school and class.
5. An Admin's tenant is the Admin account's own school identity; there is no cross-school administrative override.
6. The server must reject a missing, deleted, mismatched, or stale actor/resource relationship. Client-side filtering and hidden buttons are not authorization.
7. Role and school scope must be tested at route/controller boundaries for every newly added operation.

## 8. Error states and client behavior

The new Games and Learning Quiz controller responses use the shared error shape:

~~~json
{
  "code": "VALIDATION_ERROR",
  "message": "A safe user-facing explanation",
  "requestId": "server-generated-request-id"
}
~~~

The \`message\` property is retained for current screens. \`requestId\` is present when request context has been established. Internal stack traces, ODM diagnostics, cookies, raw request data, and secrets must not be returned.

| Status | Code | Frontend behavior |
| --- | --- | --- |
| 400 | \`VALIDATION_ERROR\` | Show field/form validation feedback; keep safe user input where appropriate |
| 400 | \`INVALID_JSON\` | Show a generic invalid-request message; treat as a client/integration defect |
| 401 | \`AUTHENTICATION_REQUIRED\` | Clear/restore session state and return to role login; do not retry indefinitely |
| 403 | \`FORBIDDEN\` | Show access denied; do not expose controls for the denied operation |
| 404 | \`NOT_FOUND\` or \`ROUTE_NOT_FOUND\` | Distinguish an empty list from an unavailable/ineligible resource; do not reveal cross-tenant records |
| 409 | \`CONFLICT\` | Refresh the record and explain that its state changed or the transition is no longer valid |
| 413 | \`PAYLOAD_TOO_LARGE\` | Ask the user to reduce the submitted content |
| 429 | \`RATE_LIMITED\` | Show a bounded retry message; do not automatically loop requests |
| 500 | \`INTERNAL_ERROR\` | Show a generic failure and include the request ID in support diagnostics |
| 503 | \`SERVICE_UNAVAILABLE\` | Explain that the service could not verify/complete the request and allow a deliberate retry |

Every page that loads remote feature data needs explicit loading, empty, recoverable error, and success states. Forms additionally need field validation and submission-in-progress states. Quiz attempts need a submission lock, duplicate-submit protection, a clear result state, and safe handling of an idempotent replay.

### API contract consistency item

The current controller errors use \`sendApiError\`, but the inspected authentication/role/context middleware still has branches that return message-only JSON directly (for example, missing/invalid session, unsupported role, and actor verification failures). Those responses do not yet consistently include the stable \`code\` field described in \`backend/API_CONTRACT.md\`.

Before relying on one frontend error normalizer for all protected endpoints, align those middleware branches with the shared response helper and add tests for the complete route chain. Do not assume that controller-level API contract tests cover middleware rejections.

## 9. Known integration gaps and decisions

| Finding | Evidence in current branch | Required treatment |
| --- | --- | --- |
| Game Zone pages do not explicitly send cookie credentials | Teacher and Student Game Zone Axios calls omit \`withCredentials: true\`; login/session calls include it | Resolve through the shared API client before cross-origin browser-flow verification |
| Middleware failures are not fully standardized | Auth/role/actor middleware has message-only response branches | Normalize with the shared API error helper and test route-level 401/403/503 responses |
| Admin Learning & Games UI/API is absent | No Admin route/sidebar item or Admin Game Activity route is registered | Add only after explicit school-scoped Admin permissions are designed |
| Quiz authoring/taking UI is absent | Quiz backend routes/models exist; no corresponding dashboard pages are registered | Add Teacher and Student pages without changing Games Zone semantics |
| Quiz edit/archive contract is absent | Current Quiz controller supports create/list/publish/submit only | Define immutable version/update behavior before adding edit controls |
| Game Activity edit/unpublish/Admin contract is absent | Current Game controller supports create/list/publish/archive only | Define valid state transitions and role scope before adding those controls |
| Existing feature APIs are not URL-versioned | Router is mounted at \`/\`; current paths are \`/GameActivity...\` and \`/LearningQuiz...\` | Preserve existing URLs; decide versioned paths/aliases before adding external or breaking contracts |
| Wordwall does not expose first-party answer evidence to this app | Current design uses an external cross-origin embed | Do not derive mastery/quiz analytics from embed launches or guessed iframe events |

No feature should be represented in the UI before its supporting backend operation and role contract exist. In particular, do not add placeholder Admin moderation buttons, quiz editing controls, individual learner analytics, or AI answers that have no persisted/evaluated source.

## 10. Implementation order after this design

The existing implementation is ahead of parts of the original phase sequence: Game Activity, Learning Quiz, and some role-specific Games Zone UI already exist. Later phases must extend and verify those artifacts rather than duplicate them.

| Next phase | Design consequence |
| --- | --- |
| Phase 09 — GameActivity schema and invariants | Review the existing schema against deletion/reassignment and referential-integrity requirements; add only missing invariants/indexes with tests |
| Phase 10 — Safe Wordwall URL and embed component | Keep server and client URL validation aligned; use fixed iframe markup and fallback link |
| Phase 11 — Role-scoped Game APIs | Audit the existing four endpoints; add missing API capabilities only after permission/state transitions are explicit; fix credential transport and middleware error consistency before browser integration |
| Phase 12 — Admin management | Add school-scoped Admin catalogue endpoints before exposing the Admin page |
| Phase 13–14 — Teacher/Student UI | Complete existing Game Zone pages and add first-party Learning Studio pages using the shared API client; do not rebuild dashboard shells |
| Phase 15 onward | Keep curriculum concepts, first-party attempts, mastery, recommendations, retrieval, and generated content in the AI Learning Studio boundary |

## 11. Phase 08 review gate

Before feature implementation continues, review and accept these decisions:

- [x] Existing backend/frontend integration points and current Game Zone routes are mapped.
- [x] Games Zone, AI Learning Studio, and School Management responsibilities are separated.
- [x] Proposed backend/frontend file boundaries preserve the current CommonJS/Mongoose and React dashboard conventions.
- [x] Current API routes, roles, payloads, and ownership rules are documented.
- [x] Proposed role navigation paths and access scopes are documented.
- [x] Error states and current API-contract gaps are recorded.
- [x] Credential transport gap in the current Game Zone pages is identified.
- [x] No existing runtime files were changed in this phase.

**Phase 08 output:** this design document. It is a reviewable integration contract, not a claim that the proposed future pages, APIs, or services have already been implemented.
