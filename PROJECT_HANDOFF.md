# Project Handoff — MERN School Management + AI Learning & Games

Last updated: 2026-11-08 (Asia/Kolkata)

## Repository
- Repository: Ayush-Kant/MERN-School-Management-System-main
- Branch: feature/learning-game-zones
- Last verified application-code checkpoint before Phase 10: `b79bd513215b4fedce9d5e3ca00d58473cfa8239`.
- Handoff tracking file initially added in documentation-only commit: `585a3ee367f2b95e68d7fac3fb368fdcc3a56091` (this commit adds only `PROJECT_HANDOFF.md`; it does not change application code).
- Phase plan: AI_LEARNING_GAMES_IMPLEMENTATION_HARNESS.md
- Phase 08 design: AI_LEARNING_MODULE_DESIGN.md
- Phase 09 invariants: backend/GAME_ACTIVITY_INVARIANTS.md
- Latest Phase 10 code checkpoint: `b79bd513215b4fedce9d5e3ca00d58473cfa8239`.
- Latest Phase 11 application-code checkpoint before the test-only Jest correction: `3328d8946a6561e10d10303280d147b19d124bab`.
- Latest verified feature branch head after the Phase 12 handoff update: `9b4f11186602107040f63223be7906c7ad4c560a`.

## Architecture decisions
The MERN School Management System remains the host application. Preserve the legacy ChemAmaze-cbse repository as source/reference. Build two separate experiences: (1) school-scoped teacher-managed Wordwall Games Zone and (2) first-party AI Learning Studio with server-graded quizzes, learning attempts, mastery estimates, adaptive revision, curriculum-grounded explanations, and teacher-reviewed generated questions. Existing Admin/Teacher/Student and school/class/subject records remain authoritative.

Enforce authorization and school/class/subject scope on the backend. Never trust frontend role state or client-supplied school/teacher/student IDs. Do not infer Wordwall scores or correctness from an iframe. Validate allowed HTTPS Wordwall embed URLs; never render teacher-provided iframe HTML. Do not store unbounded game arrays in existing models. Use approved curriculum content and preserve provenance. Keep learner data minimal. Treat BKT as an interpretable estimate and evaluate it against baselines.

## Phase 10 — implementation details

### Objective from the harness
Accept only HTTPS Wordwall embed URLs from approved exact hosts and embed paths. Allow an official iframe snippet only by extracting its src and validating that URL. Render Wordwall embeds through fixed React markup with an external fallback link. Do not render teacher-provided HTML.

### Source findings before changes
- Backend already had `backend/utils/wordwallUrl.js` and the GameActivity schema/controller already used URL validation.
- Frontend already had `frontend/src/utils/wordwallUrl.js`.
- Teacher and Student Game Zone pages duplicated inline iframe markup.
- Therefore Phase 10 strengthened the existing helpers and introduced one shared component; it did not add a second parallel implementation or redesign the pages.

### Files changed
Added:
- `frontend/src/components/WordwallEmbed.js` — shared component validates the stored URL again before rendering a fixed iframe; displays an external “Open on Wordwall” link using the same validated URL.
- `frontend/src/utils/wordwallUrl.test.js` — frontend validation and snippet extraction tests.

Modified:
- `backend/utils/wordwallUrl.js` — exact host/path, HTTPS, credentials, port, fragment and malformed URL checks; extraction of exactly one quoted src from one standalone iframe snippet; normalization returns only the validated URL.
- `backend/controllers/game-activity-controller.js` — create handler now normalizes either a URL or an iframe snippet before persisting. It stores only the URL.
- `backend/tests/wordwallUrl.test.js` — expanded backend URL/snippet validation coverage.
- `backend/tests/gameActivityController.test.js` — verifies the controller extracts and stores only the validated src from a pasted iframe snippet.
- `frontend/src/utils/wordwallUrl.js` — matching client-side validation and normalization helpers.
- `frontend/src/pages/teacher/TeacherGameZone.js` — accepts either a URL or official iframe snippet; updates field guidance; reuses shared embed component for preview.
- `frontend/src/pages/student/StudentGameZone.js` — reuses the shared embed component for student playback.

### Validation behaviour implemented
- Allows only `https:`, exact hostnames `wordwall.net` and `www.wordwall.net`, standard HTTPS port, and a path matching `/embed/<activity-id>` (optional trailing slash).
- Retains legitimate URL query parameters; rejects fragments, credentials, custom ports, non-HTTPS schemes, lookalike hosts, non-embed paths, and empty/malformed activity paths.
- A snippet must be one standalone iframe element with exactly one quoted src attribute. It rejects missing/unquoted/duplicate src, extra surrounding markup, multiple iframes, and nested iframe content.
- HTML `&amp;` in the extracted src is normalized to `&`.
- The iframe's other attributes and all supplied markup are discarded. Only the validated src URL reaches the controller/model.
- The Mongoose model continues to validate the persisted URL itself; it does not accept/store an iframe snippet.
- The reusable component revalidates the persisted URL before rendering, uses a fixed iframe element with title, lazy loading, referrer policy and fullscreen permission, and always provides an external fallback link for valid URLs.
- A sandbox attribute has deliberately not been selected yet: Wordwall compatibility must be checked against a real approved embed before imposing iframe sandbox restrictions. Do not silently loosen a sandbox later; document the compatibility reason if a policy is introduced.

