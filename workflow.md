# End-to-End Application Workflow and Architecture Guide

**Repository:** Ayush-Kant/MERN-School-Management-System-main  
**Branch reviewed:** feature/learning-game-zones  
**Source revision reviewed:** ab334c4b529ebfdf19b2309dbc2eb5d992575901  
**Review date:** 21 November 2026 (Asia/Kolkata)  
**Audience:** New contributors, maintainers, technical reviewers and interview preparation

> This guide describes the source tree at the revision above. It distinguishes code that is present from features planned in the project harness. A planned workflow is not evidence that the feature is currently implemented. Source inspection also does not prove that a feature has been deployed, that a database has been seeded, or that every browser/acceptance test has passed.

---

## 1. Reading this guide and current implementation status

The application has three related product areas:

1. **School Management:** Admin, Teacher and Student accounts, with school, class and subject records as the authoritative tenant and academic structure.
2. **Games Zone:** Teacher-managed external Wordwall links, Admin moderation and Student playback.
3. **AI Learning Studio:** a first-party quiz/attempt backend foundation, intended to grow into concept mastery, revision recommendations, curriculum-grounded explanations and Teacher-reviewed generated content.

The labels below make implementation maturity explicit.

| Label | Meaning |
|---|---|
| Implemented | Code exists in the current source tree. This does not automatically mean all manual/browser checks are complete. |
| Partial foundation | Some schema, controller or infrastructure exists, but the complete end-user workflow is absent. |
| Planned | Specified in the implementation harness/design but not implemented in the current source revision. |
| Gated | Must not be enabled until the stated approval, permission, safety or test condition is satisfied. |
| Manual verification | Requires a real browser, database, deployment or educator review; static code alone cannot prove it. |

### Current maturity snapshot

| Capability | State at the reviewed revision |
|---|---|
| Admin / Teacher / Student school dashboards | Implemented |
| Password hashing and signed HttpOnly cookie session | Implemented |
| Persisted role and school/resource scope middleware | Implemented |
| Existing classes, subjects, attendance, marks, notices and complaints | Implemented legacy workflows |
| Admin Learning & Games catalogue | Implemented |
| Teacher My Games create/edit/preview/publish/unpublish/archive | Implemented |
| Student published-only Games Zone | Implemented |
| Safe Wordwall URL parser and fixed iframe renderer | Implemented |
| ChemAmaze 18-record manifest, validation, dry-run and dev-only importer | Implemented; actual database import not confirmed |
| Class 7 Science Chapter 2 concept taxonomy with seven IDs | Implemented as draft review metadata; educator approval pending |
| Teacher-created first-party MCQ quiz APIs and server grading | Partial foundation; backend exists |
| Student quiz-taking UI / Teacher quiz authoring UI | Not present in dashboard route trees |
| Stable concept ID enforcement in quiz questions | Not present; current quiz concept field is free text |
| Learning analytics, BKT, persisted mastery, recommendations | Planned |
| Curriculum ingestion, retrieval, grounded assistant, AI question drafts | Planned and rights-gated |
| Teacher review/publish workflow for AI-generated content | Planned |

The implementation plan is in **AI_LEARNING_GAMES_IMPLEMENTATION_HARNESS.md**. The Phase 08 design is in **AI_LEARNING_MODULE_DESIGN.md**. Phase 16 curriculum decisions are in **AI_LEARNING_CURRICULUM_SCOPE.md**. **PROJECT_HANDOFF.md** is the chronology and phase-status record.

---

## 2. System architecture

The school-management application remains the host system. ChemAmaze is a legacy source catalogue, not a second user/account platform.

**Mermaid authoring convention:** flowchart nodes use explicit identifiers with bracketed labels (for example, `A["Node label"]`). Edge labels use `A -->|label| B`; a quoted phrase is not a node and must never appear as `A --> "label" --> B`. Sequence, state and ER diagrams use their respective Mermaid grammars.

~~~mermaid
flowchart TB
    subgraph Browser["Browser — React 18"]
      Pages["Public pages and role dashboards"]
      Router["React Router"]
      State["Redux Toolkit state"]
      Feature["Admin / Teacher / Student Games pages"]
      QuizUI["Future Student quiz and Teacher authoring UI"]
      Pages --> Router
      Pages --> State
      State --> Pages
      Router --> Feature
      Router -. planned .-> QuizUI
    end

    subgraph API["Node.js + Express API"]
      CORS["CORS, request ID, JSON parser"]
      Session["Signed cookie verification"]
      Role["Role allowlist"]
      Actor["Reload persisted user and assignments"]
      Scope["School / class / subject / resource scope"]
      Route["Central route registry"]
      Controller["Controllers"]
      Service["Learning domain services"]
      Model["Mongoose models"]
      CORS --> Route
      Route --> Session --> Role --> Actor --> Scope --> Controller
      Controller --> Service
      Controller --> Model
      Service --> Model
    end

    DB[("MongoDB")]
    Wordwall["External Wordwall"]
    Legacy["Pinned ChemAmaze manifest"]
    Importer["Development-only importer"]
    Curriculum["Future rights-cleared curriculum"]
    ML["Future BKT / retrieval / AI adapters"]

    Router --> CORS
    Model --> DB
    DB --> Model
    Feature -->|"Validated embed URL"| Wordwall
    Legacy --> Importer --> DB
    Curriculum -.-> ML
    ML -.-> Service
~~~

### Technology responsibilities

| Layer | Technologies | Responsibility |
|---|---|---|
| Frontend | React 18, React Router 6 | Screens, navigation, form state and client rendering. |
| Component/UI layer | Material UI, styled-components | Layout, dialogs, cards, tables, drawers and responsive presentation. |
| Client application state | Redux Toolkit, React Redux | Session/profile display state and legacy school-related collections. |
| HTTP client | Axios | JSON API calls; feature client sends credentials. |
| Backend | Node.js, Express 4 | HTTP routes, ordered middleware, controllers and errors. |
| Persistence | MongoDB, Mongoose 7 | School entities, games, quiz definitions and attempts. |
| Password hashing | bcrypt | Admin, Teacher and Student credential hashes. |
| Session signing | Node crypto HMAC-SHA256 | Signs and verifies the short-lived application session token. |
| Tests | Node built-in test runner; CRA/Jest | Backend tests and frontend component/utility tests. |
| Planned analytics/ML | Not added | The harness proposes an independently testable Python BKT/evaluation component when that phase arrives. |

There is no Python service, language-model SDK, vector database, embeddings pipeline, model endpoint or BKT runtime in the current tracked source.

---

## 3. Runtime startup and Express request lifecycle

### 3.1 Backend startup

**backend/index.js** is the server entry point.

1. Load backend environment variables with dotenv.
2. Create the Express application.
3. Install request-context middleware so each request gets an opaque request ID.
4. Install the credential-aware CORS policy.
5. Install JSON parsing with a 10 MB request-body limit.
6. Initiate the Mongoose connection using MONGO_URL.
7. Mount the route registry from backend/routes/route.js.
8. Install a not-found handler and the final API error handler.
9. Start the HTTP listener on PORT or the default port 5000.

**Operational nuance:** the source starts the HTTP listener even if the initial MongoDB connection attempt fails. A production readiness endpoint/gate and explicit reconnect/health policy should be considered; do not assume the current process refuses all traffic when MongoDB is unavailable.

### 3.2 Protected request lifecycle

~~~mermaid
flowchart TD
  A["Browser sends request with cookie"] --> B["Request ID and CORS"]
  B --> C["JSON body parser"]
  C --> D{"Route registered?"}
  D -- no --> N["Structured 404"]
  D -- yes --> E{"Protected route?"}
  E -- no --> P["Public handler"]
  E -- yes --> F["Read school_session cookie"]
  F --> G{"Signature, expiry and claims valid?"}
  G -- no --> X["401 authentication error"]
  G -- yes --> H["Check permitted role"]
  H --> I["Reload account from MongoDB"]
  I --> J{"Account exists and stored role matches?"}
  J -- no --> Y["401 / 403"]
  J -- yes --> K["Derive current tenant and assignments"]
  K --> L["Resolve resource and enforce scope"]
  L --> M{"Authorized?"}
  M -- no --> Q["403 or non-disclosing 404"]
  M -- yes --> R["Controller validates request and business rules"]
  R --> S["Mongoose reads/writes"]
  S --> T["JSON success response"]
  P --> T
~~~

The newer Game Activity, Admin Game Activity and Learning Quiz async handlers use **backend/utils/asyncHandler.js** to forward rejected promises to Express's error middleware. Many pre-existing controller methods retain their original local try/catch response style.

### 3.3 Request tracing and safe errors

- **requestContext.js** creates an opaque request ID and returns it in the X-Request-Id response header.
- **apiResponse.js** creates stable API error bodies with code, message and requestId when available.
- **apiErrorHandler.js** handles not-found and errors centrally and recognizes malformed JSON, oversized JSON and CORS rejection cases.
- Logs intentionally omit request bodies, cookies, arbitrary headers, query strings, raw parameter values and learner identifiers. They focus on request ID, method, route template, status, duration and sanitized error metadata.

The intent is to support debugging without copying student data or session credentials into logs.

---

## 4. Authentication, session and authorization

Authentication establishes who is signed in. Authorization establishes what that account can access. Frontend role state is useful for rendering but is not the security boundary.

### 4.1 Password handling

- Admin registration uses **backend/utils/adminPassword.js** to hash the password with bcrypt.
- Teacher and Student registration hash their passwords with bcrypt in their controllers.
- Admin login calls verifyAdminPassword. A bcrypt hash is verified with bcrypt.compare. For compatibility with a legacy Admin record, a matching plaintext password is immediately replaced with a bcrypt hash after successful login.
- Teacher and Student login compare the supplied password with the persisted bcrypt hash.
- Login/profile response handlers remove password fields before returning user data.

The Admin plaintext compatibility code is a migration bridge, not a permanent target. It should be retired once legacy accounts have been migrated and recovery/backups are understood.

### 4.2 Signed HttpOnly cookie

**backend/utils/authSession.js** owns token creation, verification and cookie handling.

The token contains a version, subject/account ID, role, issued-at time, expiry time and issuer. The server signs the payload with HMAC-SHA256 and checks the signature using a timing-safe comparison. The verifier validates token structure, issuer, role, account ID, timestamps and lifetime.

Configuration observed in source:
- AUTH_SESSION_SECRET is required and must be at least 32 bytes.
- AUTH_SESSION_TTL_SECONDS defaults to 3600 seconds and is bounded between 300 and 86400 seconds.
- Cookie name is school_session.
- HttpOnly and Path=/ are always set.
- SameSite defaults to Lax and supports Lax, Strict or None.
- Secure is enabled in production, when explicitly configured, or when SameSite=None.
- Logout expires the same cookie.

This is a signed stateless token held in a browser cookie, not a server-side session record. The source does not maintain a token revocation list. Logout clears the browser cookie; expired tokens fail verification when their expiry passes.

### 4.3 Authentication sequence

~~~mermaid
sequenceDiagram
  participant UI as Browser / Redux
  participant API as Express
  participant DB as MongoDB
  UI->>API: GET /AuthSession with credentials
  API->>API: Verify signature, issuer, role and expiry
  API->>DB: Reload account by signed ID and role
  DB-->>API: Persisted profile and current assignments
  API-->>UI: Safe profile without password
  UI->>UI: Set currentUser/currentRole in Redux
  Note over UI,API: Invalid/expired/missing cookie -> unauthenticated state
  UI->>API: POST /AdminLogin, /TeacherLogin or /StudentLogin
  API->>DB: Find account and verify bcrypt password
  API->>API: Sign token and Set-Cookie
  API-->>UI: Safe profile + HttpOnly cookie
  UI->>API: POST /AuthLogout
  API->>API: Expire school_session cookie
  API-->>UI: 204 No Content
~~~

Login endpoint conventions:
- Admin: POST /AdminLogin, email + password.
- Teacher: POST /TeacherLogin, email + password.
- Student: POST /StudentLogin, roll number + student name + password.
- Session restore: GET /AuthSession.
- Logout: POST /AuthLogout.

### 4.4 Middleware ordering and tenant authority

The protected route stacks in **route.js** deliberately follow:

1. **authenticateSession** — verify cookie; attach signed claims as req.auth.
2. **authorizeRoles** — compare the verified role to explicit route roles.
3. **loadActorContext** — reload account from MongoDB, verify persisted role still matches, derive trusted school/class/subject identifiers and attach req.actor.
4. **authorizeSchoolScope** — resolve the resource from MongoDB and check tenant ownership and role/resource constraints where applicable.
5. Controller — apply operation-specific validation and data rules.

Scope values are derived from persisted records:
- Admin's school scope is the Admin's own account ID.
- Teacher scope comes from Teacher.school, Teacher.teachSclass and Teacher.teachSubject.
- Student scope comes from Student.school and Student.sclassName.

A request path/query/body ID can identify the resource the client wants. It cannot redefine the logged-in actor or tenant.

The generic scope middleware handles school, self, class, student, teacher, subject and notice resources. It can also check relationship constraints, such as ensuring a subject belongs to the class already resolved earlier in the same request.

### 4.5 Frontend identity is not authority

The Redux user slice stores currentUser and currentRole and mirrors a safe profile in localStorage for UI convenience. The backend does not trust localStorage. Feature API calls use the HttpOnly cookie and server-side user reload.

**Production caution:** ChooseUser.js and LoginPage.js contain hard-coded guest/demo credentials and account identifiers. That is a demo shortcut, not a secure production authentication method. Disable or replace the guest path before deployment to real schools.

### 4.6 Security deployment checks still required

- Admin registration is a public bootstrap endpoint in the current route registry. A public deployment needs an explicit one-time provisioning/registration policy.
- Credentialed CORS and SameSite cookie attributes exist, but CORS is not a complete CSRF defense. Evaluate the deployed origin topology and add appropriate Origin/CSRF checks if required.
- No rate-limiting middleware is present in the inspected route stack. Login, public registration and future AI endpoints need abuse controls before public exposure.
- Production AUTH_SESSION_SECRET, MONGO_URL, frontend origin and cookie settings must be configured in secret storage.
- frontend/.env currently holds only the local public API base URL. REACT_APP_* values are bundled into the browser and must never contain secrets.
- The root README retains older SECRET_KEY setup wording. For this branch, prefer backend/.env.example and the current AUTH_SESSION_SECRET settings; do not copy obsolete configuration literally.

---

## 5. School-management domain and data relationships

Existing school records remain authoritative. New feature records reference them rather than introducing a second School/Class/Subject identity system.

### 5.1 Main domain relationship diagram

