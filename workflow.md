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

~~~mermaid
flowchart TB
    subgraph Browser["Browser — React 18"]
      Pages["Public pages and role dashboards"]
      Router["React Router"]
      State["Redux Toolkit state"]
      Feature["Admin / Teacher / Student Games pages"]
      QuizUI["Future Student quiz and Teacher authoring UI"]
      Pages --> Router
      Pages <--> State
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
    Curriculum["Future rights-cleared curriculum"]
    ML["Future BKT / retrieval / AI adapters"]

    Browser -- "HTTPS / JSON + HttpOnly cookie" --> CORS
    Model <--> DB
    Feature -- "validated embed URL" --> Wordwall
    Legacy --> "development-only importer" --> DB
    Curriculum -. planned .-> ML
    ML -. planned .-> Service
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

The target mapping needs an existing Admin school, Class 6/7/8, Science and Mathematics Subjects, and a Teacher for each of these six assignments:
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

## 11. Future roadmap: Phases 17–30 in implementation order

Everything in this section is **planned** unless explicitly called out as an existing foundation. New file paths should be decided after inspecting current conventions at the relevant phase; do not create unused placeholder modules early.

### Phase 17 — First-party question bank and quiz schema

**Objective:** connect teacher-reviewed question content to the approved concept taxonomy with stable identifiers and safe answer-key handling.

Planned workflow:
1. Obtain educator approval of the Phase 16 taxonomy/version.
2. Define the supported first question types and difficulty meaning.
3. Add stable conceptId and taxonomy version to questions.
4. Define question/question-version persistence and content lifecycle.
5. Store prompt/options separately from the server-only answer key.
6. Preserve source/provenance, author, reviewer and review status.
7. Make published question versions immutable or preserve full edit history.
8. Add schema checks for option IDs, answer membership, concept references, duplicate question IDs/prompts and source attribution.
9. Create a small original teacher-reviewed seed set; do not copy rights-restricted textbook questions.
10. Update quiz submission deliberately so a historical attempt continues to refer to the question version it actually saw.

Invariants:
- student fetch payloads never disclose answer keys;
- every conceptId resolves in a named taxonomy version;
- pending/rejected/generated candidates cannot be served as published content;
- old attempt history cannot silently change when question content is edited.

Exit evidence: schema and seed tests, invalid concept-reference tests, immutable version behavior and explicit proof of answer-key omission in Student fetch.

### Phase 18 — First-party quiz UI and API integration

**Objective:** expose the existing backend quiz foundation to Teachers and Students through native React screens.

Teacher workflow:
1. Open Learning Studio/quiz authoring.
2. Load assigned school/class/subject from persisted Teacher profile.
3. Choose an approved topic/concept.
4. Create a quiz draft and add questions from the reviewed question bank or author them.
5. Preview the Student-safe projection.
6. Publish only after server validation and review requirements.

Student workflow:
1. Open Learning Studio.
2. Fetch only published quizzes for their school/class/subject.
3. Start a fixed quiz version.
4. Answer in the native UI.
5. Submit question/option IDs with an idempotency key.
6. Receive server-derived feedback.
7. Handle retry, empty list, network error and keyboard/mobile interaction.

Reuse the existing create/list/publish/submit controllers; do not duplicate correctness logic in React and do not use Wordwall iframe state as an answer. Exit evidence is a complete Teacher-create/publish to Student-attempt workflow with server-verified grading.

### Phase 19 — Attempt events and data quality

**Objective:** make attempt evidence reproducible and suitable for downstream analytics.

Existing foundation: LearningAttempt schema/controller already store quiz version, answer selections, server correctness, timestamps, idempotency and score.

Planned improvements:
- add conceptId and taxonomy version to attempt responses;
- decide whether a quiz submission or each question response is the canonical event;
- define learner identifier minimization, retention and deletion rules;
- deduplicate retries and define conflicting payload behavior;
- address attemptNumber concurrency;
- build replay and data-quality checks;
- define treatment of omitted answers, abandoned quizzes and repeat attempts;
- exclude Student names and unnecessary PII from analytics logs.