### Phase 10 commits
- `928e4d48d17d0c307bc401b137f646463c935d32` — backend URL/snippet normalizer.
- `8a3e569ebdc4452b9e966cd133239572da69457c` — backend controller normalization.
- `8c7972e3b822b4762a4907db5c5a0c8ca7e59146` — frontend URL/snippet normalizer.
- `605bf80f5d76a50cd98d6d3925b6e67efbb2dd87` — shared Wordwall embed component.
- `919ad3d26f9ff8bf32f3d09fe632b15cfc386dcb` — teacher form and preview integration.
- `c7638b54ecdaabc5a3a6624f7cfaac19013f0998` — student playback integration.
- `5fc925dff125764c20592efc75c72d15722d77ed` — controller snippet normalization test.
- `7241ebd200374cdabaf062df0a840e139db91707` — expanded backend URL tests.
- `3a787a0489110227cb63a471ad4bfbde2b89cead` — frontend URL tests.
- `83a41c6a849a50a3d7c5e78f33038041be9492b3` — additional malformed snippet coverage.
- `d5d5833b4c6d53b43d39ef4cc25be67623b9aaad` — tightened `src` attribute parsing so `data-src` cannot masquerade as `src`.
- `c98d5395cabd68e48c8c254b3b12611037921660` — matching frontend `src` attribute parsing fix.
- `f43e4de2bbaa9f476864795668a66226c02eb64b` — backend regression test for `data-src` rejection.
- `b79bd513215b4fedce9d5e3ca00d58473cfa8239` — frontend regression test for `data-src` rejection.

### Diff review
Compared against the branch checkpoint immediately before Phase 10 (`96088206b5f3c8cb4621e724ebf89c1fd3aa324f`). The Phase 10 diff contains exactly these 9 paths:
- `backend/controllers/game-activity-controller.js`
- `backend/tests/gameActivityController.test.js`
- `backend/tests/wordwallUrl.test.js`
- `backend/utils/wordwallUrl.js`
- `frontend/src/components/WordwallEmbed.js`
- `frontend/src/pages/student/StudentGameZone.js`
- `frontend/src/pages/teacher/TeacherGameZone.js`
- `frontend/src/utils/wordwallUrl.js`
- `frontend/src/utils/wordwallUrl.test.js`

No route URLs, role authorization rules, dashboard navigation, data model fields, dependencies, or unrelated school-management flows were changed in Phase 10.

### Verification status and immediate next action
- Phase 09 backend test suite: **user-confirmed pass** after the two documented fixes; exact count not supplied.
- Phase 10 backend tests: **user-confirmed pass on 2026-11-06**; exact count not supplied.
- Phase 10 frontend tests: **user-confirmed pass on 2026-11-06**; exact count not supplied.
- Phase 10 frontend production build: **user-confirmed pass on 2026-11-06**.
- Phase 10 real Wordwall embed/browser compatibility: **not yet confirmed**. The user confirmed the automated checks and build but did not explicitly confirm real-browser load/fullscreen/fallback behavior. Keep this as an outstanding manual verification; do not claim browser compatibility yet.
- Phase 11 implementation: code and tests have been committed to the feature branch. The remote diff was reviewed against the Phase 10 tracker checkpoint and contains exactly the 21 paths listed below.
- Phase 11 backend tests, frontend tests, and frontend build: **not yet run/confirmed by the user**. The GitHub connector cannot execute npm commands on the user's Windows environment.

Immediate next action: correct only the failing `frontend/src/utils/apiClient.test.js` import/reset ordering, rerun the frontend suite, and capture the production-build result. Backend tests and basic frontend/browser verification have now been reported successful by the user. Do not begin Phase 12 until the frontend suite and remaining Phase 11 exit checks are verified and the user asks to continue.

From repository root in Windows PowerShell:
```powershell
git pull --ff-only origin feature/learning-game-zones
cd backend
npm test
cd ..\frontend
npm test -- --watchAll=false
npm run build
```

After the automated checks, verify the real Wordwall embed in the actual browser (the Phase 10 manual gate remains open), and check the new GameActivity lifecycle endpoints and credential transport. Send the complete backend/frontend test output, build result, and browser/API observations. Fix only demonstrated failures.

## Phase 11 — role-scoped Game APIs

### Objective and source audit
The existing controller already implemented create/list/publish/archive with authenticated actor context and database-derived school/class/subject scope. Phase 11 extends this implementation instead of replacing it or duplicating the GameActivity service. Existing root-mounted endpoint names are preserved; the two new operations are additive.

### Implemented API behavior
- `POST /GameActivityCreate` — Teacher only; creates a draft using the current Teacher record's school, class, subject, and creator. Client-supplied identity is only an optional assertion; the authenticated actor and database assignment remain authoritative.
- `GET /GameActivityList/:id` — Teacher and Student; Teachers receive their own currently assigned-scope records; Students receive only published records for their database-derived school/class and an optional subject belonging to that class.
- `PUT /GameActivityUpdate/:id` — Teacher only; updates only the Teacher's own draft. Mutable fields are `title`, `description`, `topic`, `embedUrl`, and `originalUrl`. School, class, subject, creator, provider, and status cannot be changed through the update body. Wordwall embed input is normalized/validated before persistence.
- `PUT /GameActivityPublish/:id` — Teacher only; atomically transitions an owned draft to published and records `publishedAt`.
- `PUT /GameActivityUnpublish/:id` — Teacher only; atomically transitions an owned published activity back to draft and records `unpublishedAt`.
- `PUT /GameActivityArchive/:id` — Teacher only; atomically transitions an owned published activity to archived and records archive metadata.

All updates and transitions constrain the database write by activity ID, creator, current school, current class, current subject, and expected lifecycle status. A published activity must be unpublished before editing; archived activities are immutable through this API. Mongoose timestamps supply `updatedAt` for successful edits. Students cannot request draft/archived status or use a teacher identity filter. Role checks happen before controller actions; the controller re-resolves the actor's current persisted assignment.

### Credential and error-contract integration
- Added `frontend/src/utils/apiClient.js`, a shared Axios instance with the configured base URL and `withCredentials: true`.
- Migrated only the Teacher and Student Game Zone API calls to this client. Existing login/session/logout behavior and unrelated API pages were not refactored.
- Replaced message-only middleware errors with the existing `sendApiError` response helper in session authentication, role authorization, actor-context loading, and school-scope authorization. This preserves `message` and adds the documented stable `code` and optional `requestId`.
- Documented the new lifecycle endpoints and edit/state constraints in `backend/API_CONTRACT.md`.