~~~mermaid
erDiagram
  ADMIN ||--o{ SCLASS : owns
  ADMIN ||--o{ TEACHER : employs
  ADMIN ||--o{ STUDENT : enrolls
  ADMIN ||--o{ SUBJECT : offers
  ADMIN ||--o{ NOTICE : publishes
  ADMIN ||--o{ COMPLAIN : receives
  SCLASS ||--o{ STUDENT : contains
  SCLASS ||--o{ SUBJECT : teaches
  SUBJECT o|--o| TEACHER : assigned_to
  TEACHER ||--o{ GAMEACTIVITY : creates
  ADMIN ||--o{ GAMEACTIVITY : tenant
  SCLASS ||--o{ GAMEACTIVITY : class
  SUBJECT ||--o{ GAMEACTIVITY : subject
  TEACHER ||--o{ LEARNINGQUIZ : authors
  STUDENT ||--o{ LEARNINGATTEMPT : submits
  LEARNINGQUIZ ||--o{ LEARNINGATTEMPT : receives
~~~

These are Mongoose references, not relational foreign keys. MongoDB does not enforce cross-collection referential integrity automatically. Middleware, controllers and domain services must validate the relationships before using a record.

### 5.2 Core models

| Model file | Stored concept and important fields |
|---|---|
| adminSchema.js | Admin login and school identity: name, email, password hash, role and schoolName. Admin ID is also the school reference used by other entities. |
| sclassSchema.js | School-owned class name and Admin school reference. |
| subjectSchema.js | Subject name/code/session count, class, school and optional assigned Teacher. |
| teacherSchema.js | Teacher credentials and role, school, teachSclass, teachSubject and Teacher attendance. |
| studentSchema.js | Student credentials, roll number, school/class, examResult and subject attendance arrays. |
| noticeSchema.js | School notice title, details, date and timestamps. |
| complainSchema.js | Student complaint, date, school reference and Student user reference. |
| gameActivitySchema.js | Independent GameActivity documents with school/class/subject/Teacher references, provider, validated URL, lifecycle and optional legacy provenance. |
| learningQuizSchema.js | First-party quiz metadata, embedded MCQ questions/options, server-held correctOptionId, version and publication status. |
| learningAttemptSchema.js | Student quiz attempt, selected responses, server-derived correctness, quiz version, idempotency key and score fields. |

Existing attendance and exam marks remain separate from the first-party LearningAttempt collection. A formative quiz attempt does not automatically become a school exam mark or attendance event.

### 5.3 Admin, Teacher and Student workflows

**Admin setup**
1. Admin registers a school account and signs in.
2. The Admin creates Classes.
3. The Admin creates Subjects associated with a Class.
4. The Admin registers Teachers against a Class and Subject.
5. The Admin registers Students in a Class.
6. The Admin manages school notices, reviews complaints and uses the school-management dashboard.
7. The Admin can inspect the school's Learning & Games catalogue.

**Teacher routine**
1. Teacher signs in.
2. The backend returns the Teacher's current persisted school/class/subject assignment.
3. Teacher opens the assigned class and inspects Student records.
4. Teacher records subject attendance and exam marks using existing school routes.
5. Teacher opens My Games to manage Wordwall activities in the assigned scope.

**Student routine**
1. Student signs in with roll number, name and password.
2. Student views dashboard, profile, subjects, attendance, complaints and Game Zone.
3. The backend loads records for the Student's persisted school/class and denies foreign scope.

### 5.4 Existing API route catalogue

The central registry is **backend/routes/route.js**. These are the route families registered in the current branch; exact access restrictions are defined by their middleware stacks.

| Route family | Purpose | Protection |
|---|---|---|
| POST /AdminReg, /AdminLogin | Admin bootstrap registration and login | Public in current source. |
| GET /Admin/:id | Admin detail | Admin session; own ID only. |
| POST /StudentReg, /StudentLogin | Student registration and login | Registration requires Admin plus school/class scope; login public. |
| GET /Students/:id | List Students in a school | Admin, own school. |
| GET /Student/:id | Student detail | Authenticated school member; Student self and Teacher same-class restrictions. |
| DELETE /Students/:id, /StudentsClass/:id, /Student/:id | Delete Student(s) | Admin plus school/class/Student resource checks. |
| PUT /Student/:id | Update Student fields | Admin plus target Student and class check. |
| PUT /UpdateExamResult/:id | Add/update subject exam marks | Admin or Teacher; target Student and subject relationship checks. |
| PUT /StudentAttendance/:id | Record/update subject attendance | Admin or Teacher; target Student and subject relationship checks. |
| PUT /RemoveAllStudentsSubAtten/:id | Clear one subject's attendance entries | Admin or Teacher; subject scope. |
| PUT /RemoveAllStudentsAtten/:id | Clear a school's attendance | Admin, own school. |
| PUT /RemoveStudentSubAtten/:id, /RemoveStudentAtten/:id | Remove selected Student attendance | Admin or Teacher with Student/subject checks. |
| POST /TeacherReg, /TeacherLogin | Teacher registration and login | Registration requires Admin and checked school/class/subject; login public. |
| GET /Teachers/:id | List Teachers in school | Admin, own school. |
| GET /Teacher/:id | Teacher detail | Admin or Teacher with scope checks. |
| DELETE /Teachers/:id, /TeachersClass/:id, /Teacher/:id | Delete Teacher(s) | Admin with school/class/Teacher checks. |
| PUT /TeacherSubject | Reassign Teacher subject | Admin with Teacher and subject relationship checks. |
| POST /TeacherAttendance/:id | Teacher attendance | Admin with target Teacher scope. |
| POST /NoticeCreate, GET /NoticeList/:id | Create/list notices | Admin creates; school members read own school. |
| PUT /Notice/:id, DELETE /Notice/:id, DELETE /Notices/:id | Update/delete notices | Admin and notice/school scope. |
| POST /ComplainCreate, GET /ComplainList/:id | Student complaint and Admin list | Student creates own; Admin reads own school. |
| POST /SclassCreate, GET /SclassList/:id, GET /Sclass/:id | Create/list/detail class | Admin creates/lists; authorized school member reads allowed class. |
| GET /Sclass/Students/:id | Students in a class | Admin or Teacher, class scope. |
| DELETE /Sclass/:id, DELETE /Sclasses/:id | Delete Class or school Classes | Admin, own school/class. GameActivity archival runs first. |
| POST /SubjectCreate, GET /AllSubjects/:id | Create/list school Subjects | Admin, own school/class. |
| GET /ClassSubjects/:id, /FreeSubjectList/:id, GET /Subject/:id | Class, free and detail subject reads | Admin/member scope as configured. |
| DELETE /Subject/:id, /Subjects/:id, /SubjectsClass/:id | Delete Subject(s) | Admin; dependent games archived first. |
| Game Activity routes | Create/list/update/publish/unpublish/archive | Teacher or Student according to operation. |
| Admin Game Activity routes | Admin catalogue/unpublish/archive | Admin, own school. |
| AuthSession/AuthLogout | Session restore/logout | Session verification for restore; logout clears cookie. |
| Learning Quiz routes | Create/list/publish/submit MCQ quiz | Teacher or Student according to operation. |

Legacy controller response conventions are not uniformly modernized. New feature code should follow the tested scope and error patterns rather than broad-refactoring unrelated modules without a scoped phase.

---

## 6. Authentication-aware frontend architecture

### 6.1 Frontend entry points

- **frontend/public/index.html** provides the HTML shell and root mount point.
- **frontend/src/index.js** creates the React root, imports global CSS, configures Axios credential defaults and wraps the app in the Redux Provider.
- **frontend/src/App.js** dispatches restoreSession on mount. While the session is being checked it shows a loading view. If unauthenticated it exposes public routes; if authenticated it selects AdminDashboard, TeacherDashboard or StudentDashboard based on Redux role.
- Each dashboard is a route shell with an AppBar, drawer/sidebar and nested React Router routes.

### 6.2 Authentication state

**userSlice.js** contains status/currentUser/currentRole/sessionStatus and UI-related state.  
**userHandle.js** implements restoreSession, loginUser, registerUser and logoutUser plus legacy generic user operations.

Other Redux store modules manage Student, Teacher, Notice, Complain and Class/Subject lists. Feature pages for Games Zone and the quiz backend use React component state rather than a new Learning Redux slice.

### 6.3 Route map

| Role shell | Important routes in current dashboard |
|---|---|
| AdminDashboard | /Admin/dashboard, /Admin/learning-games, /Admin/profile, class/student/subject/teacher screens, notices, complaints and fees page. |
| TeacherDashboard | /Teacher/dashboard, /Teacher/profile, /Teacher/complain, /Teacher/my-games, /Teacher/class, individual Student, attendance and marks routes. /Teacher/game-zone redirects to /Teacher/my-games. |
| StudentDashboard | /Student/dashboard, /Student/profile, /Student/subjects, /Student/game-zone, /Student/attendance and /Student/complain. |

The frontend dashboards are not substitutes for backend authorization. Hiding a route or menu item does not prevent a forged HTTP request.

---

## 7. Games Zone — detailed existing behavior

Games Zone manages external interactive content. It is not an assessment engine. The parent app cannot reliably inspect answers, scores or time spent inside a third-party cross-origin Wordwall frame.

### 7.1 GameActivity schema

**backend/models/gameActivitySchema.js** stores one game per document, not an unbounded array inside Class or Subject.

Main fields:
- title, description, topic;
- provider constrained to wordwall;
- embedUrl and optional originalUrl;
- school, class, subject and createdByTeacher ObjectId references;
- status draft, published or archived;
- publishedAt, unpublishedAt, archivedAt, archiveReason;
- optional immutable legacySource provenance;
- createdAt and updatedAt from Mongoose timestamps.

Indexes support:
- Student catalogue queries by school/class/subject/status sorted newest first;
- Teacher list queries by creator and school/class/subject/status;
- unique per-school legacySource.sourceKey using a partial index, so ordinary Teacher-created rows are not forced to have legacy provenance.

### 7.2 Safe URL input and iframe rendering

Files:
- backend/utils/wordwallUrl.js
- frontend/src/utils/wordwallUrl.js
- frontend/src/components/WordwallEmbed.js

The Teacher form accepts a direct embed URL or one standalone iframe snippet copied from the official Wordwall Embed interface.

Backend normalizer:
1. trims input;
2. if markup is supplied, requires a single standalone iframe shape;
3. extracts exactly one quoted src attribute;
4. discards all other attributes and all supplied markup;
5. decodes HTML ampersands;
6. validates the extracted URL with the exact allowlist.

The validator requires HTTPS, exact hostname wordwall.net or www.wordwall.net, standard HTTPS port, path matching /embed/<activity-id>, no username/password and no URL fragment. Legitimate query parameters are retained. It rejects lookalike domains, JavaScript/data URLs, custom ports, malformed paths and ambiguous iframe snippets.

The GameActivity schema validates stored embedUrl too. The frontend WordwallEmbed component validates once more, then constructs a fixed React iframe with title, lazy loading, strict-origin-when-cross-origin referrer policy and fullscreen permission. It provides an external Open on Wordwall fallback link using the validated URL. User-supplied HTML is never placed into the DOM.

The iframe currently has no sandbox attribute. This was deferred because Wordwall compatibility needs a real-browser test before restrictive sandbox settings can be chosen. Do not add/remove iframe security attributes without documenting compatibility and risk.

originalUrl and embedUrl are deliberately separate. A Wordwall /play share URL is not automatically the correct /embed URL. The normal Teacher API length/type checks originalUrl but applies the strict embed allowlist to embedUrl; the ChemAmaze importer separately validates originalUrl as an HTTPS Wordwall /play/<id>/<id>/<id> URL.

### 7.3 Teacher My Games workflow

**Frontend:** /Teacher/my-games, rendered by TeacherGameZone.js.  
**Backend:** game-activity-controller.js.  
**Routes:** create/list/update/publish/unpublish/archive GameActivity endpoints.

~~~mermaid
flowchart TD
  A["Teacher signs in"] --> B["Load persisted school/class/subject assignment"]
  B --> C["Open My Games"]
  C --> D["List Teacher activities"]
  D --> E{"Assignment valid?"}
  E -- no --> F["Show assignment error"]
  E -- yes --> G["Show own activities in current scope"]
  G --> H{"Select action"}
  H -- Add --> I["Validate form + Wordwall URL"]
  I --> J["POST create"]
  J --> K["Backend revalidates and stores draft"]
  H -- Preview --> L["Render validated WordwallEmbed"]
  H -- Edit --> M["Update owned draft only"]
  H -- Publish --> N["Draft to published"]
  H -- Unpublish --> O["Published to draft"]
  H -- Archive --> P["Published to archived"]
  J --> Q["Reload catalogue"]
  M --> Q
  N --> Q
  O --> Q
  P --> Q
~~~

Teacher screen responsibilities:
- reads current Teacher/school/class/subject from the restored safe profile;
- loads the Teacher's activity list;
- displays assignment status and current catalogue;
- collects title, description, topic, embed input and optional original share URL;
- provides client-side validation for feedback; server validates again;
- previews through the shared WordwallEmbed;
- supports draft creation/edit and explicit publication lifecycle actions;
- reloads after mutations and renders loading/error/success states.

Backend invariants:
- only a Teacher can create;
- Teacher ID comes from verified session, and optional supplied teacherId must match;
- school/class/subject are loaded from the persisted Teacher record;
- shared relationship validator checks school, Class, Subject and assigned Teacher coherence;
- new records always start as draft;
- mutable fields are restricted to title, description, topic, embedUrl and originalUrl;
- only the Teacher's own current-scope draft can be edited;
- publish is a conditional draft-to-published update;
- unpublish is a conditional published-to-draft update;
- archive is a conditional published-to-archived update;
- invalid transitions return conflict responses rather than silently succeeding.

### 7.4 Admin Learning & Games catalogue

**Frontend route:** /Admin/learning-games.  
**Page:** AdminLearningGames.js.  
**Controller:** admin-game-activity-controller.js.

The Admin interface requests the signed-in Admin's catalogue; it does not accept a client-controlled school ID. It provides title/description/topic search, filters for Class/Subject/Teacher/status/provider, pagination, summary counts and filter options. It displays source/creator/context metadata and provides unpublish/archive actions for published records.

Backend list protections:
- Admin identity and school scope are derived from persisted actor context;
- Admin's schoolId must equal the Admin account ID;
- class/subject/Teacher filter values are loaded and checked against the same school;
- unknown query fields are rejected;
- page and limit are bounded;
- search is escaped before building the regular expression;
- response includes activities, pagination, summary and school-scoped filters.

Admin unpublish/archive operations require an activity in the Admin's school that is currently published. They do not provide a draft-publish endpoint, edit or delete endpoint.

### 7.5 Student Games Zone

**Frontend route:** /Student/game-zone.  
**Page:** StudentGameZone.js.  
**Backend list:** GET /GameActivityList/:id.

~~~mermaid
flowchart TD
  A["Student opens Game Zone"] --> B["Read school and Class from safe profile"]
  B --> C["GET GameActivityList"]
  C --> D["Backend reloads Student from database"]
  D --> E["Check requested school and class against Student"]
  E --> F["Query published records only"]
  F --> G["Populate Class, Subject and Teacher display fields"]
  G --> H["Client rechecks published status and embed URL"]
  H --> I["Build subject filters and local search"]
  I --> J{"Any visible results?"}
  J -- yes --> K["Render game cards"]
  J -- no --> L["Contextual empty state / clear filters"]
  K --> M["Student selects Play game"]
  M --> N["Details dialog + WordwallEmbed"]
  N --> O["External Wordwall frame or fallback link"]
  K --> P["Refresh"]
  P --> C
~~~

Student UI features:
- checks the Student profile has school and class identifiers before requesting;
- receives only the current class's published activities from the backend;
- defensively filters unexpected drafts/archived items and invalid embed URLs;
- derives unique Subject filter options from returned activities;
- searches title, description, topic, subject and class;
- calculates available games and subjects covered;
- displays the Student's Class;
- opens a details dialog and shared embed component;
- refreshes the list; if the currently selected activity disappeared from the latest result, clears the selection;
- displays loading, error, empty and no-results states, including Clear filters.

Local filters are convenience, not access control. Backend scope is authoritative.

### 7.6 GameActivity state machine

~~~mermaid
stateDiagram-v2
  [*] --> Draft: Teacher create / legacy import
  Draft --> Published: Teacher publish
  Published --> Draft: Teacher unpublish / Admin unpublish
  Published --> Archived: Teacher archive / Admin archive
  Draft --> Archived: Related resource lifecycle cleanup where applicable
  Archived --> [*]: Retained historical row
~~~

The manual Teacher/Admin transitions are conditional on expected prior state. Archived rows are not restored through these endpoints.

### 7.7 Deletion and reassignment lifecycle

**backend/services/learning/gameActivityIntegrity.js** validates references and centralizes archive operations. Class, Subject and Teacher controllers call this service before resource deletion/reassignment:
- deleting a Class archives activities for that Class;
- deleting all school Classes archives school-level activities;
- deleting a Subject archives activities for that Subject;
- deleting Teachers archives activities created by those Teachers;
- reassigning a Teacher archives records whose old school/class/subject no longer matches the new assignment.

Archive records get status, archive timestamp and one of the constrained archive reasons. Already archived records are not rewritten, preserving the original reason/time.

These are multi-document sequences, not a MongoDB transaction. If archiving succeeds and a later delete/update fails, the activity may remain archived while some school records remain. The service operation is idempotent and retryable; future work should decide transaction/repair strategy when MongoDB deployment topology is known. Future mutations must not bypass the lifecycle service.

---

## 8. ChemAmaze catalogue and development-only import

Phase 15 imports catalogue metadata and validated links. It does not copy the content of the external Wordwall activities.

### 8.1 Pinned source coverage

Canonical source of record:
- repository: dikshaforsure/ChemAmaze-cbse;
- branch: main;
- commit: 513f7c254597d291446d31b45864c3856c518354;
- file: script.js;
- blob: 1e32228d9bd7ec583bb2e2b81f2688e7aab1b0e9.

The canonical catalogue has exactly 18 primary Wordwall records: Science and Mathematics, Classes 6–8, three Chapters per subject/class group. Each record preserves original share URL and exact embed URL separately.

The related StemGames/ChemAmaze-cbseGames derivative was compared; its 18 primary rows match the canonical 18. Six derivative-only supplemental entries are preserved separately and excluded from the Wordwall-only importer: one Google Drive crossword, two Wayground activities and three unresolved Mathematics placeholder strings.

### 8.2 Manifest, review file and school mapping

| File | Responsibility |
|---|---|
| backend/seeds/chemamaze-cbse-games.json | 18 canonical entries, title/chapter/topic, subject/grade, original share URL, embed URL and pinned source provenance. |
| backend/seeds/chemamaze-supplemental-review.json | Six derivative-only extras with reason they are not in this importer. |
| backend/seeds/chemamaze-targets.example.json | Placeholder mapping for one development school and six Grade/Subject pairs. |
| backend/seeds/chemamaze-targets.local.json | Local ignored file to create and populate with real development ObjectIds; never commit it. |
| backend/services/learning/legacyGameCatalog.js | Static manifest validator. |
| backend/services/learning/legacyGameImporter.js | Target lookup, scope validation, dry-run plan, conflict/idempotency and insert service. |
| backend/scripts/import-chemamaze-games.js | CLI modes and environment/database/confirmation guards. |

For the alternate manual import path, the target mapping needs an existing Admin school, Class 6/7/8, Science and Mathematics Subjects, and a Teacher for each of these six assignments. The recommended one-command demo path (`npm run seed`) creates this fictional school structure and resolves the ObjectIds automatically:
- 6|Science
- 6|Mathematics
- 7|Science
- 7|Mathematics
- 8|Science
- 8|Mathematics

The Class and Subject records must belong to the same school, Subject must belong to the Class, Teacher must match the school/class/subject, and Science/Mathematics mapping at each grade must point to the same Class record. The importer does not create these school records.

### 8.3 Import pipeline

~~~mermaid
flowchart TD
  A["npm run seed:chemamaze:validate"] --> B["Read static JSON manifest"]
  B --> C["Check schema version, 18 rows and pinned source"]
  C --> D["Check deterministic keys and grade/subject/chapter mapping"]
  D --> E["Check URL format and uniqueness"]
  E --> F{"validate-only?"}
  F -- yes --> G["Print catalog-valid; no DB connection"]
  F -- no --> H["Require NODE_ENV=development"]
  H --> I["Require DB name school_management_dev"]
  I --> J["Require loopback host or explicit isolated remote-dev opt-in"]
  J --> K["Read local target mapping"]
  K --> L["Connect and recheck actual connected DB name"]
  L --> M["Resolve Admin, Class, Subject and Teacher documents"]
  M --> N["Validate all six assignment relationships"]
  N --> O["Compare existing per-school source keys"]
  O --> P["Create insert / unchanged / conflict plan"]
  P --> Q{"Any conflicts?"}
  Q -- yes --> R["Stop without inserts"]
  Q -- no --> S{"dry-run?"}
  S -- yes --> T["Print plan; no writes/index creation"]
  S -- no --> U["Require exact confirmation token"]
  U --> V["Explicitly create GameActivity indexes"]
  V --> W["Insert missing records sequentially as drafts"]
  W --> X["Report inserted / unchanged / failures"]
~~~

### 8.4 Safety gates

- Exactly one CLI mode must be selected: validate-only, dry-run or apply.
- Validate-only does not connect to MongoDB.
- Dry-run requires NODE_ENV=development and exact DB name school_management_dev; it does not write documents or create indexes.
- By default only loopback MongoDB hosts are allowed. A remote dev cluster requires CHEMAMAZE_ALLOW_REMOTE_DEV_IMPORT=true, and must be independently confirmed as isolated development infrastructure.
- Apply additionally requires CHEMAMAZE_SEED_CONFIRM=IMPORT_CHEMAMAZE_TO_SCHOOL_MANAGEMENT_DEV.
- Connected Mongoose database name is checked after connection.
- Mongoose autoIndex is disabled in this CLI; apply explicitly builds GameActivity indexes before first insert.
- Imported records always start as draft.
- Identical existing source rows are skipped; content/scope drift is reported as conflict and blocks additional inserts.
- The importer never overwrites existing Teacher/Admin content or publication state.
- Sequential inserts report per-record failures and can be resumed.
- No transaction is assumed because the database deployment topology has not been established as a replica set.

### 8.5 Windows PowerShell operator sequence

Run from backend:

~~~powershell
Copy-Item .\seeds\chemamaze-targets.example.json .\seeds\chemamaze-targets.local.json
notepad .\seeds\chemamaze-targets.local.json

$env:NODE_ENV = "development"
$env:MONGO_URL = "mongodb://127.0.0.1:27017/school_management_dev"

npm run seed:chemamaze:validate
npm run seed:chemamaze:dry-run
~~~

For an Atlas/remote cluster, first independently verify that it is a dedicated isolated development target and that the URI uses the exact development database name; only then set CHEMAMAZE_ALLOW_REMOTE_DEV_IMPORT=true. Never use a production cluster or real school database.

After reviewing a clean dry-run:

~~~powershell
$env:CHEMAMAZE_SEED_CONFIRM = "IMPORT_CHEMAMAZE_TO_SCHOOL_MANAGEMENT_DEV"
npm run seed:chemamaze:apply
~~~

Expected first clean import is 18 inserted, zero unchanged and zero failures. A clean repeat is zero inserted and 18 unchanged. Those are expected outcomes, not evidence that a user's database has been imported.

---

## 9. AI Learning Studio — existing backend foundation

The repository already has first-party MCQ quiz and attempt persistence code. It is separate from Wordwall: the app owns the question/options/answer key and grades the Student submission on the server.

### 9.1 Current quiz schema

**backend/models/learningQuizSchema.js** contains:
- title, description and topic;
- school, class, subject and createdByTeacher references;
- embedded question array;
- numeric quiz version;
- draft/published/archived status and publishedAt;
- Mongoose timestamps.

Each question stores prompt, free-text concept, two-to-six options with optionId/text, correctOptionId and optional explanation. A Quiz holds one to thirty questions.

Important limitation: concept is still a free-text field. The Phase 16 taxonomy IDs are not enforced by this schema or controller. Questions are embedded in the quiz document; this is not yet a standalone versioned Question/QuestionVersion collection.

### 9.2 Current API

| Method / route | Role | Existing behavior |
|---|---|---|
| POST /LearningQuizCreate | Teacher | Validates MCQ shape and current Teacher assignment; creates version 1 draft. |
| GET /LearningQuizList/:id | Teacher or Student | Teacher reads own assignment scope/status; Student sees published quizzes for own school/class and optional subject. |
| PUT /LearningQuizPublish/:id | Teacher | Publishes owned draft in current assignment scope. |
| POST /LearningQuizSubmit/:id | Student | Validates submission/scope, grades from server-held answer key and persists attempt. |

The routes use the same session, persisted role, actor context and scope middleware as other protected feature APIs.

### 9.3 Server grading flow

~~~mermaid
sequenceDiagram
  participant Student as Student browser
  participant API as Quiz controller
  participant DB as MongoDB
  Student->>API: Submit quiz ID, idempotency key, question/option IDs
  API->>API: Verify Student role and payload shape
  API->>DB: Load quiz and authenticated Student
  API->>API: Validate school/class/subject and published state
  API->>DB: Check existing student + quiz + idempotency key
  alt Duplicate request
    DB-->>API: Existing LearningAttempt
    API-->>Student: 200 replayed=true
  else New attempt
    API->>API: Validate each question and option belongs to quiz
    API->>API: Compare selected option to stored correctOptionId
    API->>API: Compute score and accuracy
    API->>DB: Save versioned LearningAttempt
    DB-->>API: Saved attempt
    API-->>Student: 201 attempt + post-submit feedback
  end
~~~

Controller details:
1. Student ID is derived from authenticated req.auth; a supplied studentId must match.
2. The request must include an idempotency key with bounded length.
3. Answers must be an array of bounded size; duplicate question IDs are rejected.
4. Quiz, Student, Class and Subject must share the correct school/class scope.
5. An existing attempt with the same Student + Quiz + idempotency key is returned as replayed.
6. A new submission requires a published Quiz.
7. Every question ID and selected option ID must belong to that Quiz/question.
8. Every question in the quiz gets a response; omitted answers become unanswered/incorrect.
9. Correctness is calculated on the server using question.correctOptionId.
10. Score, total, percentage, quizVersion, attemptNumber, submittedAt and optional bounded duration are stored.
11. Post-submit feedback returns correctness, correct option and explanation.

The Student projection used by the quiz list excludes correctOptionId and explanation. The answer key is only sent in the post-submit feedback after grading.

### 9.4 Attempt record

**backend/models/learningAttemptSchema.js** stores Student, school, class, subject, quiz, quizVersion, idempotencyKey, attemptNumber, responses, score, totalQuestions, accuracyPercent, durationMs and submittedAt. Each response includes questionId, free-text concept, selectedOptionId, server-derived isCorrect and answeredAt.

Indexes:
- unique student + quiz + idempotencyKey for retry protection;
- school + class + subject + submittedAt for scoped time-oriented query support.

This is an event-like foundation, not a complete analytics platform. There is no mastery model, BKT updater, recommendation history, attempt-history UI/API or data-quality reporting pipeline in this revision.

**Concurrency limitation:** attemptNumber currently uses countDocuments + 1. Two concurrent submissions using different idempotency keys for the same Student/Quiz could calculate the same attempt number. The idempotency index protects retries with the same key, not all distinct concurrent requests. Consider atomic sequence design or a uniqueness constraint if exact attempt order/count is needed at production scale.

### 9.5 What is not built yet

- no Student quiz-taking page/route in StudentDashboard;
- no Teacher quiz authoring page/route in TeacherDashboard;
- no full Question Bank or version-history workflow;
- no stable conceptId/taxonomy version field;
- no attempt-history UI/API;
- no concept mastery collection or BKT;
- no adaptive recommendation service;
- no misconception diagnostic;
- no approved-source ingestion or retrieval index;
- no grounded assistant;
- no AI question generation or Teacher review workflow;
- no Python service or LLM SDK in backend package dependencies.

The accurate current description is: **backend foundations for Teacher-created, server-graded MCQ quizzes and persisted Student attempts, awaiting the full Teacher/Student UI and later learning-intelligence phases.**

---

## 10. Phase 16 curriculum concept map

The initial taxonomy covers one carefully selected chapter, not the entire curriculum.

**Taxonomy:** NCERT-CURIOSITY-G7-SCI-CH02-ABN  
**Version:** 1.0.0  
**Slice:** Class 7 Science, Curiosity, Chapter 2 — Exploring Substances: Acidic, Basic, and Neutral  
**Lifecycle:** draft_for_teacher_review

### 10.1 Seven application-owned concept IDs

| Concept ID | Short concept | Boundary |
|---|---|---|
| SCI7-MAT-ABN-001 | Acidic, basic and neutral categories | Classify approved samples using observable evidence. |
| SCI7-MAT-ABN-002 | Indicators as evidence | Interpret observations from an indicator. |
| SCI7-MAT-ABN-003 | Litmus observations | Red/blue litmus observations. |
| SCI7-MAT-ABN-004 | Colour-based natural indicators | Teacher-prepared colour indicator investigations. |
| SCI7-MAT-ABN-005 | Olfactory indicator observations | Teacher-supervised odour-indicator demonstration. |
| SCI7-MAT-ABN-006 | Neutralisation investigation | Controlled, supervised acid/base demonstration. |
| SCI7-MAT-ABN-007 | Acid–base ideas in everyday contexts | Only educator-checked examples. |

### 10.2 Prerequisite graph

~~~mermaid
flowchart TD
  C1["001: Acidic / basic / neutral categories"]
  C2["002: Indicators as evidence"]
  C3["003: Litmus observations"]
  C4["004: Natural colour indicators"]
  C5["005: Olfactory indicators"]
  C6["006: Neutralisation investigation"]
  C7["007: Everyday contexts"]
  C1 --> C2
  C2 --> C3
  C2 --> C4
  C2 --> C5
  C1 --> C6
  C2 --> C6
  C6 --> C7
~~~

The graph is acyclic. Each concept is scoped to Grade 7 Science and Chapter 2 with source/activity provenance metadata. IDs are owned by this application; they are not official NCERT identifiers.

### 10.3 Source rights and curriculum alignment

The GNCT of Delhi Directorate of Education 2026–27 Class 7 Science annual syllabus was reviewed as a **local alignment source**. It identifies Curiosity and this chapter on printed page 5. It is not presented as a universal CBSE/state curriculum mapping for every school.

The NCERT portal's copyright restrictions were reviewed. The branch does not bundle or copy textbook PDFs, page images, figures, tables, activity text, exercise questions, answer keys, passages or derivative explanations. The textbook reference is retained as provenance metadata only; direct in-app textbook linking is blocked pending written permission. The GNCT syllabus PDF is also metadata/citation-only because an explicit content reuse licence was not established. This is a conservative content-use engineering decision, not a legal opinion.

### 10.4 Safety and approval gate

- Do not ask learners to taste, directly touch or independently mix unknown substances.
- Use teacher-approved prepared samples for indicator observations.
- Odour indicator work must be teacher-supervised.
- Neutralisation must be a controlled demonstration.
- Everyday-life examples need educator review.
- Do not treat Wordwall launch/play behavior as correctness or mastery evidence.
- Do not add unsupported pH calculations, strong/weak comparisons, unverified household classifications or invented distractors.

Educator academic approval is pending. A Science educator must review concept boundaries, local curriculum alignment and safety language before Phase 17 uses this taxonomy for student-facing content.

---

## 11. Phase 16–30 detailed implementation blueprint

This section is a forward-looking technical design for the remaining Learning Studio work. It explains expected data contracts, service responsibilities, UI/API journeys, validation rules, failure behavior, testing strategy and completion evidence for each phase. It is a blueprint, not a claim that these future components already exist.

### 11.1 Dependency map and implementation order

The phases are sequential because later work consumes trustworthy outputs from earlier phases. Question content must not reference an unapproved taxonomy. Mastery cannot be calculated until attempts carry stable question/concept versions. Recommendations need mastery and a reviewed question pool. A grounded assistant and generated questions need source permission and retrieval quality evidence.

~~~mermaid
flowchart TD
  P16["Phase 16 - approved concepts and source boundaries"]
  P17["Phase 17 - versioned question bank"]
  P18["Phase 18 - Teacher and Student quiz workflow"]
  P19["Phase 19 - trustworthy attempt events"]
  P20["Phase 20 - data quality and evaluation baselines"]
  P21["Phase 21 - pure BKT implementation"]
  P22["Phase 22 - mastery persistence and integration"]
  P23["Phase 23 - explainable recommendations"]
  P24["Phase 24 - misconception diagnostics"]
  P25["Phase 25 - approved source ingestion and retrieval"]
  P26["Phase 26 - grounded learning assistant"]
  P27["Phase 27 - generated question candidates"]
  P28["Phase 28 - Teacher review and publication"]
  P29["Phase 29 - insights and pilot readiness"]
  P30["Phase 30 - deployment and portfolio evidence"]
  P16 --> P17 --> P18 --> P19 --> P20 --> P21 --> P22 --> P23
  P20 --> P24
  P16 --> P25
  P25 --> P26
  P25 --> P27 --> P28
  P17 --> P28
  P23 --> P29
  P24 --> P29
  P26 --> P29
  P28 --> P29
  P29 --> P30
~~~

**Sequencing rule:** Phase 21 may implement and test BKT offline after Phase 20 establishes a valid event/evaluation protocol, but production mastery APIs wait for Phase 22. Phase 25 may proceed as a rights-controlled source pipeline after Phase 16, but the Student assistant and generated content remain disabled until retrieval has its own quality gate. Phase 28 is the publication gate for generated questions; Phase 27 must never auto-publish.

### 11.2 Phase 16 — curriculum concept map, scope and educator approval

**Current implementation:** committed; educator approval pending.

The catalogue is a versioned JSON manifest for one initial slice: Class 7 Science, Curiosity, Chapter 2, Exploring Substances: Acidic, Basic, and Neutral. It contains seven application-owned concept IDs, original concise learning-intent descriptions, prerequisites, grade/subject/chapter scope, source references, syllabus activity identifiers and explicit feature gates. Its lifecycle is draft_for_teacher_review and its approval status is pending. It does not contain copied textbook material, generated questions, answer keys or student-facing AI output. The existing quiz schema still stores a free-text concept field; the taxonomy is not yet enforced by runtime quiz code.

**Work and reasoning**
1. Select one manageable chapter using an identified local curriculum anchor; do not assume one state or board sequence applies to every school.
2. Define each concept as one assessable learning intent. Give it a stable ID that remains unchanged if a display title is edited.
3. Define prerequisite edges and verify that all references exist and the graph is acyclic.
4. Attach grade, subject, chapter, curriculum version, source ID and relevant syllabus activity/outcome reference metadata.
5. Record content rights separately from academic validity. Publicly readable source material is not automatically licensed for copying, repackaging or AI ingestion.
6. Review learner age suitability, practical safety and explicit out-of-scope topics.
7. Keep student-facing questions and AI capabilities disabled until an educator has approved the exact taxonomy version.

**Educator review record**
The reviewer should confirm concept boundaries, the target school's curriculum mapping, prerequisite order, activity references, safety wording and learner level. The record should identify the taxonomy version, reviewer role/identity, date, decision and comments. Any change that affects concept meaning requires a new version and review. Historical question attempts must keep the version they used.

**Existing files:** backend/seeds/curriculum-concept-catalog.json, AI_LEARNING_CURRICULUM_SCOPE.md and backend/tests/curriculumConceptCatalog.test.js. A formal review collection is not required merely to simulate approval; a documented educator sign-off may be sufficient for this first small slice.

~~~mermaid
flowchart TD
  A["Choose target grade subject and chapter"]
  B["Identify local curriculum alignment source"]
  C["Record source owner version and use restrictions"]
  D["Write original concept descriptors and stable IDs"]
  E["Define prerequisites and concept links"]
  F["Validate unique IDs and acyclic graph"]
  G["Review safety and learner suitability"]
  H["Educator reviews exact taxonomy version"]
  I{"Approved?"}
  J["Record reviewer decision and version"]
  K["Revise manifest and return to review"]
  L["Allow Phase 17 question authoring"]
  M["Keep Student content and AI disabled"]
  A --> B --> C --> D --> E --> F --> G --> H --> I
  I -->|yes| J --> L
  I -->|changes requested| K --> D
  I -->|not approved| M
~~~

**Tests and evidence**
- every concept ID is unique and matches the approved ID format;
- every prerequisite references a known concept and the graph has no cycle;
- source/activity references resolve;
- restricted source content is not copied;
- no unsupported concepts, invented distractors or syllabus claims are added;
- runtime feature gates remain disabled before approval;
- educator sign-off names the exact taxonomy version.

**Exit gate:** educator approval is recorded for the target school/version, source-use restrictions are explicit and concept IDs/prerequisites are stable. At the reviewed revision this gate is not satisfied, so Phase 17 must not create student-facing questions yet.

### 11.3 Phase 17 — first-party question bank and quiz schema

**Status:** planned; depends on Phase 16 approval.

**Purpose:** create reviewed first-party question content mapped to an approved taxonomy. The existing Learning Quiz model is a starting point, but it embeds questions in a quiz, stores concept as free text and does not implement a full immutable question-version/review lifecycle.

**Recommended content model**
- A logical Question has a stable question ID, ownership/scope policy, subject/grade, lifecycle pointer and timestamps.
- A QuestionVersion is the exact immutable content served to a learner: question ID, version, taxonomy ID/version, conceptId, prompt, type, difficulty, options, correctOptionId, explanation, author, provenance, reviewer and lifecycle status.
- Each option has a unique option ID within the version, display text and optionally an educator-reviewed misconception mapping.
- Review metadata includes reviewer, decision time, comments, source evidence and the reviewed content version.
- Provenance distinguishes independently authored content from content derived from an explicitly permitted source.

Start with MCQs because the current learningQuizSchema.js already supports that format. Difficulty labels must have educator-reviewed definitions; they should not be presented as psychometrically calibrated values without validation. Do not add arbitrary HTML, uploads or automatic free-text grading merely for future flexibility.

**Versioning and migration**
Choose deliberately between quizzes referencing immutable QuestionVersion IDs and quizzes storing immutable snapshots of selected question versions. Either strategy must ensure that editing a question cannot change what a previous Student saw. Historical quizzes and LearningAttempt records must remain readable. If an old free-text concept cannot be mapped confidently, mark it unmapped; never guess a concept ID.

**Authoring and validation sequence**
1. Load only an approved taxonomy version.
2. Teacher selects a concept and writes an original prompt.
3. Teacher supplies answer options and intended correct option.
4. Server validates prompt/option lengths, option count, unique option IDs, correct-option membership, explanation length and concept/version existence.
5. Save the item as draft or pending review.
6. Authorized educator reviews correctness, age level, distractor quality and provenance.
7. Approval creates an immutable version; later edits create a new draft version.
8. Student reads return only eligible published versions, with answer key and pre-submit explanation omitted.

**Candidate code boundaries** (proposals, not existing files): a learning question/version model, question validation service, question-bank service, learning-question controller, focused schema/controller tests and an original reviewed seed manifest. Final paths must follow the current CommonJS/Mongoose conventions when this phase is implemented.

**Security invariants**
- Student projections never include correctOptionId or pre-submit explanation.
- conceptId resolves against the exact taxonomy version.
- Teacher authoring is restricted to the persisted Teacher school/class/subject.
- Reviewer is resolved from the authenticated actor and must be authorized for that content.
- Published versions are immutable; edits create a new version.
- Every item has provenance and lifecycle status.
- AI-generated/unreviewed items are not served.

~~~mermaid
flowchart TD
  A["Load approved taxonomy version"]
  B["Teacher selects concept and writes original MCQ"]
  C["Server validates prompt options and answer"]
  D["Resolve conceptId in taxonomy version"]
  E{"All fields and references valid?"}
  F["Save draft question version"]
  G["Return safe validation errors"]
  H["Reviewer checks content and provenance"]
  I{"Review decision"}
  J["Publish immutable version"]
  K["Create revised draft from review notes"]
  L["Record rejection and reason"]
  M["Student fetch omits answer key"]
  A --> B --> C --> D --> E
  E -->|yes| F --> H
  E -->|no| G
  H --> I
  I -->|approve| J --> M
  I -->|changes requested| K --> B
  I -->|reject| L
~~~

**Tests:** valid/invalid MCQ; missing/unknown concept; taxonomy mismatch; duplicate IDs; answer not in options; Student projection has no key; unauthorized Teacher/reviewer; published version immutability; new version preserves historical content; seed provenance.

**Exit gate:** a small original reviewed question set exists, every question maps to a stable concept/version, versions are immutable and Student fetch cannot leak answer keys.

### 11.4 Phase 18 — native first-party quiz UI and API integration

**Status:** planned; reuses the current quiz backend foundation and Phase 17 question bank.

**Teacher journey**
1. Teacher opens Learning Studio from the Teacher dashboard.
2. UI loads current persisted school/class/subject context; no arbitrary tenant selector is trusted.
3. Teacher chooses an approved topic/concept and reviewed question versions.
4. Teacher composes a quiz draft, gives it a title/instructions and checks the question order/count.
5. Backend validates each referenced question version and current Teacher assignment.
6. Teacher previews the exact Student-safe quiz representation.
7. Teacher publishes through a conditional backend state transition.
8. Published quiz content is fixed to the selected question versions.

**Student journey**
1. Student opens Learning Studio from StudentDashboard.
2. Frontend fetches quizzes eligible for the authenticated Student's school/class/subject.
3. Backend returns only published quizzes and a Student-safe question projection.
4. Student starts a fixed quiz version; the UI tracks selected option IDs and unanswered questions locally.
5. On submit, the frontend generates one idempotency key for that logical submission and disables repeated submit while pending.
6. Backend derives Student identity from the session, checks question/option membership and grades using the stored answer key.
7. Backend persists LearningAttempt and returns score/feedback after grading.
8. UI displays result/explanation and safe retry/navigation actions.

**Existing code to reuse:** backend/controllers/learning-quiz-controller.js, backend/models/learningQuizSchema.js, backend/models/learningAttemptSchema.js, backend/tests/learningQuizController.test.js, frontend/src/App.js and frontend/src/utils/apiClient.js.

**Proposed UI boundaries:** Teacher Learning Studio/quiz-authoring screens, Student quiz list/take/result screens, reusable question renderer/progress/result components, dashboard route/sidebar additions and component tests. Final paths should be selected after re-reading current UI conventions. Use the existing app design system; do not create a second login or client-side answer-key store.

~~~mermaid
sequenceDiagram
  participant T as Teacher browser
  participant S as Student browser
  participant API as Express quiz API
  participant DB as MongoDB
  T->>API: Create draft with question version IDs
  API->>API: Verify Teacher scope and question eligibility
  API->>DB: Save draft quiz snapshot
  T->>API: Publish quiz
  API->>DB: Conditional draft to published transition
  S->>API: Fetch published quizzes for own class
  API->>DB: Query Student-safe projection
  DB-->>API: Quiz without answer keys
  API-->>S: Renderable quiz payload
  S->>API: Submit option IDs and idempotency key
  API->>API: Validate membership and grade on server
  API->>DB: Persist LearningAttempt
  DB-->>API: Stored attempt
  API-->>S: Score and post-submit feedback
~~~

**Failure/retry behavior**
- quiz fetch failure shows retry and does not fabricate an empty-success state;
- a lost submit response is retried with the same idempotency key;
- changed, deleted or unpublished content returns a stable unavailable/conflict response;
- pre-submit errors never expose the correct option;
- a successfully stored attempt remains recorded even if the browser closes before rendering the result;
- partial answers follow the documented unanswered/incorrect rule.

**Tests and exit gate:** complete Teacher-create/publish to Student-attempt path; server grading; only published in-scope quiz visibility; no answer-key leak; invalid IDs; replay; API failure; empty state; mobile and keyboard access.

### 11.5 Phase 19 — learning-attempt events and data quality

**Status:** planned; strengthens the existing LearningAttempt foundation.

**Purpose:** make learning evidence reproducible, privacy-minimized and suitable for later analytics. The current LearningAttempt stores quiz version, selected options, correctness, timestamp, idempotency key and responses, but future mastery needs stable question-version and concept IDs.

**Canonical response-event fields**
- event ID or deterministic idempotency identity;
- internal/pseudonymous learner reference tied to the authenticated Student;
- quiz ID/version and question ID/version;
- concept ID and taxonomy version;
- selected option ID or null;
- server-derived correctness;
- answer timestamp and attempt identity/number;
- optional bounded duration only where there is an approved need and an exact definition.

Do not store Student name, roll number, chat text, precise location, device fingerprint or unrelated profile fields in model features. A protected database reference can connect an event to a Student record without copying profile attributes into every event.

**Processing workflow**
1. Authenticate the Student and resolve the persisted Student record.
2. Validate quiz, question version, concept and taxonomy references.
3. Validate the full answer payload before persistence.
4. Same idempotency key and same logical payload returns the original attempt.
5. Same idempotency key with a different payload returns a conflict.
6. Persist attempt and response facts atomically where possible; if separate event documents are introduced, define transaction/outbox semantics.
7. Replace the current countDocuments + 1 attemptNumber assumption with an atomic sequence or another uniqueness strategy if exact numbering is required.
8. Define submitted, abandoned, expired, replayed and rejected states.
9. Add a replay/data-quality command that compares attempt summaries to response records and detects duplicates, missing references or inconsistent score totals.

**Storage decision:** retain LearningAttempt as the attempt aggregate and add a separate response-event collection only if querying/replay needs justify it. Otherwise use a canonical response array with a documented replay contract. Do not create two independent truth sources that can disagree.

~~~mermaid
flowchart TD
  A["Student submits quiz"]
  B["Authenticate Student and validate quiz version"]
  C["Validate question option and concept references"]
  D["Check idempotency key and payload fingerprint"]
  E{"Existing submission?"}
  F["Return original attempt as replay"]
  G["Reject conflicting reuse of key"]
  H["Persist attempt and response evidence"]
  I["Assign stable attempt identity and ordering"]
  J["Run event quality checks"]
  K{"Evidence consistent?"}
  L["Mark eligible for analytics"]
  M["Quarantine or flag for repair"]
  N["Expose only minimized analytics fields"]
  A --> B --> C --> D --> E
  E -->|same payload| F
  E -->|different payload| G
  E -->|new submission| H --> I --> J --> K
  K -->|yes| L --> N
  K -->|no| M
~~~

**Data-quality rules:** every response belongs to one attempt; every version/concept reference resolves; taxonomy version matches served question; correctness agrees with answer-key version; one idempotency key cannot create multiple logical attempts; score equals correct response count; total matches the quiz snapshot; timestamps and optional durations meet defined bounds.

**Tests and exit gate:** same-key replay; conflicting payload; concurrent attempts; deterministic replay; invalid concept/version; quality report; no unnecessary PII; learner-specific read authorization.

### 11.6 Phase 20 — baseline analytics and evaluation protocol

**Status:** planned; no model should be called useful before this phase.

**Purpose:** measure event quality and define a fair benchmark before BKT or recommendation logic. This is an analytics/evaluation phase, not a student-facing AI score feature.

**Workflow**
1. Freeze a data dictionary for quizzes, question versions, concepts and response events.
2. Define the target precisely, such as predicting the next first-party response correctness for a learner-concept pair, including the prediction cutoff.
3. Define minimum evidence thresholds: learners, attempts per concept, cohort coverage and missing-data tolerance. Report insufficient samples rather than hide them.
4. Build a synthetic event simulator for edge-case testing. Keep synthetic events in a separate namespace/dataset and never mix them into real-student outcome claims.
5. Produce descriptive statistics: response volume, first-attempt/repeat accuracy, unanswered rate, concept coverage and time distribution.
6. Define leakage-safe evaluation splits. For personalized predictions, group by learner and/or use chronological cutoffs so future attempts cannot influence earlier predictions.
7. Establish simple baselines: global or concept correctness rate with smoothing, majority baseline, fixed-order revision, random eligible item and simple low-accuracy heuristic.
8. Choose metrics before model fitting: Brier score/log loss and calibration for probabilities; other metrics only where class balance and sample size justify them.
9. Record sample counts, cohort, missingness, provenance, confidence intervals and known limitations.

**Deliverables:** repeatable scripts/notebooks and a report containing dataset version/checksum, filters, split method, features, baselines, metrics, confidence intervals and limitations. Synthetic-only results must never be described as Student performance or educational impact.

~~~mermaid
flowchart TD
  A["Validate first-party attempt events"]
  B["Create data dictionary and cohort definition"]
  C["Separate synthetic fixtures from real school data"]
  D["Choose target and prediction cutoff"]
  E["Create leakage-safe learner and time split"]
  F["Build descriptive statistics"]
  G["Evaluate simple baselines"]
  H["Report metrics sample size and uncertainty"]
  I{"Quality and sample threshold met?"}
  J["Approve offline model experiments"]
  K["Collect more evidence or repair data"]
  L["Keep production model disabled"]
  A --> B --> C --> D --> E --> F --> G --> H --> I
  I -->|yes| J
  I -->|no| K --> L
~~~

**Exit gate:** repeatable baseline report, leakage-safe split protocol, explicit real/synthetic separation and metrics defined before model fitting.

### 11.7 Phase 21 — Bayesian Knowledge Tracing implementation

**Status:** planned offline model; no production endpoint in this phase.

**Purpose:** implement an interpretable concept-level estimate from first-party correct/incorrect response sequences. It is not an exam mark, psychological diagnosis or permanent label.

**Parameters**
- P(L0): prior probability that a learner already knows the concept;
- P(T): probability of learning after an opportunity;
- P(G): probability of a correct answer while not knowing;
- P(S): probability of an incorrect answer despite knowing.

For current mastery probability L:

After a correct response:

P(L given correct) = [L * (1 - P(S))] / [L * (1 - P(S)) + (1 - L) * P(G)]

After an incorrect response:

P(L given incorrect) = [L * P(S)] / [L * P(S) + (1 - L) * (1 - P(G))]

Learning transition:

P(L next) = P(L given observation) + [1 - P(L given observation)] * P(T)

**Algorithm**
1. Validate parameters are finite and within allowed ranges.
2. Initialize state from P(L0).
3. Sort accepted events by deterministic server order and reject duplicate event IDs.
4. For each eligible observation, calculate the correct/incorrect posterior.
5. Apply the learning transition once.
6. Clamp only justified floating-point noise; reject invalid probability inputs rather than silently repairing them.
7. Return probability, observation count and model/parameter version.
8. With no observations, return the prior and clearly mark that it is not evidence-based mastery.
9. Compare next-response calibration and prediction against Phase 20 baselines.

Classic BKT simplifies learning behavior. It may not model question difficulty, guessing strategy, fatigue, prior outside exposure, dependent concepts or question quality. Parameters must be documented and calibrated only with sufficient representative data.

**Implementation boundary:** the harness calls for a pure Python module. Choose an isolated package/folder after reviewing build/deploy conventions. The formula module must not access MongoDB, make network calls or depend on HTTP.

~~~mermaid
flowchart TD
  A["Receive one concept response sequence"]
  B["Validate parameters and event identities"]
  C["Initialize mastery from prior probability"]
  D["Read next eligible response in order"]
  E{"Correct response?"}
  F["Apply correct posterior using guess and slip"]
  G["Apply incorrect posterior using guess and slip"]
  H["Apply learning transition"]
  I{"More eligible responses?"}
  J["Return probability count and model version"]
  K["Reject invalid event or parameter"]
  A --> B
  B -->|valid| C --> D --> E
  B -->|invalid| K
  E -->|yes| F --> H --> I
  E -->|no| G --> H
  I -->|yes| D
  I -->|no| J
~~~

**Tests:** hand-calculated correct/incorrect examples; no-observation prior; edge probabilities 0/1; parameter validation; repeated event IDs; deterministic ordering; output bounds; one transition per event; identical inputs yield identical output.

**Exit gate:** formula-level tests and hand calculations pass, assumptions are documented and offline evaluation is compared against baselines. No production API is exposed in Phase 21.

### 11.8 Phase 22 — mastery persistence and service integration

**Status:** planned; follows offline BKT validation.

**Purpose:** persist reproducible state without making quiz submission depend on an ML service being available.

**Mastery record**
- learner reference or minimized internal key;
- conceptId and taxonomy version;
- mastery probability;
- observation count and latest processed event identity/order;
- BKT model and parameter version;
- updated timestamp;
- optional current/stale/recompute-required status.

Use a uniqueness strategy for active learner + concept + taxonomy version state. Retain older model versions only when audit/reproduction needs justify them.

**Processing**
1. Quiz submission durably saves the first-party attempt.
2. An outbox/pending event or equivalent recoverable work item is created.
3. A worker claims pending events in deterministic order.
4. Worker loads the learner's concept state and checks if this event was already processed.
5. Apply pure BKT locally or call a private internal Python service if measured operational needs justify it.
6. Upsert mastery and processed-event checkpoint idempotently.
7. Mark event processed or schedule bounded retry on temporary failure.
8. Support deterministic replay/rebuild by event cutoff and model version.
9. Restrict Student reads to self; Teacher reads to assigned-class/subject scope and privacy-approved aggregates; Admin reads only privacy-reviewed school aggregates.

**Failure isolation:** the submit endpoint returns success once the attempt is durable. A Python timeout, worker crash or invalid model output leaves mastery pending/stale and retryable. It must not delete or duplicate the attempt. Use timeout, bounded backoff, error classification and a dead-letter/manual-repair state. Never expose an internal ML endpoint to the browser.

~~~mermaid
sequenceDiagram
  participant S as Student API
  participant DB as MongoDB
  participant W as Mastery worker
  participant ML as Private BKT module
  S->>DB: Save LearningAttempt and pending event
  DB-->>S: Durable attempt accepted
  S-->>S: Return quiz result without waiting for BKT
  W->>DB: Claim next unprocessed event
  W->>DB: Load concept state and processed-event checkpoint
  W->>ML: Apply versioned BKT update
  alt Model result valid
    ML-->>W: New probability and model version
    W->>DB: Upsert mastery and processed checkpoint
    W->>DB: Mark event processed
  else Timeout or invalid output
    ML-->>W: Error or timeout
    W->>DB: Keep event pending for bounded retry
  end
~~~

**Consistency rules:** one event updates one state once per model version; concurrent workers use safe claiming or compare-and-set; ordering is deterministic; parameter changes require explicit rebuild/side-by-side versioning; late events cannot overwrite a state advanced past them; learner deletion follows retention policy.

**Tests and exit gate:** replay is idempotent; retry works; quiz submit succeeds with BKT down; multiple workers cannot double-process; model metadata persists; cross-learner reads are denied; Teacher/Admin scopes are privacy-safe.

### 11.9 Phase 23 — explainable adaptive recommendation policy

**Status:** planned; deterministic first, not reinforcement learning.

**Purpose:** choose the next appropriate first-party practice item using reviewed content, prerequisites, attempts and mastery estimates.

**Eligibility**
- question version is published and approved;
- item is eligible for the Student's school/class/subject;
- concept and taxonomy version are approved;
- item is not retired/blocked;
- Wordwall launches are not treated as assessment evidence.

**Policy**
1. Resolve Student academic scope.
2. Load eligible published question versions and prerequisite graph.
3. Load mastery and recent first-party attempts.
4. Suppress recently repeated items when policy requires.
5. Prioritize a weak prerequisite if a dependent concept is not ready.
6. Score candidates with a versioned deterministic policy.
7. Select a bounded question/revision set with deterministic tie-breaking.
8. Persist RecommendationEvent with candidates/selected IDs, policy version and explanation.
9. If evidence/candidates are insufficient, use a published fixed-order or teacher-assigned fallback and explain why.

Signals may include mastery probability, prerequisite readiness, last practice time, exposure, recent correctness, educator-approved difficulty and revision priority. Do not use attendance, demographics or exam marks as a proxy for concept evidence.

~~~mermaid
flowchart TD
  A["Student requests next practice"]
  B["Resolve Student school class and subject"]
  C["Load approved concepts and prerequisites"]
  D["Load published eligible question versions"]
  E["Load mastery and recent first-party attempts"]
  F["Filter retired unrelated or recently repeated items"]
  G["Check prerequisite readiness and revision priority"]
  H["Score candidates with deterministic policy"]
  I{"Sufficient evidence and candidates?"}
  J["Choose highest-ranked eligible item set"]
  K["Use published fixed-order fallback"]
  L["Persist policy version and explanation"]
  M["Return Student-safe question references"]
  A --> B --> C --> D --> E --> F --> G --> H --> I
  I -->|yes| J --> L --> M
  I -->|no| K --> L
~~~

**Evaluation/tests:** deterministic repeatability; no unpublished/wrong-school/wrong-subject items; prerequisite ordering; empty candidate fallback; tie-break stability; repeat suppression; stored human-readable rationale; comparison to fixed-order, random eligible and low-mastery heuristic baselines.

**Exit gate:** policy behavior is explainable, safe and deterministic, and performance is compared against baselines before calling it better.

### 11.10 Phase 24 — misconception diagnostics

**Status:** planned; educator-reviewed rules first.

**Purpose:** detect tentative patterns in selected distractors. One wrong answer alone is not a diagnosis.

**Workflow**
1. Educators define a small misconception taxonomy for the first topic.
2. Each distractor is reviewed and mapped only when it reflects a plausible misunderstanding.
3. Mapping attaches to exact questionVersion and optionId, not question text alone.
4. Collect first-party response evidence only.
5. Apply transparent rules with minimum evidence and recency/decay thresholds.
6. Produce a tentative hypothesis with sample count and supporting pattern.
7. Prefer Teacher-facing aggregate signals; Student-facing hints must be supportive and non-labeling.
8. Evaluate precision, recall and F1 on a held-out reviewed set.
9. Consider a classifier only if permitted, representative, reliable Teacher-labelled examples exist and it beats a suitable baseline.

**Data boundary:** version a mapping with conceptId, questionVersionId, optionId, hypothesisId, educator rationale and approval. If wording changes, do not silently carry the mapping forward. Any classifier stays offline until label quality/error patterns are reviewed.

~~~mermaid
flowchart TD
  A["Educator defines misconception hypotheses"]
  B["Review distractor mapping for exact question versions"]
  C["Collect first-party response evidence"]
  D["Apply transparent rule and evidence threshold"]
  E{"Enough supporting observations?"}
  F["Create tentative hypothesis and supporting pattern"]
  G["Return insufficient evidence without a label"]
  H["Teacher reviews aggregate pattern and examples"]
  I{"Enough reliable labels for classifier study?"}
  J["Evaluate classifier against rule and majority baselines"]
  K["Keep reviewed rules and document no-go"]
  L["Expose cautious Teacher-facing insight"]
  A --> B --> C --> D --> E
  E -->|yes| F --> H --> I
  E -->|no| G
  I -->|yes| J --> L
  I -->|no| K --> L
~~~

**Safety:** never label a learner weak/careless/incapable or diagnosed; distinguish one error from repeated pattern; suppress low-count patterns; allow educator correction; show uncertainty/provenance; no grading or consequential decision from this signal.

**Exit gate:** rules have reviewed mappings and measured precision/recall/F1 and class-wise errors. If labels are insufficient, explicitly keep rules and record a no-go decision for ML.

### 11.11 Phase 25 — approved curriculum ingestion and retrieval evaluation

**Status:** planned; permission is a hard prerequisite.

**Purpose:** build a traceable corpus of material the product is allowed to process. This is a source-rights pipeline before it is an AI feature.

**Source registry**
Record owner/publisher, title, edition/version/date, URL or controlled file reference, curriculum alignment, licence/permission evidence, permitted operations (display, indexing, embedding, model input, quotation), restrictions, reviewer and approval status. Unclear rights means reject or hold for manual review.

NCERT textbook material remains excluded unless written permission is obtained and recorded. The GNCT Delhi syllabus PDF remains citation/metadata-only until reuse rights are established. Do not ingest a public file merely because it is reachable.

**Ingestion pipeline**
1. Register source and rights evidence.
2. Approve intended use before download or parsing.
3. Fetch from approved source or ingest authorized file.
4. Verify file type, size, checksum, version and safe file handling.
5. Parse supported format and preserve page/heading/section/table context.
6. Normalize without removing citations or educational boundaries.
7. Chunk with page/section anchors and content checksums.
8. Attach grade, subject, chapter, concept IDs, source version and rights metadata.
9. Generate embeddings only after approval behind a provider-neutral adapter.
10. Store chunks/vector references with re-index and deletion capability.
11. Evaluate on a manually judged query set and report Recall@k or an appropriate ranking metric, latency and cost.
12. Exclude low-quality, permission-unclear or out-of-scope chunks.

Do not select a vector database or embedding provider before measuring corpus size, filtering needs, rights and hosting cost. Keep retrieval behind an adapter.

~~~mermaid
flowchart TD
  A["Register candidate source and owner"]
  B["Review licence and intended operations"]
  C{"Permission covers intended use?"}
  D["Reject or hold source from ingestion"]
  E["Fetch approved source version"]
  F["Verify file type size checksum and version"]
  G["Parse with page and section anchors"]
  H["Chunk and attach curriculum metadata"]
  I["Generate embeddings through adapter"]
  J["Store source-linked chunks and vectors"]
  K["Run manually judged retrieval queries"]
  L{"Quality and provenance pass?"}
  M["Approve retrieval corpus version"]
  N["Exclude weak chunks and document coverage gap"]
  A --> B --> C
  C -->|no| D
  C -->|yes| E --> F --> G --> H --> I --> J --> K --> L
  L -->|yes| M
  L -->|no| N
~~~

**Quality and security:** each chunk resolves to source/version/page; re-ingestion creates a new version; permission revocation propagates to indexes/cache; retrieval filters by approved grade/subject/concept; no learner personal data goes into source embeddings.

**Exit gate:** every source has recorded permission, every chunk traces to its source/version, a human-judged retrieval report exists, and corpus coverage/cost/latency are documented.

### 11.12 Phase 26 — grounded Student learning assistant

**Status:** planned; depends on evaluated, permitted retrieval.

**Purpose:** explain a concept using approved retrieved evidence. The model generates wording; it is not the curriculum source of truth.

**Request flow**
1. Student submits a bounded question in Learning Studio.
2. API authenticates Student and derives grade/subject/class from persisted records.
3. Apply rate, request-size and per-user limits before expensive work.
4. Determine allowed curriculum scope.
5. Retrieve relevant chunks from an approved source version.
6. If evidence is empty/weak, use curated fallback or ask the Student to select a supported concept.
7. Send only the question, grade constraints, retrieved evidence IDs/content and strict output schema to the model.
8. Validate response structure, citations, length, topic and safety.
9. Verify each citation belongs to the retrieved allowed chunk set.
10. Return explanation and source references; if provider/retriever fails, show a safe fallback.
11. Log minimal operational metadata without storing unnecessary dialogue by default.

**Guardrails:** no unsafe chemistry experiment/mixing advice; no invented citations; no NCERT textbook RAG without permission; no answer-key or other-learner data disclosure; no claim hallucinations are impossible; visible uncertainty; bounded rate/cost/timeouts.

~~~mermaid
sequenceDiagram
  participant S as Student UI
  participant API as Assistant API
  participant R as Approved retriever
  participant L as Language model
  participant V as Response validator
  S->>API: Ask bounded question
  API->>API: Authenticate and derive curriculum scope
  API->>API: Apply limits and safety checks
  API->>R: Retrieve approved chunks for scope
  alt Adequate evidence found
    R-->>API: Ranked chunks with source anchors
    API->>L: Question plus bounded evidence and schema
    L-->>API: Structured draft and citations
    API->>V: Validate content and evidence IDs
    alt Response passes
      V-->>API: Safe answer and references
      API-->>S: Explanation with citations
    else Response fails
      V-->>API: Validation rejection
      API-->>S: Curated fallback or unsupported notice
    end
  else No adequate evidence
    R-->>API: No supported evidence
    API-->>S: Curated fallback and scope guidance
  end
~~~

**Evaluation:** fixed educator-checked factuality set; prompt injection in retrieved text; unsafe chemistry requests; citation validity/completeness; age suitability; refusal/fallback; latency/cost; provider and retriever outage behavior.

**Exit gate:** answers cite allowed sources, unsupported questions fall back, fixed reviewed evaluations pass and operational limits are documented.

### 11.13 Phase 27 — AI-generated practice-question candidates

**Status:** planned; draft generation only.

**Purpose:** generate structured question candidates from approved retrieval evidence. Model output is untrusted and never published directly.

**Candidate provenance**
Store provider/model version, prompt-template version, taxonomy/concept IDs and version, source chunk IDs, structured content/options/proposed answer/explanation, validation findings, similarity result, generated time and lifecycle status.

**Generation workflow**
1. Authorized Teacher selects an approved concept and a bounded number of draft candidates.
2. Server loads allowed concept metadata and approved source chunks; client-provided arbitrary text does not become official evidence.
3. Build a constrained prompt from source evidence and MCQ schema.
4. Call provider with timeout and token/spend limits.
5. Parse structured output and reject invalid JSON/unexpected fields.
6. Validate prompt/options, unique IDs, correct-option membership, explanation, concept mapping and evidence support.
7. Compare exact/near-duplicate questions against the bank.
8. Run deterministic safety and scope checks; send uncertain material to human review.
9. Persist a draft candidate with complete provenance and report.
10. Provider or validation failure creates no Student-visible item.

A proposed answer key is only a model suggestion. It is not factually correct merely because the model generated it. Phase 28 must show it and the evidence to an authorized Teacher.

~~~mermaid
flowchart TD
  A["Teacher requests candidate for approved concept"]
  B["Resolve permitted chunks and taxonomy version"]
  C["Build bounded structured generation request"]
  D["Call provider with timeout and budget limit"]
  E{"Provider returned valid structure?"}
  F["Reject provider result without candidate"]
  G["Validate schema concept and answer membership"]
  H["Check evidence safety and scope"]
  I["Run duplicate and similarity checks"]
  J{"Automatic checks acceptable?"}
  K["Persist draft with model prompt and source provenance"]
  L["Reject or flag for manual investigation"]
  M["Keep candidate unavailable to Students"]
  N["Send draft to Teacher review queue"]
  A --> B --> C --> D --> E
  E -->|no| F
  E -->|yes| G --> H --> I --> J
  J -->|yes| K --> M --> N
  J -->|no| L --> M
~~~

**Tests and exit gate:** provider timeout/rate limit/malformed JSON; invalid options/key; unsupported evidence/wrong concept/wrong grade/unsafe advice; duplicates; source IDs persist; draft not returned to Student; no automatic publish path; deterministic validation independent of live provider.

### 11.14 Phase 28 — Teacher review and immutable publication

**Status:** planned; mandatory human publication gate.

**Purpose:** make Educators the final authority for AI-generated questions. Approval is explicit, auditable and tied to an exact version.

**Review screen**
Show prompt, options, proposed correct answer, explanation, concept/grade mapping, source passages and anchors, model/provider/prompt version, automatic validation warnings, duplicate/safety results and lifecycle state. A reviewer must be able to inspect evidence without accessing a source outside their permission.

**Review actions**
- Approve: validate reviewer scope, create immutable published QuestionVersion and record review/provenance.
- Edit: create a new candidate revision; never mutate an already reviewed/published version.
- Reject: record reviewer/time/reason and exclude from Student serving.
- Request changes: create a revision state with review notes.
- Retire/withdraw: stop future serving while retaining historical attempt/version records.

Only a reviewer authorized for that school/class/subject may approve. Admin school ownership does not automatically grant academic approval for every topic. Reviewer policy must be explicit.

**Atomic publication**
1. Confirm candidate is reviewable.
2. Resolve reviewer from persisted actor context.
3. Verify reviewer is authorized for candidate school/subject/grade.
4. Verify evidence and taxonomy version are still approved/available.
5. Re-run deterministic answer/schema validation.
6. Create immutable published version and audit record.
7. Conditionally transition candidate review state.
8. Ensure Student fetch/recommendation query uses only published versions.
9. Preserve the exact version used by existing attempts.

~~~mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> PendingReview
  PendingReview --> ChangesRequested
  ChangesRequested --> PendingReview
  PendingReview --> Rejected
  PendingReview --> Approved
  Approved --> Published
  Published --> Retired
  Rejected --> Draft: Authorized reopen
  Retired --> [*]
~~~

~~~mermaid
flowchart TD
  A["Teacher opens review queue"]
  B["Load candidate and evidence provenance"]
  C["Verify reviewer and school subject scope"]
  D["Inspect question answer key and warnings"]
  E{"Reviewer decision"}
  F["Create immutable published QuestionVersion"]
  G["Create revised draft with review notes"]
  H["Record rejection and reviewer"]
  I["Keep unapproved content hidden"]
  J["Expose published version to eligible Students"]
  K["Preserve version for historical attempts"]
  A --> B --> C --> D --> E
  E -->|approve| F --> J --> K
  E -->|request changes| G --> I
  E -->|reject| H --> I
~~~

**Tests and exit gate:** unauthorized reviewer cannot approve; draft/rejected candidates never served; evidence and model provenance persist; edits create new versions; attempts keep historical version; concurrent approval cannot create duplicates; all decisions are auditable.

### 11.15 Phase 29 — Teacher insights, evaluation and pilot readiness

**Status:** planned; a release gate, not just a dashboard phase.

**Purpose:** provide Teachers with useful class-level views while proving the product is safe, measurable and operationally supportable before any real-Student pilot.

**Teacher insights**
Potential views include aggregate attempt/participation by subject/concept, first-attempt/recent accuracy with sample counts, mastery distribution only when coverage is adequate, revision uptake, tentative misconception patterns and question/review coverage. Teacher reads must be scoped to assigned class/subject. Small-group privacy safeguards must suppress or coarsen aggregates that could reveal a specific learner. Admin sees privacy-reviewed school aggregates, not unrestricted private attempt histories by default.

Do not infer attendance, motivation, mental ability or a permanent academic label from quiz accuracy.

**Independent evaluation streams**
- BKT: calibration, Brier/log loss and next-response prediction against simple baselines.
- Recommendation: eligibility correctness, coverage, repeat suppression and comparison with fixed-order/random/low-mastery policies.
- Misconception rules: precision/recall/F1, class-wise error and minimum sample sizes.
- Retrieval: judged queries, Recall@k or appropriate ranking metric, citation coverage.
- Generated questions: validity, correctness, source support, duplicates, safety and Teacher acceptance.
- Reliability: API error/latency, duplicate submissions, worker lag, provider failures and recovery.
- Security/privacy: role/school isolation, answer-key leak, deletion/review audit and retention.

Do not collapse these into one vanity score. High retrieval relevance does not prove an answer is correct; Teacher acceptance does not prove learning improved.

**Pilot go/no-go**
Engineering, academic owner and privacy/security owner review the evidence. Include sample sizes/provenance, known limitations, consent/authorization, retention, incident response and rollback. Failure of a high-risk gate means stay in internal/synthetic testing.

~~~mermaid
flowchart TD
  A["Collect evaluation and reliability reports"]
  B["Review learner privacy and small group suppression"]
  C["Retest role school and class isolation"]
  D["Retest answer key and question version security"]
  E["Review source rights and Teacher publication audit"]
  F["Review model and recommendation metrics"]
  G["Review operations backups and recovery"]
  H{"Academic privacy security and quality gates pass?"}
  I["Approve limited pilot with scope and rollback plan"]
  J["No-go: repair gaps and repeat review"]
  K["Monitor pilot and enforce stop conditions"]
  A --> B --> C --> D --> E --> F --> G --> H
  H -->|yes| I --> K
  H -->|no| J
~~~

**Pilot safeguards:** written purpose/scope; required consent/authorization; retention/deletion route; minimum group-size rules; ability to disable AI without breaking quizzes/school app; incident/rollback trigger; transparent estimate language; no educational-impact claims without a valid study.

**Exit gate:** reproducible reports with sample sizes/uncertainty, privacy/security sign-off, source provenance and a documented go/no-go decision before real-Student access.

### 11.16 Phase 30 — deployment, documentation and portfolio evidence

**Status:** planned; final reproducibility and handover phase.

**Purpose:** ensure another developer, operator or interviewer can understand, run, test and evaluate the product. A one-time demo on a developer laptop is not a deployment plan.

**Deployment decisions**
- Choose hosting for React assets, Express API, MongoDB and any Python component based on security, budget and measured workload.
- Keep secrets in provider secret storage. Never place database credentials, model keys or session secrets in React REACT_APP variables.
- Configure frontend origin, credentialed CORS, Secure/SameSite cookies, TLS, Mongo network policy and backups together.
- Add readiness checks so API health does not report ready while required dependencies are unavailable.
- Decide whether Python BKT/retrieval runs as an internal API, worker or offline job. Do not expose model services to the public browser.
- Version schema, frontend/backend, ML parameters and source corpus for rollback/reproduction.
- Monitor API latency/errors, job backlog, provider failures and backup status without logging Student content or secrets.

**Release workflow**
1. Freeze commit and build metadata.
2. Run backend/frontend/Python tests in isolated environments.
3. Validate seed/catalogue manifests.
4. Rehearse migrations/import on disposable or staging copy.
5. Run build and static/security checks.
6. Deploy backend and verify readiness.
7. Deploy frontend with correct public API base URL.
8. Smoke-test Admin, Teacher, Student, Games Zone and Learning Studio.
9. Verify role/school isolation, session expiry and cookie transport on actual origins.
10. Verify approved content and retrieval/model versions.
11. Verify backup and perform a restore rehearsal.
12. Record release identity, test evidence, configuration reference and rollback steps.

**Handover pack**
Windows setup; environment/secret matrix; schema and relationship diagrams; API/role matrix; source rights register; import/migration guide; actual test output; BKT assumptions/evaluation; recommendation/misconception policy; retrieval/assistant/generation evaluation; privacy/retention/deletion; monitoring/recovery; demo script and known limitations. Attribution must separate original school-management work, legacy ChemAmaze data and new features.

~~~mermaid
flowchart TD
  A["Freeze commit and environment versions"]
  B["Run backend frontend and content validation"]
  C["Rehearse migrations on isolated staging"]
  D["Build and inspect release artifacts"]
  E["Deploy backend and verify readiness"]
  F["Deploy frontend with public API configuration"]
  G["Run role and end to end smoke tests"]
  H["Verify privacy rights and model versions"]
  I["Verify backup and restore"]
  J{"All release checks complete?"}
  K["Promote release and publish operator docs"]
  L["Rollback and repair failures"]
  M["Capture demo evidence and interview notes"]
  A --> B --> C --> D --> E --> F --> G --> H --> I --> J
  J -->|yes| K --> M
  J -->|no| L
~~~

**Exit gate:** clean environment can be provisioned from docs; tests/build/seed results are reproducible; schema/source/model versions are identifiable; role journeys, rollback and restore are proven; portfolio statements match actual implementation and evidence.

### 11.17 Cross-phase contracts that must remain consistent

| Contract | Required behavior | Why it matters |
|---|---|---|
| Identity | Derive Student/Teacher/Admin from signed session and persisted actor, never request JSON | Prevents identity spoofing and tenant leakage |
| Scope | Validate school, class, subject, grade and concept relationships on every operation | Prevents wrong-cohort content and IDOR |
| Lifecycle | Draft, pending review, approved, published, retired/rejected are server-enforced states | Prevents accidental exposure |
| Versioning | Attempts reference exact quiz/question/taxonomy versions | Makes historical results reproducible |
| Answer keys | Never return before successful server grading | Prevents leakage |
| Provenance | Questions/explanations/chunks retain creator/source/version/permission | Enables audit and takedown |
| Event integrity | Idempotency, deterministic order and replayable updates | Prevents corrupted analytics/mastery |
| Privacy | Minimize learner fields, scope queries, suppress small groups, define retention | Protects students, including minors |
| AI trust | Model output is untrusted; deterministic validation and educator approval gate publication | Prevents unchecked generated content |
| Evaluation | Compare algorithms to baselines and report samples/uncertainty | Prevents unsupported claims |
| Failure isolation | Quiz attempts remain durable if model/retrieval/provider fails | Protects the core learning flow |
| Feature flags | AI features can be disabled without disabling school management or first-party quiz basics | Supports safe pilot and rollback |

### 11.18 Likely future file boundaries

The paths below are planning candidates, not tracked files. Final paths should be chosen after inspecting current conventions in the relevant phase.

| Domain | Candidate boundaries | Responsibility |
|---|---|---|
| Question bank | Question/version model, question validator, question-bank service/controller/tests | Content, authoring, review and versioning |
| Quiz UI | Teacher Learning Studio, Student list/take/result pages, question/progress components | Native UI using existing APIs |
| Attempt evidence | Event contract/service, replay/data-quality command/tests | Idempotent response records |
| Baseline analytics | Data dictionary, cohort/split/report scripts, synthetic simulator | Measurement before ML |
| BKT | Pure Python model, parameter config, tests and evaluation script | Formula-only estimate |
| Mastery | Mastery model, worker/outbox, integration adapter and controller tests | Replayable state updates |
| Recommendation | Policy/service, recommendation event model/controller/tests | Candidate eligibility and rationale |
| Misconception | Reviewed taxonomy, rules engine, evaluation scripts | Tentative distractor-pattern hypotheses |
| Retrieval | Source registry, ingestion pipeline, chunk schema, embedding/retriever adapter | Permission-cleared source grounding |
| Assistant | Controller/service, prompt templates, output schema, citation validator | Grounded explanations and fallback |
| Generation | Provider adapter, candidate model, validators and duplicate checker | Draft-only question proposals |
| Review | Review queue UI, review model/controller, immutable publication service | Human approval and audit |
| Insights/pilot | Aggregate query service, privacy suppression, evaluation reports | Safe class-level reporting |
| Deployment | CI, readiness checks, release docs and restore scripts | Reproducible operation |

### 11.19 Per-phase completion checklist

For every phase:
1. Confirm prerequisites and educator/content permissions.
2. Re-read exact source files and adjust proposals to actual patterns.
3. Review API request/response and role matrix before UI changes.
4. Define schema/version/migration plan before persistence changes.
5. Add success, validation, authorization, conflict, retry and failure tests.
6. Inspect Student-safe projections and answer-key/source provenance explicitly.
7. Execute relevant backend/frontend/Python checks and record real outputs.
8. Browser-test keyboard/mobile and deployed/provider behavior where relevant.
9. Review diff for unrelated edits, data leaks, secrets and generated files.
10. Update PROJECT_HANDOFF.md and this file with actual changes and evidence.
11. Explain limitations and the next phase's entry gate.
12. Stop for review; do not begin the next phase until its prerequisites pass.



## 12. Key end-to-end flowcharts

### 12.1 Admin provisions a school

~~~mermaid
flowchart TD
  A["Admin registers / signs in"] --> B["Session cookie created"]
  B --> C["Admin dashboard"]
  C --> D["Create Class"]
  D --> E["Create Subject for Class"]
  E --> F["Register Teacher for Class + Subject"]
  F --> G["Register Students in Class"]
  G --> H["Manage school records, notices and complaints"]
  H --> I["Moderate Learning & Games catalogue"]
~~~

### 12.2 Teacher publishes and Student launches Wordwall

~~~mermaid
flowchart TD
  A["Teacher session"] --> B["Database-derived assignment"]
  B --> C["Teacher opens My Games"]
  C --> D["Enter content and official embed URL/snippet"]
  D --> E["Frontend validates for feedback"]
  E --> F["POST create"]
  F --> G["Server validates URL and persisted assignment"]
  G --> H["Create draft GameActivity"]
  H --> I["Teacher previews safe iframe"]
  I --> J["Teacher publishes"]
  J --> K["Student class list includes published activity"]
  K --> L["Student launches Wordwall"]
~~~

### 12.3 Game archival before school resource mutation

~~~mermaid
flowchart TD
  A["Admin deletes Class / Subject / Teacher or reassigns Teacher"] --> B["Load target resource"]
  B --> C["Invoke GameActivity lifecycle service"]
  C --> D["Archive matching records with reason and timestamp"]
  D --> E["Perform school resource delete/update"]
  E --> F["Clear or update related Teacher/Subject references"]
  F --> G["Return result"]
  D -. later operation may fail .-> H["Archived game may remain while old resource remains; retry/repair required"]
~~~

### 12.4 First-party quiz attempt (existing backend path)

~~~mermaid
flowchart TD
  A["Teacher creates quiz draft"] --> B["Validate MCQ and Teacher assignment"]
  B --> C["Teacher publishes"]
  C --> D["Student fetches published quiz without answer key"]
  D --> E["Student submits option IDs + idempotency key"]
  E --> F["Validate session, Student, quiz, Class and Subject"]
  F --> G["Validate question and option membership"]
  G --> H["Server compares with correctOptionId"]
  H --> I["Save LearningAttempt and quizVersion"]
  I --> J["Return score and post-submit feedback"]
  I -. future .-> K["Concept mastery / recommendations"]
~~~

### 12.5 Planned grounded AI path

~~~mermaid
flowchart TD
  A["Educator-approved taxonomy and permitted sources"] --> B["Reviewed first-party question bank"]
  B --> C["Student quiz attempt"]
  C --> D["Validated attempt event"]
  D --> E["Analytics and quality checks"]
  E --> F["BKT mastery estimate"]
  F --> G["Explainable recommendation"]
  A --> H["Rights-cleared ingestion"]
  H --> I["Versioned source chunks"]
  I --> J["Grounded assistant with citations"]
  I --> L["Evidence for generated question candidate"]
  L --> M["Schema, answer, evidence and duplicate checks"]
  M --> N["Teacher review"]
  N --> O["Approved immutable question version"]
  O --> B
~~~

---

## 13. File-by-file repository guide

The inventory below reflects the 188 tracked files in the reviewed branch tree. Each entry explains the responsibility of the file in the current architecture. Binary assets and archived bundles are identified as resources rather than executable modules.

### 13.1 Root documentation and project contract

| File | Responsibility |
|---|---|
| README.md | Original school-management overview, stack and older setup/deployment guidance. Some environment wording predates the current signed-cookie implementation; prefer backend/.env.example for current server configuration. |
| AI_LEARNING_GAMES_IMPLEMENTATION_HARNESS.md | Thirty-phase product/engineering plan, accepted role workflows, constraints, exit gates and future implementation sequence. |
| AI_LEARNING_MODULE_DESIGN.md | Phase 08 integration design: observed current routes/pages, proposed frontend/backend boundaries, API ownership, permission matrix and navigation structure. |
| AI_LEARNING_CURRICULUM_SCOPE.md | Phase 16 one-chapter curriculum mapping, seven concepts, rights limitations, safety decisions and educator approval checklist. |
| PROJECT_HANDOFF.md | Development continuity record, phase status, commits, exact test evidence, outstanding gates and next safe action. Update after material phase work. |
| workflow.md | This comprehensive architecture/workflow/file-index/interview guide. |

### 13.2 Backend runtime, configuration and route registry

| File | Responsibility |
|---|---|
| backend/index.js | Express bootstrap, environment loading, request context, CORS, JSON parser, Mongo connection, route mounting, error handlers and HTTP listener. |
| backend/package.json | Backend scripts and dependency manifest; Node test runner and ChemAmaze validate/dry-run/apply scripts. |
| backend/package-lock.json | Locked backend dependency graph for reproducible installs. |
| backend/.env.example | Template for PORT, MONGO_URL, FRONTEND_URLS, AUTH_SESSION_SECRET, token TTL and cookie SameSite. |
| backend/.gitignore | Excludes secrets, dependencies, build/test output and local ChemAmaze target IDs. |
| backend/routes/route.js | Single Express route registry. Applies ordered authentication, role and resource-scope middleware before protected controller handlers. |
| backend/config/corsOptions.js | Validates configured frontend origins and returns credential-aware CORS options, including exposed request ID header. |
| backend/API_CONTRACT.md | New Games/Quiz endpoint, lifecycle, response, validation, error and request-tracing contract. |
| backend/GAME_ACTIVITY_INVARIANTS.md | GameActivity persistence, relationships, indexes, archive rules and legacy provenance invariants. |
| backend/LEGACY_GAME_IMPORT.md | Operator guide for seed source, local target mapping, safety guards, dry-run and development-only apply. |

### 13.3 Backend controllers

| File | Responsibility |
|---|---|
| backend/controllers/admin-controller.js | Admin registration, login, password hash/legacy upgrade, session cookie creation and Admin detail. |
| backend/controllers/auth-controller.js | GET AuthSession profile restoration from signed claims and POST AuthLogout cookie clearing. |
| backend/controllers/class-controller.js | Class create/list/detail/student operations and deletion; archives dependent games before class removal. |
| backend/controllers/complain-controller.js | Student complaint creation and Admin school complaint list. |
| backend/controllers/game-activity-controller.js | Teacher GameActivity create/list/update/publish/unpublish/archive; validates URL and persisted assignment. |
| backend/controllers/admin-game-activity-controller.js | Admin school-scoped GameActivity list, filters, pagination, summary and moderation transitions. |
| backend/controllers/learning-quiz-controller.js | Current first-party MCQ create/list/publish/submit; server-side grade and LearningAttempt persistence. |
| backend/controllers/notice-controller.js | Notice create/list/update/delete operations. |
| backend/controllers/student_controller.js | Student registration/login/list/detail/update/delete, exam-result and attendance operations. |
| backend/controllers/subject-controller.js | Subject create/list/detail/delete and cleanup of related assignments; archives dependent games before removal. |
| backend/controllers/teacher-controller.js | Teacher registration/login/list/detail, subject reassignment, delete and attendance; archives related games on reassignment/deletion. |

### 13.4 Backend middleware

| File | Responsibility |
|---|---|
| backend/middleware/authenticateSession.js | Reads school_session cookie, verifies signature/expiry and attaches claims to req.auth. |
| backend/middleware/authorizeRoles.js | Checks the signed role against the route's explicit role allowlist. |
| backend/middleware/loadActorContext.js | Reloads persisted account, checks role and derives trusted school/class/subject actor context. |
| backend/middleware/authorizeSchoolScope.js | Resolves school/class/Student/Teacher/Subject/notice resources and validates tenant/role/relationship scope. |
| backend/middleware/requestContext.js | Generates request ID, returns X-Request-Id and records minimal operational logs. |
| backend/middleware/apiErrorHandler.js | Final not-found/error handling and safe conversion of recognized transport/parser failures. |

### 13.5 Backend domain services and utilities

| File | Responsibility |
|---|---|
| backend/services/learning/gameActivityIntegrity.js | ObjectId normalization, persisted Teacher/school/class/subject relationship validation and idempotent GameActivity archival/reassignment operations. |
| backend/services/learning/legacyGameCatalog.js | ChemAmaze manifest structure, source provenance, deterministic key, group count and Wordwall share/embed URL validation. |
| backend/services/learning/legacyGameImporter.js | Six assignment mapping checks, database target resolution, read-only plan, conflict detection, idempotent draft insert and failure reconciliation. |
| backend/services/learning/chemamazeDemoSeed.js | Idempotently creates/reuses the fictional demo Admin school, Classes 6–8, six subjects, six assigned Teachers and three Student demo accounts without resetting existing credentials. |
| backend/utils/adminPassword.js | bcrypt Admin hash/verify and one-time legacy plaintext upgrade signal. |
| backend/utils/apiResponse.js | Standardized API error response with stable code, user-safe message and requestId. |
| backend/utils/asyncHandler.js | Express 4 wrapper for async route rejections and synchronous errors. |
| backend/utils/authSession.js | Signed token creation/verification, secret and TTL rules, cookie set/clear/read. |
| backend/utils/wordwallUrl.js | Backend allowlist for Wordwall embed URLs and extraction of src from a strictly-shaped iframe snippet. |

### 13.6 Backend Mongoose models

| File | Responsibility |
|---|---|
| backend/models/adminSchema.js | Admin and tenant/school identity. |
| backend/models/sclassSchema.js | Class name and owning school reference. |
| backend/models/subjectSchema.js | Subject name/code/sessions and its school/class/Teacher relationships. |
| backend/models/teacherSchema.js | Teacher credentials, school/class/subject assignments and attendance. |
| backend/models/studentSchema.js | Student credentials, roll number, school/class and exam-result/attendance subdocuments. |
| backend/models/noticeSchema.js | School-scoped notice data and timestamps. |
| backend/models/complainSchema.js | Student complaint, date and school/user references. |
| backend/models/gameActivitySchema.js | Separate Wordwall game document, strict URL validator, publication lifecycle, indexes and optional immutable legacySource. |
| backend/models/learningQuizSchema.js | First-party quiz, embedded MCQs/options, server-held answer keys, version/status and scope. Current concept is free-text. |
| backend/models/learningAttemptSchema.js | Student attempt responses, quiz version, idempotency, score, correctness, timestamps and indexes. |

### 13.7 Backend seed manifests and script

| File | Responsibility |
|---|---|
| backend/scripts/import-chemamaze-games.js | Existing manual CLI for validation, custom development-school dry-run and confirmation-protected apply mode. |
| backend/scripts/seed-chemamaze-demo.js | One-command local demo bootstrap; uses the dedicated loopback school_management_dev database, creates/reuses demo school scope and imports the 18 canonical games as drafts. |
| backend/package.json | Exposes the `npm run seed` demo bootstrap command while retaining validate/dry-run/manual-apply scripts. |
| backend/seeds/chemamaze-cbse-games.json | Pinned canonical 18-record Wordwall manifest. |
| backend/seeds/chemamaze-supplemental-review.json | Six related-repository extras excluded from importer pending provider/content review. |
| backend/seeds/chemamaze-targets.example.json | Placeholder school and six grade/subject ObjectId mapping template. |
| backend/seeds/curriculum-concept-catalog.json | Versioned Class 7 Science Chapter 2 seven-concept taxonomy, prerequisite graph, source metadata, activity references and feature gates. |

### 13.8 Backend tests

The backend suite uses Node's built-in test runner and a test-only preloader. Most current feature tests inject model doubles and do not connect to a live MongoDB database.

| File | Responsibility / coverage |
|---|---|
| backend/tests/README.md | Backend test setup and isolation instructions. |
| backend/tests/test-env.js | Forces NODE_ENV=test, dedicated local test URI, test-only session secret and local CORS origin. |
| backend/tests/test-env.test.js | Checks test environment safety configuration. |
| backend/tests/adminPassword.test.js | Admin hash, verification and legacy password upgrade behavior. |
| backend/tests/authSession.test.js | Token signing/claims/expiry and cookie configuration. |
| backend/tests/authenticateSession.test.js | Valid, missing, invalid and expired session middleware behavior. |
| backend/tests/authorizeRoles.test.js | Role allowlist success and rejection behavior. |
| backend/tests/authorizeSchoolScope.test.js | Tenant/resource and cross-role scope checks. |
| backend/tests/actorContextMiddleware.test.js | Middleware composition and actor context behavior. |
| backend/tests/loadActorContext.test.js | Persisted account reload and database-derived actor values. |
| backend/tests/routeAuthorization.test.js | Protected route middleware coverage. |
| backend/tests/learningRouteAuthorization.test.js | Learning/Games routes and allowed-role coverage. |
| backend/tests/apiContract.test.js | Stable response code/message/request ID expectations. |
| backend/tests/corsOptions.test.js | CORS origin parsing, credential and rejection behavior. |
| backend/tests/wordwallUrl.test.js | Backend unsafe host/scheme/path/port and iframe snippet rejection. |
| backend/tests/gameActivitySchema.test.js | GameActivity model lifecycle, URL, provenance and index invariants. |
| backend/tests/gameActivityController.test.js | Teacher create/list/update/publish/unpublish/archive behavior and scope validation. |
| backend/tests/gameActivityLifecycle.test.js | Archive operation filters, reasons, dates and idempotency. |
| backend/tests/gameActivityLifecycleControllers.test.js | Class/Subject/Teacher deletion/reassignment integration and archive-before-mutation. |
| backend/tests/adminGameActivityController.test.js | Admin tenant catalogue filters, pagination, counts and moderation. |
| backend/tests/legacyGameCatalog.test.js | Canonical source metadata, record coverage, deterministic keys and link validation. |
| backend/tests/legacyGameImporter.test.js | Development-only target guard, assignments, dry-run, idempotency, conflicts and concurrent key handling. |
| backend/tests/chemamazeDemoSeed.test.js | Demo school/class/subject/Teacher/Student setup, six assignment mappings, idempotent reruns, hashed credentials and conflict refusal. |
| backend/tests/curriculumConceptCatalog.test.js | Concept scope/ID uniqueness, prerequisite DAG and source/rights/feature-gate consistency. |
| backend/tests/learningQuizController.test.js | Quiz creation/list/publish/submit, authorization, answer-key filtering, grading and idempotency. |
| backend/tests/noticeUpdateController.test.js | Notice update allowlist and input validation. |
| backend/tests/studentUpdateController.test.js | Student update allowlist and password hashing behavior. |

### 13.9 Frontend project, global entry and configuration

| File | Responsibility |
|---|---|
| frontend/package.json | React/CRA scripts and dependencies including React, router, Redux Toolkit, Axios, Material UI, Recharts and styled-components. |
| frontend/package-lock.json | Locked frontend dependency graph. |
| frontend/README.md | Create React App commands for local start, test, build and eject. |
| frontend/.env | Currently exposes REACT_APP_BASE_URL for the local API; public config only, no secret. |
| frontend/.gitignore | Excludes node_modules, build output, local env overrides and test coverage. |
| frontend/netlify.toml | Netlify SPA fallback to index.html and no-cache headers. |
| frontend/public/index.html | Browser HTML shell, metadata and React root element. |
| frontend/public/favicon.ico | Browser tab/site icon. |
| frontend/src/index.js | React DOM root, global CSS, Redux Provider and Axios credential defaults. |
| frontend/src/App.js | Session restoration, checking/loading gate, public routes and role-based dashboard selection. |
| frontend/src/index.css | Global CSS/reset and application-level baseline styles. |
| frontend/src.zip | Tracked source archive; not imported by the runtime entry point. Use active frontend/src files as code source of truth. |

### 13.10 Frontend public pages

| File | Responsibility |
|---|---|
| frontend/src/pages/Homepage.js | Public landing/entry page. |
| frontend/src/pages/ChooseUser.js | Role selection and guest/demo shortcuts; hard-coded demo access must not be production-enabled. |
| frontend/src/pages/LoginPage.js | Role-specific login form and dispatch of loginUser; Student fields differ from Admin/Teacher. |
| frontend/src/pages/Logout.js | Logout confirmation and logout dispatch/navigation. |

### 13.11 Shared frontend components

| File | Responsibility |
|---|---|
| frontend/src/components/AccountMenu.js | Shared signed-in profile/account menu. |
| frontend/src/components/CustomBarChart.js | Reusable bar chart presentation for legacy dashboard metrics. |
| frontend/src/components/CustomPieChart.js | Reusable pie chart presentation for legacy dashboard metrics. |
| frontend/src/components/ErrorPage.js | Reusable error/not-found presentation. |
| frontend/src/components/Popup.js | Reusable popup/message display. |
| frontend/src/components/SeeNotice.js | Shared notice presentation. |
| frontend/src/components/SpeedDialTemplate.js | Reusable Material UI speed-dial action template. |
| frontend/src/components/TableTemplate.js | Shared table template for record lists. |
| frontend/src/components/TableViewTemplate.js | Shared table/detail view template. |
| frontend/src/components/WordwallEmbed.js | Validated fixed iframe plus external Wordwall fallback. |
| frontend/src/components/attendanceCalculator.js | Attendance calculation helper used by legacy attendance screens. |
| frontend/src/components/buttonStyles.js | Shared button style components. |
| frontend/src/components/mobileChecker.js | Legacy device/viewport detection helper. |
| frontend/src/components/styles.js | Shared AppBar/Drawer and styled dashboard layout primitives. |

### 13.12 Admin dashboard and pages

| File | Responsibility |
|---|---|
| frontend/src/pages/admin/AdminDashboard.js | Admin shell, AppBar, Drawer, sidebar and nested Admin routes. |
| frontend/src/pages/admin/SideBar.js | Admin navigation links and active route styles. |
| frontend/src/pages/admin/AdminHomePage.js | Admin home/dashboard. |
| frontend/src/pages/admin/AdminProfile.js | Admin profile page. |
| frontend/src/pages/admin/AdminLearningGames.js | Admin Games catalogue filters, pagination, counts, school metadata and unpublish/archive actions. |
| frontend/src/pages/admin/AdminFeeCollection.js | Fee-related frontend page. Inspected backend contains no dedicated fee/payment model or payment-processing route; do not claim a verified payment integration from this UI alone. |
| frontend/src/pages/admin/AdminRegisterPage.js | Admin/school registration form. |
| frontend/src/pages/admin/classRelated/AddClass.js | Create a class. |
| frontend/src/pages/admin/classRelated/ClassDetails.js | Class details and class-scoped actions. |
| frontend/src/pages/admin/classRelated/ShowClasses.js | Admin class list. |
| frontend/src/pages/admin/studentRelated/AddStudent.js | Student registration form, including class-selected mode. |
| frontend/src/pages/admin/studentRelated/SeeComplains.js | Admin complaint review/list. |
| frontend/src/pages/admin/studentRelated/ShowStudents.js | Student list. |
| frontend/src/pages/admin/studentRelated/StudentAttendance.js | Attendance entry/management screen reused in Admin/Teacher routes. |
| frontend/src/pages/admin/studentRelated/StudentExamMarks.js | Exam marks entry/display screen reused in Admin/Teacher routes. |
| frontend/src/pages/admin/studentRelated/ViewStudent.js | Individual Student details. |
| frontend/src/pages/admin/noticeRelated/AddNotice.js | Notice creation form. |
| frontend/src/pages/admin/noticeRelated/ShowNotices.js | Notice list/management. |
| frontend/src/pages/admin/subjectRelated/ShowSubjects.js | Subject list. |
| frontend/src/pages/admin/subjectRelated/SubjectForm.js | Create Subject for a selected Class. |
| frontend/src/pages/admin/subjectRelated/ViewSubject.js | Subject detail and related class/student links. |
| frontend/src/pages/admin/teacherRelated/AddTeacher.js | Teacher registration form. |
| frontend/src/pages/admin/teacherRelated/ChooseClass.js | Class selection step in Admin workflows. |
| frontend/src/pages/admin/teacherRelated/ChooseSubject.js | Subject selection/assignment step. |
| frontend/src/pages/admin/teacherRelated/ShowTeachers.js | Teacher list. |
| frontend/src/pages/admin/teacherRelated/TeacherDetails.js | Teacher detail/assignment view. |

### 13.13 Teacher dashboard and pages

| File | Responsibility |
|---|---|
| frontend/src/pages/teacher/TeacherDashboard.js | Teacher AppBar/Drawer/sidebar and nested routes for dashboard, class, profile, complaints, student, attendance, marks and games. |
| frontend/src/pages/teacher/TeacherSideBar.js | Teacher navigation and display of assigned Class; includes My Games. |
| frontend/src/pages/teacher/TeacherHomePage.js | Teacher home/dashboard. |
| frontend/src/pages/teacher/TeacherProfile.js | Teacher profile. |
| frontend/src/pages/teacher/TeacherClassDetails.js | Assigned Class detail and Student listing. |
| frontend/src/pages/teacher/TeacherViewStudent.js | Student detail view in Teacher's class scope. |
| frontend/src/pages/teacher/TeacherComplain.js | Teacher complaint-related page. |
| frontend/src/pages/teacher/TeacherGameZone.js | Teacher My Games list, add/edit/preview/publish/unpublish/archive UI. |

### 13.14 Student dashboard and pages

| File | Responsibility |
|---|---|
| frontend/src/pages/student/StudentDashboard.js | Student shell and nested routes for dashboard, profile, subjects, games, attendance and complaint. |
| frontend/src/pages/student/StudentSideBar.js | Student navigation and active route styling. |
| frontend/src/pages/student/StudentHomePage.js | Student home/dashboard. |
| frontend/src/pages/student/StudentProfile.js | Student profile view. |
| frontend/src/pages/student/StudentSubjects.js | Student subject list/view. |
| frontend/src/pages/student/ViewStdAttendance.js | Student attendance display. |
| frontend/src/pages/student/StudentComplain.js | Student complaint page. |
| frontend/src/pages/student/StudentGameZone.js | Published-only game list, search, subject filter, details dialog, refresh and Wordwall playback. |

### 13.15 Redux store, slices and async handlers

| File | Responsibility |
|---|---|
| frontend/src/redux/store.js | Combines user, student, teacher, notice, complain and sclass reducers. |
| frontend/src/redux/userRelated/userSlice.js | Auth/session/user collection state, restore/login/logout reducers and safe profile UI storage. |
| frontend/src/redux/userRelated/userHandle.js | Async restoreSession/login/register/logout and legacy shared user operations. |
| frontend/src/redux/studentRelated/studentSlice.js | Student list, loading/error/response state. |
| frontend/src/redux/studentRelated/studentHandle.js | Student list, update and removal async operations. |
| frontend/src/redux/teacherRelated/teacherSlice.js | Teacher list/detail/loading/error state. |
| frontend/src/redux/teacherRelated/teacherHandle.js | Teacher list/detail load and subject-assignment update. |
| frontend/src/redux/noticeRelated/noticeSlice.js | Notice list/loading/error state. |
| frontend/src/redux/noticeRelated/noticeHandle.js | Fetches notice lists and dispatches the Notice slice. |
| frontend/src/redux/complainRelated/complainSlice.js | Complaint list/loading/error state. |
| frontend/src/redux/complainRelated/complainHandle.js | Fetches complaint lists and dispatches the Complaint slice. |
| frontend/src/redux/sclassRelated/sclassSlice.js | Class list, class students, Class details, Subject list/detail and loading/error state. |
| frontend/src/redux/sclassRelated/sclassHandle.js | Fetches Classes/Students/Subjects and details; dispatches related slice updates. |
| frontend/src/utils/apiClient.js | Feature Axios instance with configured base URL and withCredentials. |
| frontend/src/utils/wordwallUrl.js | Frontend Wordwall validation, URL normalization, snippet extraction and entity ID helper. |

### 13.16 Frontend tests

| File | Responsibility / coverage |
|---|---|
| frontend/src/utils/apiClient.test.js | Feature API base URL and credential behavior. |
| frontend/src/utils/wordwallUrl.test.js | Frontend URL allowlist and iframe snippet parsing. |
| frontend/src/redux/userRelated/userHandle.test.js | Redux async auth/session handler behavior. |
| frontend/src/pages/admin/SideBar.test.js | Admin navigation rendering and active states. |
| frontend/src/pages/admin/AdminLearningGames.test.js | Admin Games UI list/filter/actions/state handling. |
| frontend/src/pages/teacher/TeacherSideBar.test.js | Teacher navigation and active route behavior. |
| frontend/src/pages/teacher/TeacherGameZone.test.js | Teacher Game Zone user flows and API behavior. |
| frontend/src/pages/student/StudentGameZone.test.js | Student games search/filter, playback, refresh, empty and error states. |

### 13.17 Static assets

| File family | Responsibility |
|---|---|
| frontend/src/assets/assignment.svg | Assignment illustration/icon asset. |
| frontend/src/assets/backg.jpg | Background image asset. |
| frontend/src/assets/classroom.png | Classroom visual asset. |
| frontend/src/assets/designlogin.jpg | Background image imported by LoginPage. |
| frontend/src/assets/h.svg | SVG illustration/asset. |
| frontend/src/assets/img1.png | Existing UI image asset. |
| frontend/src/assets/img2.png | Existing UI image asset. |
| frontend/src/assets/img3.png | Existing UI image asset. |
| frontend/src/assets/img4.png | Existing UI image asset. |
| frontend/src/assets/students.png | Student-related visual asset. |
| frontend/src/assets/subjects.svg | Subject visual asset. |
| frontend/src/assets/time.svg | Time/attendance visual asset. |

Assets are presentation resources. They do not enforce permissions or implement domain operations.

---

## 14. Testing and current verification evidence

### 14.1 Backend test environment

From the backend folder:

~~~powershell
npm test
~~~

The backend npm script runs Node's built-in test runner across tests/*.test.js after preloading tests/test-env.js. The preload sets NODE_ENV=test, a dedicated local school_management_test URI, a test-only session secret and local frontend origin. The current unit tests primarily use dependency-injected model doubles and do not connect to MongoDB.

Seed commands are independent:
- seed:chemamaze:validate checks the static manifest without MongoDB.
- seed:chemamaze:dry-run resolves a development database/mapping and creates a read-only plan.
- seed:chemamaze:apply writes only after the development guards and explicit confirmation succeed.

### 14.2 Frontend tests/build

From frontend:

~~~powershell
npm test -- --watchAll=false
npm run build
~~~

A passing unit suite does not by itself prove that a live Wordwall page loads, that fullscreen works, or that deployed cookie/CORS settings are correct.

### 14.3 Validation output supplied by the repository owner on 21 November 2026

| Check | Reported result | What can be concluded |
|---|---:|---|
| Backend suite before the new demo-seed tests were added | 231 passed, 0 failed | User-confirmed pass for the then-current 231-test suite; rerun after the four new demo-seed tests. |
| ChemAmaze static catalogue validation | `catalog-valid`, 18 records | User-confirmed valid pinned manifest with three records in each of the six Class 6–8 / Science-Mathematics groups. This is validate-only and does not connect to MongoDB. |
| Frontend suite | 43 passed, 2 failed in the earlier supplied run | Two test-only corrections have since been committed; a fresh full frontend run is still required. |
| Frontend production build | Output not supplied | Unknown; do not mark successful. |
| Local demo database seed/import | Not run/supplied | No 18-game MongoDB import is confirmed. |
| Student browser acceptance | Not supplied | Phase 14 remains open. |

**Backend and catalogue evidence**

The user's latest terminal output confirms that the duplicate source-key fixture was corrected: the suite reported 231 passing tests and no failures. The static validator separately reported `catalog-valid` for the 18 canonical records. The subsequent addition of four `chemamazeDemoSeed.test.js` cases happened after that run, so a fresh `npm test` is required before treating the current backend tree as green.

**Frontend test corrections**

The earlier 43-pass/2-fail output showed:
- The combined filter fixture inherited the description “Practise equivalent fractions” from the Maths activity even though the Solar System result was a Science activity. The test now supplies a non-matching description so the expected no-results state is valid.
- The refresh test checked that the MUI dialog button had disappeared immediately, before its exit transition completed. It now waits for the specific button node to be removed while keeping the iframe-removal assertion immediate.

These are test-only changes; `StudentGameZone.js` was not changed. The complete frontend suite and production build still need a fresh local run.

**Phase 15 database-seed distinction**

`npm run seed:chemamaze:validate` only validates the checked-in JSON manifest. It does not make MongoDB records. A new recommended `npm run seed` command now creates/reuses the fictional local demo school structure and applies the 18 canonical activities as drafts in `school_management_dev`. That new command and its four new unit tests were not part of the user's supplied terminal run. Do not claim they have passed or that the database has been seeded until the user runs them locally.

The GitHub source edits did not connect to MongoDB or write any database records.

### 14.4 Recommended validation sequence

1. Pull the latest `feature/learning-game-zones` branch and check `git status` so local work is not overwritten.
2. From `backend/`, run `npm test` to include the new demo-seed tests, then `npm run seed:chemamaze:validate`.
3. Ensure local MongoDB is running on loopback, then run `npm run seed`. The script defaults to `school_management_dev`, ignores the application's normal `MONGO_URL`, and refuses remote/non-development targets.
4. Review the seed summary. On a clean first run expect 18 inserted games and no failures; run it again and expect 18 unchanged games and no duplicate inserts. Check that demo structure counts are created on first run and reused on the second.
5. Run the complete frontend test suite and production build; capture output and exit codes.
6. Browser-test Admin and Teacher access, publish one appropriate draft through the Teacher account, then verify the corresponding demo Student sees only that published game. Check subject filter/clear, refresh, dialog close, real Wordwall load, fullscreen and external fallback.
7. Use the older manual target mapping/dry-run/apply flow only when intentionally importing to a different already-existing development school. It is not required for the fictional local demo school.
8. Obtain Science educator approval for Phase 16 taxonomy.
9. Only after the Phase 14 browser, Phase 15 seed/validation, and Phase 16 educator-approval gates pass should Phase 17 begin.

---

## 15. Design risks and invariants to preserve

| Area | Current implementation/observation | Engineering rule |
|---|---|---|
| Tenant isolation | Auth, role and scope middleware; feature controllers re-resolve persisted assignments. | Every new API needs cross-school and changed-assignment tests. |
| Frontend role state | Redux/localStorage stores display profile. | Never trust it for authorization. |
| Session revocation | Signed stateless cookie; no revocation list. | Evaluate whether short TTL is sufficient or add a revocation/version mechanism. |
| CSRF | SameSite cookie and credential-aware CORS exist. | Assess deployed Origin/CSRF posture explicitly. |
| Admin bootstrap | AdminReg is public. | Gate/disable public registration after initial provisioning. |
| Guest mode | Demo credentials are hard-coded in frontend. | Remove or disable for production. |
| Password migration | Legacy plaintext Admin compatibility remains. | Retire after verified migration and backups. |
| Rate limiting | No rate limiter in inspected stack. | Add for login and future AI endpoints before public pilot. |
| DB readiness | Server starts listening even when initial DB connection fails. | Add health/readiness/reconnect controls for deployment. |
| Legacy API contract | Some older controller responses are inconsistent. | Keep new feature APIs on the stable code/message/requestId contract. |
| Wordwall URL | Strict allowlist on backend and frontend; schema and renderer recheck. | Preserve both server and client validation. |
| Iframe sandbox | Not currently set. | Real-browser compatibility/security decision required; do not change casually. |
| Original share URL | Kept separate from embed URL; normal Teacher field only gets type/length validation. | Use only validated embedUrl for iframe; validate any external share link before opening it. |
| Game lifecycle | State transitions are conditional; related resource changes archive activities. | Never bypass lifecycle service; consider transaction/repair policy. |
| Wordwall telemetry | Cross-origin iframe content is opaque. | Never infer answers/score/mastery from launch or iframe interactions. |
| Import safety | Dev DB/name/host/token checks and idempotent conflict behavior. | Never run against production; inspect full dry-run first. |
| Quiz versions | Numeric quiz version exists; new quiz begins at 1; no full immutable edit/history workflow. | Introduce immutable question versions before long-term attempt analytics. |
| Attempt number | countDocuments + 1 is not an atomic sequence. | Harden if concurrent exact ordering is required. |
| Concept mapping | Current question concept field is free text. | Phase 17 must enforce stable conceptId and taxonomy version deliberately. |
| Curriculum rights | NCERT content excluded pending permission; GNCT PDF citation metadata only. | Maintain auditable source-use decisions; no unclear-rights ingestion. |
| Learner privacy | Student records contain personal data and may concern minors. | Minimize event fields/logs and define retention, consent and deletion before pilot. |
| ML validity | No BKT/recommender/RAG is implemented. | Evaluate against baselines and report uncertainty before model claims. |
| Fee collection | Frontend page exists, backend payment model/API not seen in inspected tree. | Do not claim an integrated payment workflow without backend/provider evidence. |

---

## 16. Interview preparation

### 16.1 A truthful 60–90 second explanation

“I extended an existing MERN school-management platform rather than creating a separate student account system. The existing Admin, Teacher, Student, school, class and subject records remain authoritative. I added a school-scoped Games Zone: Teachers create Wordwall activities as drafts, publish them to their assigned class/subject, and Students see only published games belonging to their own class. Admins can inspect and moderate the school's catalogue. I validate Wordwall links on both server and client, extract only the src from a single allowed iframe snippet, and render a fixed iframe instead of trusting pasted HTML.

I also implemented a pinned ChemAmaze seed manifest and a development-only importer with source provenance, assignment validation, dry-run, explicit write confirmation, idempotency and conflict detection. Separately, the backend contains first-party MCQ quiz endpoints that grade answers on the server and persist versioned attempts. The Student quiz UI, stable concept-question mapping, BKT, recommendations and grounded AI are later phases, not features I claim are live today.”

### 16.2 Why separate Wordwall and first-party quiz assessment?

Wordwall runs on another origin. Browser same-origin isolation prevents this app from reliably reading the external activity's internal answer state. A launch only proves the user opened the link. A first-party quiz is owned by this API: the server stores the questions and correct answer key, verifies submitted option IDs and calculates correctness. That creates a reliable first-party LearningAttempt event. Treating a Wordwall launch as a quiz result would create false educational evidence.

### 16.3 Why a separate GameActivity collection?

A game has its own lifecycle, provider URL, school/class/subject/Teacher scope, publication state, moderation metadata, indexes and legacy provenance. A dedicated collection avoids growing Class or Subject documents with unbounded game arrays and supports independent query/index/lifecycle behavior.

### 16.4 Why validate the URL at multiple layers?

Client validation improves immediate form feedback but can be bypassed. The server is authoritative before persistence. Mongoose validation checks the stored document, and the browser component validates before rendering the iframe. These layers protect user input, persisted state and runtime rendering respectively.

### 16.5 Why extract iframe src rather than save HTML?

Teacher-provided markup must not be turned into executable DOM. The parser accepts one strict iframe shape and extracts one quoted src, dropping all other attributes/markup. The server validates the URL and React constructs fixed markup. This reduces arbitrary HTML/script and arbitrary-origin iframe injection risk.

### 16.6 How does the app prevent a Teacher changing school ID in the request?

The signed HttpOnly cookie establishes the session. The backend reloads the account and current assignments from MongoDB and derives the school/class/subject from persisted values. A client-supplied ID only selects a target resource and must pass the authorization-scope middleware/controller checks. Redux/localStorage is never the source of authority.

### 16.7 How does ChemAmaze import avoid damaging existing records?

Each legacy row has a deterministic source key. The partial unique index protects one key per school. The dry-run resolves all target assignments and compares existing data. Identical rows are skipped; changed content or scope is reported as a conflict; the importer does not overwrite existing records. Apply requires development environment, exact database name, allowed host and explicit token. New rows are drafts.

### 16.8 What is BKT and where would it fit?

Bayesian Knowledge Tracing estimates the probability of mastery of a particular concept from a sequence of first-party correct/incorrect attempts. It models prior knowledge, learning transition, guess and slip probabilities. After each observation it updates the learner's mastery probability. It is interpretable but relies on assumptions; it needs hand-tested formulas, calibration and baseline comparisons. It should not be described as a definitive grade or diagnosis.

### 16.9 What is RAG and what makes it grounded?

Retrieval-Augmented Generation first retrieves relevant passages from a permission-cleared, versioned corpus, then asks a model to explain using that evidence. A reliable implementation needs source rights checks, provenance/page anchors, retrieval evaluation, citations, factuality tests, rate limits and fallback behavior. The LLM's words alone are not evidence. The current branch does not yet implement RAG.

### 16.10 How to answer questions about testing

State the actual evidence:
- owner-provided backend run on 21 November 2026: 231 passed, 0 failed;
- owner-provided `npm run seed:chemamaze:validate` result: `catalog-valid`, 18 canonical records, three records in each of the six Class 6–8 / Science-Mathematics groups;
- a prior owner-provided frontend run reported 43 passed, 2 failed. Test-only corrections for the two StudentGameZone failures have since been committed, but a fresh full frontend run and production build have not yet been supplied;
- the previous backend failure was a duplicate source-key test fixture that changed only the deterministic key; the fixture was corrected to clone a complete valid record;
- the two frontend test corrections address the inherited search-term match in the Solar System fixture and the Material UI dialog exit-transition timing;
- the one-command local demo bootstrap `npm run seed` has now been added, but it has not been run against the user's MongoDB; no database import result is claimed;
- Phase 13 was previously user-confirmed good;
- Phase 14 browser/build checks remain to be confirmed;
- Phase 15 catalogue validation and backend suite are user-confirmed pass; the actual local demo seed/import and Student browser review remain pending;
- Phase 16 educator approval remains pending.

Never claim “all tests pass”, “AI tutor is complete”, “BKT improves learning” or “the seed migration is finished” without the evidence.

### 16.11 Portfolio evidence to collect

- architecture explanation using the diagrams in this file;
- branch and commit history;
- green backend/frontend test output after correcting the outstanding failures;
- successful production build output;
- malicious/lookalike Wordwall URL rejection tests;
- browser recording: Teacher create/draft/publish, Student published-only playback, Admin school-scoped moderation;
- importer dry-run/apply summaries with IDs redacted;
- educator review/approval record;
- future first-party quiz end-to-end run;
- BKT, recommendation and retrieval metrics only after real evaluation.

---

## 17. Developer workflow and operating commands

### 17.1 Switch and update the feature branch

From repository root in Windows PowerShell:

~~~powershell
git switch feature/learning-game-zones
git pull --ff-only origin feature/learning-game-zones
git status
~~~

Do not force-push or overwrite unrelated local changes. Check git status before making edits.

### 17.2 Run the app locally

Backend terminal:

~~~powershell
cd backend
npm install
npm start
~~~

Frontend terminal:

~~~powershell
cd frontend
npm install
npm start
~~~

Frontend REACT_APP_BASE_URL points to the backend API. Backend environment includes MONGO_URL, PORT, FRONTEND_URLS, AUTH_SESSION_SECRET, AUTH_SESSION_TTL_SECONDS and cookie settings. Use a separate development database and local-only secrets.

### 17.3 Tests, seed validation and frontend build

~~~powershell
cd backend
npm test
npm run seed:chemamaze:validate

# Optional: create/reuse the fictional local Phase 15 demo school and import 18 drafts.
# This uses school_management_dev on localhost, separate from the normal MONGO_URL.
npm run seed

cd ..\frontend
npm test -- --watchAll=false
npm run build
~~~

Capture actual output and exit code for each command. A command appearing in a terminal history does not prove it completed successfully.

The recommended Phase 15 demo shortcut is `npm run seed` from `backend/`. It creates/reuses a fictional ChemAmaze Demo School, three classes, six subjects, six Teacher accounts and three Student accounts, then imports the 18 canonical Wordwall activities as drafts. It uses `CHEMAMAZE_DEMO_MONGO_URL` if explicitly supplied, otherwise defaults to `mongodb://127.0.0.1:27017/school_management_dev`; it does not use the normal application `MONGO_URL`. It refuses non-development and non-loopback targets. See `backend/LEGACY_GAME_IMPORT.md` for demo login details and the optional manual mapping workflow for an alternate development school.

### 17.4 Phase-by-phase engineering discipline

For each future phase:
1. Read this guide, PROJECT_HANDOFF.md and the harness.
2. Inspect current source before changing it.
3. Define the smallest set of files and behaviors required.
4. Preserve unrelated school-management code.
5. Add tests for success, invalid input, forbidden access, conflict and failure paths.
6. Run the full relevant test suites.
7. Review the complete branch diff for unintended changes and accidental secrets/IDs.
8. Update PROJECT_HANDOFF.md and this guide when architecture or behavior materially changes.
9. Mark the phase complete only when its exit gate is supported by actual evidence.