Exit evidence: event replay, idempotency tests, data-quality report and cross-learner scope tests.

### Phase 20 — Baseline analytics and evaluation protocol

**Objective:** define measurable outcomes and establish simple baselines before ML.

Workflow:
1. Define a prediction target and observation window.
2. Report descriptive quiz/attempt patterns by approved concept.
3. Create a synthetic event simulator for engineering tests; label synthetic data explicitly.
4. Define learner/time-based train/validation/test splits to prevent leakage.
5. Establish simple baselines such as global correctness rate, majority class, fixed ordering or simple revision heuristics as appropriate.
6. Select metrics and sample-size thresholds before fitting a model.
7. Record confidence intervals and known limitations.

Exit evidence: repeatable report, data dictionary, evaluation split plan and baseline metrics. Synthetic data must never be presented as measured Student outcomes.

### Phase 21 — Bayesian Knowledge Tracing (BKT)

**Objective:** implement an interpretable concept-level mastery estimate from first-party correct/incorrect responses.

The planned BKT parameters:
- P(L0): prior probability that a learner already knows a skill;
- P(T): probability of learning the skill after an opportunity;
- P(G): probability of guessing correctly while not knowing;
- P(S): probability of answering incorrectly despite knowing.

For mastery probability L:

After a correct response:

P(L | correct) = [L × (1 − P(S))] / [L × (1 − P(S)) + (1 − L) × P(G)]

After an incorrect response:

P(L | incorrect) = [L × P(S)] / [L × P(S) + (1 − L) × (1 − P(G))]

Learning transition:

P(L_next) = P(L | observation) + [1 − P(L | observation)] × P(T)

Implementation plan:
1. create a pure, independent Python update function;
2. test correct/incorrect cases with hand-calculated examples;
3. test edge probabilities and ensure values remain between 0 and 1;
4. version parameters/model assumptions;
5. evaluate calibration and next-response prediction against baselines;
6. keep it offline until the assumptions and event quality are reviewed.

BKT is an estimate, not an exam grade, clinical diagnosis or definitive label of a learner.

### Phase 22 — Mastery persistence and service integration

**Objective:** persist reproducible concept mastery with model metadata.

Expected record fields include learner reference, concept ID, taxonomy version, mastery probability, model/parameter version, observation count and last update time. Store only identifiers necessary for the feature.

Processing:
1. receive a validated first-party event;
2. read current concept state;
3. apply the versioned BKT update;
4. persist updated state and provenance;
5. support rebuild/replay from original events;
6. isolate model-service failure from quiz submission using timeout/fallback;
7. restrict mastery reads to the learner and explicitly authorized staff.

Exit evidence: deterministic event replay, model metadata, fallback behavior and cross-learner access-denial tests.

### Phase 23 — Explainable adaptive recommendation policy

**Objective:** select the next appropriate published first-party practice item.

Candidate logic may consider:
- published status;
- school/class/subject scope;
- learner's current mastery estimate;
- prerequisite graph;
- revision priority and spacing;
- question difficulty;
- recent attempts and repeat suppression.

Record the selected item, policy/model version and a human-readable explanation. Compare against fixed order, random and simple low-mastery heuristics. Do not claim learning improvement without measured outcomes.

### Phase 24 — Misconception diagnostics

**Objective:** begin with educator-reviewed rules and only explore classification if the data justifies it.

Workflow:
1. create an educator-reviewed misconception taxonomy;
2. map specific distractors/answer sequences to tentative hypotheses;
3. validate rules on a reviewed sample;
4. measure precision, recall, F1 and class-wise errors;
5. evaluate label reliability and sample sizes;
6. only add a classifier if allowed representative educator-labelled examples exist and it beats a baseline.

Student-facing wording must describe a possible misconception, not label the learner or state a diagnosis. If evidence is insufficient, keep the rules or document a no-go decision.