### Phase 11 files changed
Backend:
- `backend/API_CONTRACT.md`
- `backend/controllers/game-activity-controller.js`
- `backend/middleware/authenticateSession.js`
- `backend/middleware/authorizeRoles.js`
- `backend/middleware/authorizeSchoolScope.js`
- `backend/middleware/loadActorContext.js`
- `backend/models/gameActivitySchema.js`
- `backend/routes/route.js`
- `backend/tests/actorContextMiddleware.test.js` (new)
- `backend/tests/authenticateSession.test.js`
- `backend/tests/authorizeRoles.test.js`
- `backend/tests/gameActivityController.test.js`
- `backend/tests/gameActivitySchema.test.js`
- `backend/tests/learningRouteAuthorization.test.js`
- `backend/tests/routeAuthorization.test.js`

Frontend:
- `frontend/src/pages/student/StudentGameZone.js`
- `frontend/src/pages/student/StudentGameZone.test.js`
- `frontend/src/pages/teacher/TeacherGameZone.js`
- `frontend/src/pages/teacher/TeacherGameZone.test.js`
- `frontend/src/utils/apiClient.js` (new)
- `frontend/src/utils/apiClient.test.js` (new)

### Phase 11 commits
API, controller, schema, route, and contract:
- `28be5852ecb3777c810daf513536190db0d9befa` — teacher-scoped update and unpublish handlers.
- `795499ba636dcfdc7599e2c591175d932c138c66` — unpublish timestamp field.
- `dc38b524e5d16cdf064999800e3833ded784a902` — role-protected update/unpublish routes.
- `134c3ef457d095b4bc86ed1f9aaba11321a01298` — lifecycle API contract documentation.

Middleware error contract:
- `cf57d0b64dc84c265165b4e80541c480f551c851` — session middleware errors.
- `5ee2136ddd35b73a789426c2603cbf3526e0d81b` — role middleware errors.
- `441a8886be9eb4a16bb33843e5dcc088789f71b3` — actor-context middleware errors.
- `d6a28ef954554702875d036e15aa3559ed54d104` — initial school-scope error standardization.
- `8556cdd3a5e3dde657204ad0a2e7c98ff7daddbd` — all remaining school-scope denial responses.

Tests:
- `b91c11c0ab01e146f8b3472de3d2a3f9805c2023` — session middleware standardized errors.
- `a1726a1176df1c83bfb3bdd1690fd9f7bb989753` — role middleware standardized errors.
- `164a87e43a3a46b120c648f0d79c485dc378fa54` — missing-role-claims error assertion.
- `d7ecb9be244e3783fcb01510246097757feb29b1` — GameActivity update/unpublish controller coverage.
- `f13c6d20fb6ed92b703fbc407cee37cd58cb0516` — unpublish timestamp default test.
- `7d9c24a782d0b746fb831ef1c58cbe40ec397d69` — lifecycle route role checks.
- `7526d4d25d33d940b2706b0e6aeead9074a41459` — route classification coverage.
- `841d2766da5c7919c4932fa244da0ef9308eedf1` — actor and school-scope middleware error tests.

Frontend credential transport:
- `3d31c2823a3756df85e510cd305a8e4bf5231815` — test-only Jest isolation correction for `apiClient.test.js`; committed after the pre-fix 24/25 run, rerun pending.
- `c3c957f994febb54046f5cb8729fd92f4a883154` — shared credential-aware API client.
- `ef834e677903aaf7cb683fa6cb51a9727ce07772` — Teacher Game Zone credential transport.
- `912bff451fc6aa9ce5b79573c34c5a2bbbd43968` — Student Game Zone credential transport.
- `89150a9e1c5e4bc06a1393d3c41491ff5304826a` — shared client configuration test.
- `08cf3a7694c9d06be189dbd5d2832bf595cf6e60`, `2cede3d41bd9042d2b8a086747ee58be49cef988`, and `3328d8946a6561e10d10303280d147b19d124bab` — update Teacher/Student Game Zone component-test mocks and expectations to use the shared client.

### Phase 11 diff review and verification
Compared with Phase 10 tracker checkpoint `0b06f56dd1d01503a46de03113f32564f5a16815`, the Phase 11 application diff contains exactly the 21 files listed above. No unrelated school-management paths were included.

Source review confirms:
- New update and unpublish routes use the authenticate-session → role-check → persisted actor-context chain.
- Update and transition database filters constrain activity ownership and the Teacher's current school/class/subject.
- Teacher and Student Game Zone requests use the credential-aware shared client.
- The shared API client test correction was committed as `3d31c2823a3756df85e510cd305a8e4bf5231815`.

**Verification evidence (2026-11-08):** The user has now confirmed that all Phase 11 tests passed and the production build was successful. Exact test/suite counts and the build output were not supplied in this conversation, so no counts are recorded. The user also previously reported successful browser/frontend runtime behavior; the detailed cross-origin cookie, lifecycle scenario, and real Wordwall load/fullscreen/fallback checklist was not individually itemized in the handoff evidence. The user explicitly confirmed the Phase 11 gate and asked to proceed to Phase 12. Phase 11 is therefore treated as user-confirmed complete for this phase transition; do not claim independently executed local verification.

### Phase 11 exit checks
- [x] Backend test suite passes — user-confirmed.
- [x] Frontend Jest suite passes after the committed API-client test isolation correction — user-confirmed.
- [x] Frontend production build passes — user-confirmed.
- [x] General frontend/browser runtime behavior — user-reported successful.
- [ ] Detailed cross-origin HttpOnly-cookie transport and each lifecycle/browser scenario — exact individual observations were not supplied; retain as manual regression checks when testing the integrated Phase 12 branch.
- [ ] Real Wordwall embed load, fullscreen and fallback — general browser success was reported, but these specific scenarios were not itemized; retain as manual regression checks when testing the integrated Phase 12 branch.


