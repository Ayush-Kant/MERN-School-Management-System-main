# Project Handoff — MERN School Management + AI Learning & Games

Last updated: 2026-11-06 (Asia/Kolkata)

## Repository
- Repository: Ayush-Kant/MERN-School-Management-System-main
- Branch: feature/learning-game-zones
- Last verified application-code checkpoint: `5f5950de0a874cf763f12bfa42536b7c44a0f78d`.
- Handoff tracking file initially added in documentation-only commit: `585a3ee367f2b95e68d7fac3fb368fdcc3a56091` (this commit adds only `PROJECT_HANDOFF.md`; it does not change application code).
- Phase plan: AI_LEARNING_GAMES_IMPLEMENTATION_HARNESS.md
- Phase 08 design: AI_LEARNING_MODULE_DESIGN.md
- Phase 09 invariants: backend/GAME_ACTIVITY_INVARIANTS.md
- Latest Phase 10 code checkpoint before this handoff update: `b79bd513215b4fedce9d5e3ca00d58473cfa8239`.

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
- Source/diff review: completed remotely.
- User-confirmed Phase 09 backend tests: passed; exact count not supplied.
- Phase 10 backend tests: **not yet run locally**.
- Phase 10 frontend tests: **not yet run locally**.
- Frontend production build: **not yet run locally**.
- Real Wordwall embed/browser compatibility: **not yet verified**. This cannot be established by remote source edits alone.

From repository root in Windows PowerShell:
```powershell
git pull --ff-only origin feature/learning-game-zones
cd backend
npm test
cd ..\frontend
npm test -- --watchAll=false
npm run build
```

Then perform a browser smoke test with a real embed URL copied from Wordwall's official Embed interface:
1. Sign in as a Teacher and open Game Zone.
2. Paste the plain embed URL and save a draft; repeat with the official iframe snippet.
3. Confirm the snippet is accepted, preview renders, and the persisted `embedUrl` is only the extracted URL (not iframe markup).
4. Confirm the preview and Student playback show the fixed iframe and “Open on Wordwall” fallback link.
5. Confirm invalid schemes, lookalike hosts, and malformed snippets are rejected.
6. Check the real embed in the supported browsers used by the project and report whether it loads and whether fullscreen works.

Send the complete backend/frontend test output, build result, and real-browser observations. Fix any demonstrated failures minimally. Do not start Phase 11 until the Phase 10 exit gate is verified and the user asks to continue.

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
| 10 | Safe Wordwall URL validation and embed component | **Implemented; local backend/frontend tests, frontend build, and real-browser embed check pending** |
| 11–30 | Remaining roadmap | Not started; follow harness exactly |

Do not redo completed phases unless source inspection shows a regression. Follow the detailed scope and exit gates in AI_LEARNING_GAMES_IMPLEMENTATION_HARNESS.md.

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

The test suite has NOT yet been rerun after these fixes. Expected result if fixes work: 171 passed, 0 failed. This is not a verified result.

## Immediate next action
From repository root in Windows PowerShell:
```powershell
git pull --ff-only origin feature/learning-game-zones
cd backend
npm test
```
Send the complete output. If any failures remain, inspect their exact output and fix only demonstrated issues. Do not start Phase 10 until the post-fix test suite passes and the user confirms the gate.

## How to work
1. Read this file and the harness first; verify actual remote branch HEAD and current source.
2. Work one phase at a time, only after the prior exit gate passes and the user asks to continue.
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