### Phase 25 — Approved curriculum ingestion and retrieval evaluation

**Objective:** build a rights-controlled, traceable source corpus.

Pipeline:
1. source registry records owner/title/version/license/permission/use restrictions;
2. validate permission before download or processing;
3. parse only approved formats;
4. extract text with page/section anchors and checksums;
5. chunk content while preserving context;
6. attach grade/subject/chapter/concept metadata;
7. retain source/version ID for each chunk;
8. introduce embeddings and a retrieval adapter only when justified;
9. create manually judged retrieval queries;
10. evaluate Recall@k or an appropriate metric, latency and cost.

NCERT textbook content remains excluded unless written permission is obtained and recorded. Public accessibility does not equal permission for ingestion, repackaging or software distribution.

### Phase 26 — Grounded learning assistant

**Objective:** explain a concept using retrieved approved source evidence.

Request flow:
1. authenticate Student and resolve their scope;
2. rate-limit and bound request length;
3. identify grade/subject/concept scope;
4. retrieve approved versioned passages;
5. pass only relevant evidence to the model;
6. generate a short age-appropriate explanation;
7. validate structured response and citations;
8. show references and fallback if model/retrieval is unavailable;
9. retain minimal operational logs.

Guardrails: LLM output is not the source of truth; citations must point to available evidence; unsupported chemistry claims and unsafe experiment advice are not allowed; uncertainty must be visible; there must be a non-LLM fallback.

### Phase 27 — AI-generated question candidates

**Objective:** generate structured drafts, never auto-published Student content.

Candidate metadata should include provider/model version, prompt-template version, taxonomy/concept IDs, source evidence IDs, structured question/options/key/explanation, validation findings, similarity check and generated timestamp.

Validation must catch malformed shape, answer-option mismatch, unsupported claims, wrong grade/topic, duplicate similarity and source-scope drift. Provider failures must not create partial or student-visible records. Model-generated answer keys need review.

### Phase 28 — Teacher content review and publishing

**Objective:** make Educators the authority for AI-generated questions.

Review UI should display the draft question, options, proposed correct answer, explanation, concept mapping, grade, evidence passages, warnings, model/prompt version and status. Teacher can edit, reject or approve. Publishing must create an immutable version/audit trail. Only authorized reviewers for the relevant school/class/subject may publish. Unreviewed/rejected items must not appear in Student APIs.

### Phase 29 — Teacher insights, evaluation and pilot readiness

**Objective:** present safe aggregate learning evidence and establish a readiness gate.

Teacher insights may include concept-level difficulty and aggregate misconception patterns. Apply minimum-group privacy safeguards so a small group cannot expose an individual learner's response history.

Evaluate independently:
- BKT calibration and next-response prediction;
- recommendation performance versus baselines;
- retrieval quality and source coverage;
- generated-question validity/factuality/review acceptance;
- quiz correctness and operational reliability.

Before a real Student pilot, retest access isolation, session expiry, cookie/CORS/CSRF posture, answer-key leakage, rate limiting, content rights, source provenance, privacy, audit trails, retention/deletion, logs, backups and recovery. No unsupported educational improvement claims.

### Phase 30 — Deployment, documentation and portfolio evidence

**Objective:** make the system reproducible and explainable to another developer or interviewer.

Expected outputs:
- Windows setup and deployment guides;
- environment and migration/seed instructions;
- role/scope matrix and API contracts;
- architecture/domain/data-flow diagrams;
- data dictionary and model assumptions;
- tests and actual test outputs;
- privacy/security/source-rights policies;
- retrieval and ML evaluation reports;
- troubleshooting, backup and recovery procedures;
- a demo walkthrough backed by real feature behavior;
- an accurate portfolio explanation separating original school-management code, imported ChemAmaze catalogue metadata and new AI/ML additions.