## Phase status
| Phase | Name | Status |
|---|---|---|
| 01 | Two-repository baseline inventory | Completed (prior checkpoint) |
| 02 | Characterization and smoke-test baseline | Completed (prior checkpoint) |
| 03 | Security review and environment hygiene | Completed (prior checkpoint) |
| 04 | Correct Admin password storage | Completed (prior checkpoint) |
| 05 | Establish a trusted authenticated session | Completed (prior checkpoint) |
| 06 | Server-side authorization and school scoping | Completed; user confirmed tests passed |
| 07 | Stable API contracts and test harness | Completed; user confirmed 141 tests passed |
| 08 | Learning module boundaries and route integration design | Completed; AI_LEARNING_MODULE_DESIGN.md committed as 726f86080a1e8e8a85d95cb0d9cc13dad88f5cf4 |
| 09 | GameActivity schema and invariants | **Completed — user confirmed post-fix backend test suite passed (2026-11-06); exact count not supplied** |
| 10 | Safe Wordwall URL validation and embed component | **Implementation and automated tests/build user-confirmed passed; real-browser Wordwall check still pending** |
| 11 | Role-scoped Game APIs | **User-confirmed all backend/frontend tests and production build passed (2026-11-08); general browser success reported; granular scenario checklist not itemized** |
| 12 | Admin Learning & Games management | **Implementation committed to feature branch; Phase 12 local tests/build pending** |
| 13–30 | Remaining roadmap | Not started; follow harness exactly |

Do not redo completed phases unless source inspection shows a regression. Follow the detailed scope and exit gates in AI_LEARNING_GAMES_IMPLEMENTATION_HARNESS.md.



## Phase 12 source audit before implementation (2026-11-08)

**Historical preparation snapshot:** Phase 12 had not started when this audit was written. The harness objective is: add an Admin sidebar entry and a management page to filter/inspect the school's game records, view publication state, archive/unpublish, and review source URL/creator metadata. The exit gate requires the Admin to manage only the signed-in school's catalogue, with working empty/loading/error states and tested secured actions.

### Source facts verified on the feature branch
- `frontend/src/App.js` renders `AdminDashboard` only when the restored authenticated role is `Admin`; no root-level route redesign is needed.
- `frontend/src/pages/admin/SideBar.js` owns Admin navigation. Current links include Home, Classes, Subjects, Teachers, Students, Notices, Complaints, Fee Collection, Profile and Logout; there is no Learning & Games link.
- `frontend/src/pages/admin/AdminDashboard.js` owns the Admin nested route registry and imports the Admin page modules. The new catalogue page can be mounted here and linked from the existing sidebar.
- `backend/middleware/loadActorContext.js` verifies the persisted Admin record and sets `req.actor.schoolId` to the authenticated Admin's own ID. Teacher and Student school IDs are derived from their current database records. Do not accept an Admin school ID from params, query, or body for Phase 12.
- `backend/routes/route.js` already defines `requireAdmin = [authenticateSession, authorizeRoles("Admin"), loadActorContext]`. Existing GameActivity routes are Teacher-only for create/update/publish/unpublish/archive and Teacher/Student for list; there is currently no Admin GameActivity endpoint.
- `backend/controllers/game-activity-controller.js` currently restricts list to Teacher/Student and lifecycle transitions to Teacher-owned activities. Its existing unpublish/archive transition requires current status `published`; it records `unpublishedAt` for draft transition and `archivedAt` plus `archiveReason: "manual"` for archive. Those Teacher-specific handlers must not be widened by removing their ownership checks.
- `backend/models/gameActivitySchema.js` already stores title, description, provider, validated embedUrl, originalUrl, school, class, subject, createdByTeacher, topic, status, and lifecycle timestamps. The model has school/class/subject/status and creator indexes; Phase 12 should not need a schema change.
- `backend/API_CONTRACT.md` currently documents the Teacher/Student GameActivity endpoints and explicitly says there is no Admin endpoint.
- Current actor context can provide the Admin school boundary, while catalogue results can populate class name, subject name/code, and creator name for the requested source/creator review. Avoid exposing unnecessary teacher/student personal fields.

### Phase 12 implementation boundary to preserve
- Add dedicated Admin-only catalogue read and Admin-only unpublish/archive actions. Keep existing Teacher endpoints and ownership/state rules intact.
- Every list and lifecycle write must include `school: req.actor.schoolId` in the database predicate. Action handlers must also constrain activity ID and expected current status. A forged school ID or activity from another Admin's school must not return or mutate data.
- Validate any filter identifiers and confirm referenced class/subject/teacher belongs to the authenticated school before using them in filters. Never treat a client-provided school ID as authoritative.
- Keep the catalogue read-only for content fields: Admin reviews title/topic, class/subject, provider, embed/original source URL, creator name, status and relevant timestamps; the requested controls are unpublish/archive, not edit/delete or publish.
- Preserve the existing state machine: only published records can be unpublished or archived through these Phase 12 actions unless the Phase 09 invariants are re-reviewed and a separate explicit requirement is approved.
- Provide status/search/filter controls and explicit loading, empty, error, and action-feedback states. UI filters are convenience only; server scoping is mandatory.
- Add backend controller tests for Admin-only access, school-scoped list filters, cross-school IDs, valid and invalid state transitions, and route authorization tests asserting the authentication → Admin role → actor-context chain.
- Add frontend tests for loading, empty, error, filtered results, metadata rendering, confirmation/action success, and action failure. Reuse the existing credential-aware `frontend/src/utils/apiClient.js`; do not introduce a second Axios client.

