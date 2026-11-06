# Project Handoff — MERN School Management + AI Learning & Games

Last updated: 2026-11-06 (Asia/Kolkata)

## Repository
- Repository: Ayush-Kant/MERN-School-Management-System-main
- Branch: feature/learning-game-zones
- Verified HEAD: 5f5950de0a874cf763f12bfa42536b7c44a0f78d
- Phase plan: AI_LEARNING_GAMES_IMPLEMENTATION_HARNESS.md
- Phase 08 design: AI_LEARNING_MODULE_DESIGN.md
- Phase 09 invariants: backend/GAME_ACTIVITY_INVARIANTS.md

## Architecture decisions
The MERN School Management System remains the host application. Preserve the legacy ChemAmaze-cbse repository as source/reference. Build two separate experiences: (1) school-scoped teacher-managed Wordwall Games Zone and (2) first-party AI Learning Studio with server-graded quizzes, learning attempts, mastery estimates, adaptive revision, curriculum-grounded explanations, and teacher-reviewed generated questions. Existing Admin/Teacher/Student and school/class/subject records remain authoritative.

Enforce authorization and school/class/subject scope on the backend. Never trust frontend role state or client-supplied school/teacher/student IDs. Do not infer Wordwall scores or correctness from an iframe. Validate allowed HTTPS Wordwall embed URLs; never render teacher-provided iframe HTML. Do not store unbounded game arrays in existing models. Use approved curriculum content and preserve provenance. Keep learner data minimal. Treat BKT as an interpretable estimate and evaluate it against baselines.

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
| 09 | GameActivity schema and invariants | Implemented; post-fix local test rerun is pending |
| 10 | Safe Wordwall URL validation and embed component | Not started; blocked by Phase 09 gate |
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
Created the continuity record and new-chat prompt. Verified branch HEAD 5f5950de0a874cf763f12bfa42536b7c44a0f78d. No application/runtime code changed. Phase 09 post-fix local test rerun pending; Phase 10 blocked.