---

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
| backend/scripts/import-chemamaze-games.js | CLI entry point; validates flags, environment/database, target mapping, dry-run plan and explicit apply mode. |
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
| Backend | 230 passed, 1 failed, 231 total | One test currently fails; suite is not fully green. |
| Frontend | 43 passed, 2 failed, 45 total | Two StudentGameZone tests currently fail; suite is not fully green. |
| Seed catalog validation | Output not present in the supplied excerpt | Unknown; do not mark successful from this evidence. |
| Frontend production build | Output not present in supplied excerpt | Unknown; do not mark successful from this evidence. |
| Development dry-run/apply | No output supplied | Database import not confirmed. |

**Backend failing test — duplicate legacy source key**

The test in backend/tests/legacyGameCatalog.test.js named “rejects a duplicate source key and an incomplete catalog” mutates the second record's sourceKey to the first record's key. The validator first checks that each record's key deterministically matches its own subject, grade and chapter. Therefore the second row throws a deterministic-key TypeError before the duplicate-key Set check is reached. The assertion expects “Duplicate legacy sourceKey” but receives the earlier deterministic-key message.

This output indicates a test-fixture/assertion-order mismatch; it does not prove the checked-in manifest contains duplicate keys. To test duplicate detection specifically, build a fixture where the second row still passes its deterministic identity fields while duplicating the first key, and keep its other unique fields valid. Alternatively, test deterministic-key rejection separately and expect that earlier error.

**Frontend failing test — combined search and subject filter**

The failing test expects the no-results message after selecting Science and searching “fractions”, but Solar System Quiz remains displayed. The current component filters by selected subject ID and a lower-cased search over title, description, topic, subject name and class. The supplied test output suggests the subject event was applied while the search interaction did not produce the intended controlled input state. Inspect the test helper/event/act sequence and reproduce the filter in a browser before changing the component's business logic. A userEvent or fireEvent.change helper with independently awaited React act blocks may be more reliable than a manually dispatched input event.

**Frontend failing test — dialog closing after refresh**

The supplied output showed the game card and iframe had disappeared after refresh, but the “Close game” button text remained in the DOM at the immediate assertion. The component clears selectedActivity when the refreshed published list no longer contains its ID. Material UI Dialog can retain its DOM during its exit transition. The test should wait for the dialog control to be removed or disable transitions in that test fixture; do not weaken the requirement that a removed activity is no longer playable.

No seed validation or build output was included in the supplied excerpt. Do not claim those commands passed until their actual result is recorded. The test counts above are user-provided execution output, not tests independently run while authoring this guide.

### 14.4 Recommended validation sequence

1. Fix the duplicate source-key test fixture/assertion to reach the intended validator branch.
2. Fix the StudentGameZone search interaction test without weakening the actual filtering behavior.
3. Await the Material UI dialog exit transition in the refresh test.
4. Rerun backend and frontend test suites.
5. Capture the actual production build output and exit code.
6. Capture seed:chemamaze:validate JSON output.
7. Prepare a dedicated development database and local mapping only after confirming all school/class/subject/Teacher records exist.
8. Run and review the dry-run. Do not apply if the database or mappings are uncertain.
9. Browser-test Student scope, published-only list, search/filter/clear, refresh, dialog, live embed, fullscreen and fallback.
10. Obtain Science educator approval for Phase 16 taxonomy.
11. Only then pass the Phase 14–16 gates and begin Phase 17.

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
- owner-provided backend run on 21 November 2026: 230 passed, 1 failed;
- owner-provided frontend run: 43 passed, 2 failed;
- backend failure: duplicate source-key test mutates the deterministic key, causing the earlier deterministic-key validation error;
- frontend failures: combined search/filter interaction test and immediate DOM assertion during Material UI dialog exit;
- supplied excerpt did not show seed validation or production build result;
- no development import result was supplied;
- Phase 13 was previously user-confirmed good;
- Phase 14 browser/build checks remain to be confirmed;
- Phase 15 validation/dry-run/apply remain to be confirmed;
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

cd ..\frontend
npm test -- --watchAll=false
npm run build
~~~

Capture actual output and exit code for each command. A command appearing in a terminal history does not prove it completed successfully.

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