### Phase 12 implementation source areas
- Backend: `backend/controllers/game-activity-controller.js`, `backend/routes/route.js`, `backend/API_CONTRACT.md`, `backend/tests/gameActivityController.test.js` (or a dedicated Admin controller test file), and `backend/tests/routeAuthorization.test.js`.
- Frontend: new Admin catalogue page under `frontend/src/pages/admin/`, `frontend/src/pages/admin/SideBar.js`, `frontend/src/pages/admin/AdminDashboard.js`, plus focused page/sidebar tests.
- No AI quiz, Teacher My Games, Student Games Zone, GameActivity schema, or unrelated Admin dashboard redesign belongs in Phase 12.

**Gate outcome:** The user subsequently confirmed all Phase 11 tests and the production build passed, and explicitly asked to proceed. The Phase 12 implementation and its current verification status are recorded below.

## Phase 12 — Admin Learning & Games management (implementation)

**Status:** Application implementation committed to `feature/learning-game-zones`; local Phase 12 test/build execution is pending user output. No Phase 12 runtime test or production build is claimed as passed.

### Implemented backend contract
Added a dedicated Admin controller at `backend/controllers/admin-game-activity-controller.js`; existing Teacher-specific GameActivity controller methods and permissions were not widened.

New routes:
- `GET /AdminGameActivityList` — Admin-only; derives the school from the authenticated, persisted actor context. Does not accept a client-supplied school ID.
- `PUT /AdminGameActivityUnpublish/:id` — Admin-only; atomically changes a published activity in the Admin's school to draft and records `unpublishedAt`.
- `PUT /AdminGameActivityArchive/:id` — Admin-only; atomically archives a published activity in the Admin's school and records `archivedAt` plus `archiveReason: "manual"`.

The list supports class, subject, teacher, status, provider, and literal search filters, plus bounded pagination (page 1–100000; limit 1–100). Class/subject/teacher filter IDs are resolved and validated against the authenticated Admin's school. A subject must also belong to the selected class when both are supplied. Unsupported query keys, including any school override, are rejected. Search metacharacters are escaped.

The list response includes:
- Paginated and populated activities (class name, subject name/code, creator name only).
- School-wide counts for total, draft, published, and archived records.
- School-scoped class, subject, and teacher filter options.

Lifecycle writes constrain activity ID, Admin school, and expected current status (`published`) in one atomic database update. Out-of-school/missing records return 404; same-school records not currently published return 409. Admin has no content-edit, delete, or draft-publish capability in this phase.

### Implemented frontend
- Added `frontend/src/pages/admin/AdminLearningGames.js`.
- Added the Admin sidebar entry at `/Admin/learning-games`.
- Registered the page in `AdminDashboard.js`.
- Reused `frontend/src/utils/apiClient.js` with its credential-aware Axios configuration.
- Added school catalogue summary cards, search and class/subject/teacher/status/provider filters, paginated table, status and lifecycle timestamps, creator metadata, and separately rendered original-source/validated-embed links.
- Added confirmation before unpublish/archive, success/error feedback, refresh, retry, loading, empty, and error states.
- External links are restricted to HTTPS without credentials, nonstandard ports, or fragments; embed links additionally require an exact Wordwall hostname and embed path.

### Phase 12 changed files
Backend:
- `backend/controllers/admin-game-activity-controller.js` (new)
- `backend/routes/route.js`
- `backend/API_CONTRACT.md`
- `backend/tests/adminGameActivityController.test.js` (new)
- `backend/tests/routeAuthorization.test.js`

Frontend:
- `frontend/src/pages/admin/AdminLearningGames.js` (new)
- `frontend/src/pages/admin/AdminLearningGames.test.js` (new)
- `frontend/src/pages/admin/SideBar.js`
- `frontend/src/pages/admin/SideBar.test.js` (new)
- `frontend/src/pages/admin/AdminDashboard.js`

Diff review from Phase 11 checkpoint `73078210593cb68e62e72bf20fdf8bcdc004e984` to the implementation branch showed exactly these 10 paths. No GameActivity schema, Teacher/Student game page, quiz, dependency, or unrelated school-management file changed.

### Phase 12 commits
The Phase 12 implementation was committed incrementally to the feature branch. The final implementation-related commits include:
- `a9545a4d60030fb1f7fcf1a9487b5c846bc13b3a` — Admin controller with corrected ID/search validation.
- `4a5cc19cc14245d5c3ecc0ccbdd36e4c02f83378` — Admin controller tests.
- `e5d29426d88be20685d8116da89acdaf9f88da0b` — Admin routes.
- `50fdf71699e336a9e4e198802ffc432df9528f27` — route authorization tests.
- `e1a8776e69d934479e9ca3d3a518af838e1d6e60` — API contract.
- `138ea2a2d7fd4f6103549cce39323e296b2bd584` — Admin catalogue page.
- `62716a956da620bd0d29e3cd1b0930f14c1d41d5` — Admin dashboard route.
- `8a65133b92405970a6c095de81d34cf532f30d5a` — Admin sidebar navigation.
- `8c6984927937c1c31a6b511f949d8be2159bf747` — frontend page tests.
- `462913bcc30629d14b2101d2a12517e46b7dfd6b` — sidebar test.
- `b7f2f7b6e317828d7d49f6fe9eab09dfd530ed9a` — bounded pagination.
- `c48ad0ae436a48680e023cbdbc0fa6b492390447` — hardened external link rendering.
- `a045153afac6cdaa17faba20f9be49b9856a40d0` — API contract pagination bound.

### Phase 12 verification status
- [x] Source review and branch diff review — completed.
- [x] Admin role and persisted actor-context route chain covered by route tests.
- [x] Controller tests added for school scoping, filters, invalid inputs, pagination, transitions, and conflict/not-found behavior.
- [x] Frontend tests added for loading, empty, error/retry, filtered requests, metadata, action confirmation/success/failure, and draft/archived action visibility.
- [ ] Backend `npm test` — not run in this environment.
- [ ] Frontend `npm test -- --watchAll=false` — not run in this environment.
- [ ] Frontend `npm run build` — not run in this environment.
- [ ] Local browser verification with an Admin account, including other-school filter IDs, unpublish/archive state changes, and regression checks for Teacher/Student pages — pending.

GitHub returned no CI status checks and no workflow runs for the latest Phase 12 commits. The GitHub connector can edit and inspect repository files but did not execute the local npm commands.

### Immediate next action
Pull the branch and run the Phase 12 verification commands listed at the end of this handoff. Report complete backend/frontend test output and build output. Fix only demonstrated failures. Do not begin Phase 13 until Phase 12 exit checks pass and the user asks to continue.

---

## Phase 09 implementation snapshot
Files added:
- backend/GAME_ACTIVITY_INVARIANTS.md
- backend/services/learning/gameActivityIntegrity.js
- backend/tests/gameActivitySchema.test.js
- backend/tests/gameActivityLifecycle.test.js
- backend/tests/gameActivityLifecycleControllers.test.js

Files modified:
- backend/models/gameActivitySchema.js
- backend/controllers/game-activity-controller.js
- backend/controllers/class-controller.js
- backend/controllers/subject-controller.js
- backend/controllers/teacher-controller.js
- backend/tests/gameActivityController.test.js

The implementation adds a separate GameActivity model and indexes, persisted relationship validation for Teacher/school/Class/Subject, archive lifecycle methods, archive metadata, and archive-before-delete/reassignment handling. No frontend, dashboard, route URL, dependency, or quiz code was changed in Phase 09.

Before the latest fixes, user ran npm test: 171 total, 169 passed, 2 failed:
1. Invalid ObjectId threw synchronously in lifecycle archive method, while assert.rejects expected a rejected promise.
2. archiveReason had default null, but enum validation rejected null.

Fixes are on the branch:
- a11cd23b23fc532251a317d82d07be1214e7a926 — all seven public archive lifecycle methods made async.
- 5f5950de0a874cf763f12bfa42536b7c44a0f78d — archiveReason custom validator accepts null or one of manual, teacher_deleted, teacher_reassigned, class_deleted, subject_deleted, school_resources_deleted.

The user confirmed that the backend test suite ran properly after these fixes. Exact pass/fail counts were not supplied, so record this as user-confirmed passing rather than inventing a count.

## Local troubleshooting — /AuthSession returns HTTP 503 (2026-11-08)

User reported local startup succeeds and MongoDB connects, but `GET /AuthSession` returns HTTP 503. Current source inspection confirms the route is registered as `authenticateSession` followed by `getAuthSession`; it does not run `loadActorContext`. The 503 therefore comes from the `getSessionConfig()` catch in `backend/middleware/authenticateSession.js`, before the request cookie is checked. The middleware's 503 response message is `Authentication is not configured on this server`.

`backend/utils/authSession.js` requires:
- `AUTH_SESSION_SECRET` with at least 32 UTF-8 bytes;
- `AUTH_SESSION_TTL_SECONDS`, when set, as an integer from 300 through 86400 (default 3600 if unset);
- `AUTH_COOKIE_SAME_SITE` as one of `lax`, `strict`, or `none` (default `lax`).

Most likely local cause: missing/short `AUTH_SESSION_SECRET`, or invalid TTL/SameSite setting in `backend/.env`. The backend entry point calls `dotenv.config()` before registering routes. The example env file leaves `AUTH_SESSION_SECRET` blank. `backend/.gitignore` includes `/.env`, so the real local secret should remain uncommitted.

Safe diagnostic (run from `backend`; does not print secret contents):
```powershell
node -e "require('dotenv').config(); const s=process.env.AUTH_SESSION_SECRET || ''; const raw=process.env.AUTH_SESSION_TTL_SECONDS; const ttl=raw === undefined ? 3600 : Number(raw); const sameSite=(process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase(); console.log({secretConfigured:s.length>0, secretBytes:Buffer.byteLength(s,'utf8'), ttlValid:Number.isSafeInteger(ttl)&&ttl>=300&&ttl<=86400, sameSite, sameSiteValid:['lax','strict','none'].includes(sameSite)});"
```

If the secret is absent/too short, generate a fresh one locally:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add the generated value (never a placeholder) to local `backend/.env`:
```env
AUTH_SESSION_SECRET=PASTE_YOUR_GENERATED_SECRET_HERE
AUTH_SESSION_TTL_SECONDS=3600
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=false
```
Restart the backend. A request to `/AuthSession` with no session cookie should then return 401, not 503; after successful login with a valid cookie it should return 200. If it returns 401 after login, next inspect browser cookie transport and CORS; do not rotate or expose the secret in logs.

This is a local environment diagnosis, not an application-code defect demonstrated by the log. No runtime source changes were made for this report. Subsequent Phase 11 test and browser evidence is recorded in the current verification section above.

## Immediate next action — verify Phase 12 locally

Pull the latest `feature/learning-game-zones` branch, then run from the repository root in Windows PowerShell:

```powershell
git pull --ff-only origin feature/learning-game-zones

cd backend
npm test

cd ..\frontend
npm test -- --watchAll=false
npm run build
```

Then sign in as an Admin and verify the Learning & Games page. Check the school's full catalogue and filter options; class/subject/teacher/status/provider/search filters; pagination; source and creator metadata; empty/loading/error/retry behavior; confirmation; unpublish (published → draft); archive (published → archived); and rejection of an activity or filter ID belonging to another school. Confirm draft and archived records have no Admin lifecycle action. Also regress Teacher and Student Game Zone access and ensure the existing root-mounted routes still work.

The Phase 12 application implementation is committed, but do not treat it as complete until the backend suite, frontend suite, build, and local Admin browser/API checks pass. Fix only failures supported by the output. Stop for review before Phase 13.


## How to work
1. Read this file and the harness first; verify actual remote branch HEAD and current source.
2. Work one phase at a time, only after the prior exit gate passes and the user asks to continue. Exception recorded 2026-11-06: the user confirmed Phase 10 automated tests/build and explicitly asked to proceed; Phase 11 implementation has begun, while the real Wordwall browser check remains an outstanding manual verification to complete alongside Phase 11 browser checks.
3. Inspect exact files/tests before edits; make minimal changes and preserve unrelated code.
4. Review the full diff; list every changed file and why it changed.
5. Be honest about tests. The GitHub connector cannot run npm test on the user's Windows machine. Never claim a test passed without actual user output or verified CI.
6. Use Windows PowerShell commands. Do not push to main, force-push, or overwrite user work.
7. Stop for user review after each phase.
8. **Update this file after every substantive project response.** Add a dated interaction-log entry and update phase status, changed files, commit SHA, exact test evidence (or “not verified”), immediate next action, and next-phase gate. Keep the repository and local copy synchronized. Do not mark a phase complete without evidence.

## Prompt for a new chat
I am continuing work on my MERN School Management System + AI Learning & Games project. Read the attached PROJECT_HANDOFF.md fully before doing anything. Then inspect the current GitHub repository and feature/learning-game-zones branch to verify the actual latest commit and source state. Continue exactly from the pending action; do not restart completed phases or ask me to repeat information already recorded.

Follow the 30-phase roadmap in AI_LEARNING_GAMES_IMPLEMENTATION_HARNESS.md one phase at a time. Do not start a later phase until the current phase's exit gate is verified and I ask you to continue. Preserve unrelated code. Inspect the exact source and tests before editing, make only minimal scope-related changes, review the full diff, and provide Windows PowerShell commands. Never claim tests passed unless I provide actual output or a verified CI result.

Continuity requirement: Update PROJECT_HANDOFF.md after every substantive project response, including fixes, test diagnosis, decisions, commits, and phase transitions. Update both the repository copy on feature/learning-game-zones and the local/downloadable copy. Add a dated changelog entry, record changed files and commit SHAs, exact test evidence (or “not verified”), phase status, and the one immediate next action. At the end of every response, provide the updated handoff file or repository link. Start from the pending action recorded in the file and do not go beyond its test gate.

## Interaction log
### 2026-11-06 — Initial handoff
Created the continuity record and new-chat prompt. Verified the application-code checkpoint `5f5950de0a874cf763f12bfa42536b7c44a0f78d` and added the tracker in documentation-only commit `585a3ee367f2b95e68d7fac3fb368fdcc3a56091`. No application/runtime code changed in the tracker commit.

### 2026-11-06 — Phase 09 test confirmation and Phase 10 implementation
- User confirmed Phase 09 tests ran properly after the two fixes. Exact pass/fail counts were not provided; recorded as user-confirmed pass without inventing a count.
- Implemented Phase 10 backend URL/snippet normalization, matching frontend validation, reusable fixed Wordwall embed component with external fallback, Teacher input/preview integration, and Student playback integration.
- Added/expanded backend and frontend tests, including a controller test proving only the extracted validated URL is stored.
- Phase 10 source/diff reviewed across 9 application paths (plus this handoff update); no routes, authorization, dependencies, navigation, schema fields, or unrelated school workflows changed.
- During final review, tightened iframe attribute matching to require a true whitespace-delimited `src` attribute, preventing a `data-src` attribute from being mistaken for `src`; added backend and frontend regression cases.
- Phase 10 local tests, frontend build, and real Wordwall browser compatibility are not yet verified. Phase 11 remains blocked until those checks pass.

### 2026-11-06 — Phase 10 verification and Phase 11 implementation
- User confirmed Phase 10 backend tests, frontend tests, and frontend production build all passed. Exact counts were not supplied.
- The real Wordwall browser check (embed load, fullscreen, fallback) was not explicitly confirmed and remains pending.
- User explicitly asked to proceed to Phase 11. Inspected the current routes/controller/middleware/tests and confirmed existing GameActivity create/list/publish/archive behavior was already role-protected and DB-scoped.
- Added Teacher-only draft update and published-to-draft unpublish operations; added `unpublishedAt`; kept archived records immutable and lifecycle writes scoped to the authenticated Teacher's current assignment.
- Added/updated middleware error standardization so session, role, actor-context, and school-scope errors use the shared `sendApiError` contract.
- Added a shared credential-aware Axios client and migrated only Teacher/Student Game Zone API calls; updated their component-test mocks.
- Added controller, route authorization, schema, middleware, and API client tests; updated `backend/API_CONTRACT.md`.
- Remote diff review from `0b06f56dd1d01503a46de03113f32564f5a16815` shows exactly 21 changed Phase 11 files. No Phase 12 Admin UI/API work or unrelated school-management refactor was included.
- Phase 11 automated tests/build and browser/API verification have **not yet been run or confirmed by the user**.
- Phase 11 code checkpoint before the tracker commits: `3328d8946a6561e10d10303280d147b19d124bab`.
- Phase 11 implementation commits are listed in the Phase 11 section above.
- Immediate next action: run backend tests, frontend tests, frontend build, then verify cross-origin credentials, GameActivity lifecycle/scope behavior, and the outstanding real Wordwall embed/browser compatibility check. Do not start Phase 12 yet.

### 2026-11-08 — Local /AuthSession 503 diagnosis
- User shared logs showing backend and MongoDB start successfully but `GET /AuthSession` responds 503 twice.
- Inspected current `route.js`, `authenticateSession.js`, `authSession.js`, `index.js`, `backend/.env.example`, CORS configuration, and backend gitignore.
- Confirmed the 503 is emitted by the `getSessionConfig()` catch in `authenticateSession`, before cookie validation. The route does not include actor-context middleware.
- Most likely cause is unset/short `AUTH_SESSION_SECRET`, invalid `AUTH_SESSION_TTL_SECONDS`, or invalid `AUTH_COOKIE_SAME_SITE` in local `backend/.env`. The actual local env was not accessible, so the exact failing value has not been verified.
- Provided a non-secret-printing PowerShell diagnostic and local secret-generation/configuration steps. No application runtime code was changed.
- Phase 11 automated test/build and browser/API verification remain pending; do not start Phase 12.


### 2026-11-08 — Phase 11 local verification: frontend API-client test
- User reports the backend, frontend runtime, and browser verification were successful. The user then ran the frontend Jest suite and supplied the complete summary: **5 suites total; 4 passed and 1 failed; 24 tests passed and 1 failed**.
- Passing suites: `src/utils/wordwallUrl.test.js`, `src/redux/userRelated/userHandle.test.js`, `src/pages/student/StudentGameZone.test.js`, and `src/pages/teacher/TeacherGameZone.test.js`.
- Failing suite: `src/utils/apiClient.test.js`, test “shared API client sends the HttpOnly session cookie with every request”. Assertion expected `axios.create({ baseURL: "http://localhost:5000", withCredentials: true })`, but Jest reported zero recorded calls.
- Inspected the exact branch versions of `frontend/src/utils/apiClient.js`, `frontend/src/utils/apiClient.test.js`, and `frontend/package.json`. The client creates its Axios instance at module-evaluation time, while the test statically imports both Axios and the client before the test body, then inspects the recorded call inside the test.
- Diagnosis: this is consistent with Create React App / `react-scripts` Jest's `resetMocks` behavior clearing mock call history before the test body. The assertion is observing the mock after the import-time call history was reset. The evidence points to a test isolation/order issue, not a demonstrated defect in the application API client; runtime and browser checks reported by the user succeeded.
- Minimal proposed test-only fix: remove the top-level imports of Axios and `apiClient`; keep the Axios mock declaration; inside the test body use `jest.isolateModules(() => { const axios = require("axios").default; const apiClient = require("./apiClient").default; ...assertions...; });`. This makes module evaluation and the `axios.create` call occur during the test, after Jest's per-test reset. No production code change is indicated.
- No code fix has been committed yet, and the proposed test-only fix has **not** been run locally. The user's output is evidence for 24 passing tests and 1 failing test; do not mark the frontend test suite as passed.
- The user’s message did not include a distinct `npm run build` result. Record the production build as not confirmed by this output, even though the development frontend reported “webpack compiled successfully”.
- Immediate next action: apply the minimal change only to `frontend/src/utils/apiClient.test.js` (or provide the replacement test to the user), then rerun the frontend suite with watch mode disabled and share the complete output. Keep Phase 11 open until the frontend suite passes and the remaining scope/lifecycle/API checks and production build have documented results. Do not start Phase 12.


### 2026-11-08 — Phase 11 Jest test correction committed; Phase 12 audited but gated
- Reviewed the exact remote branch test, API client, package configuration, handoff, and feature branch head. At the start of this task, the feature branch head was `f7a8deec8f54acd4aa99485971c6a130c24e127d`.
- Updated only `frontend/src/utils/apiClient.test.js`. Removed top-level Axios/API-client imports; moved both requires inside `jest.isolateModules`; configured `axios.create` with a known mocked client inside the isolated registry; asserted the credential options and exact returned client object.
- Committed the test-only change as `3d31c2823a3756df85e510cd305a8e4bf5231815` (`test: isolate shared API client mock setup`). Verified the branch ref now points to that commit and verified the commit diff contains only `frontend/src/utils/apiClient.test.js`.
- No local Jest, npm build, or other runtime command was executable through the GitHub connector. The corrected frontend suite remains **not verified**. No CI status entries were returned for this commit.
- Inspected Phase 12 harness requirements and the current Admin routes/sidebar/dashboard, Admin actor-context behavior, GameActivity controller/model/routes, and API contract. Recorded the Phase 12 source audit and scope boundary above. No Phase 12 application implementation has started.
- User-reported evidence remains: backend suite passed (exact counts not supplied); frontend/browser runtime succeeded generally; prior frontend Jest run was 4/5 suites and 24/25 tests. Specific cross-origin/lifecycle/Wordwall browser scenarios and a separate production build result remain unitemized.
- Immediate next action: run the corrected frontend test suite with watch mode disabled and run the production build. Only after Phase 11 exit checks are verified should Phase 12 implementation begin.

### 2026-11-08 — Phase 12 Admin Learning & Games implementation
- User confirmed all Phase 11 tests and the frontend production build passed and explicitly asked to begin Phase 12.
- Added a separate Admin GameActivity controller; did not widen the existing Teacher endpoints. Admin identity and school scope are taken from persisted `req.actor` context, and both values must identify the same Admin record.
- Added secured Admin catalogue list, unpublish, and archive endpoints. Lists and lifecycle writes are school-constrained; filter IDs are validated against the Admin's school. Only currently published records can be unpublished or archived.
- Added paginated search/filter catalogue data, status summary counts, and school-scoped class/subject/teacher filter options. Updated the API contract.
- Added the Admin Learning & Games page, Admin sidebar link, and Admin dashboard route. The page uses the shared credential-aware API client and includes loading/empty/error/retry states, filters, pagination, metadata and source links, action confirmation, and action feedback.
- Added backend controller and route-authorization tests, plus frontend catalogue-page and sidebar tests.
- Diff comparison from the Phase 11 checkpoint `73078210593cb68e62e72bf20fdf8bcdc004e984` shows exactly 10 changed paths. No schema, Teacher/Student page, AI quiz, dependency, or unrelated school-management paths changed.
- Latest remote branch head after the Phase 12 handoff update: `9b4f11186602107040f63223be7906c7ad4c560a`.
- Source/diff review is complete. Phase 12 backend/frontend tests, production build, and local Admin browser/API checks are **not yet run or verified**. The latest commit has no GitHub CI status entries or workflow runs.
- Immediate next action: pull the latest branch and run backend tests, frontend tests, frontend build, then verify the Admin flows and cross-school restrictions. Do not start Phase 13 until these checks pass and the user asks to continue.
