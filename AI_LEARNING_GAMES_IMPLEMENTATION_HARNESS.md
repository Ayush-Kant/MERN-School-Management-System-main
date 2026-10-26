# ChemAmaze + MERN School Management: AI Learning & Games Implementation Harness

**Planning branch:** `plan/ai-learning-games-integration`  
**Baseline branch:** `main`  
**Primary implementation repository:** [Ayush-Kant/MERN-School-Management-System-main](https://github.com/Ayush-Kant/MERN-School-Management-System-main)  
**Legacy game-catalogue/reference repository:** [dikshaforsure/ChemAmaze-cbse](https://github.com/dikshaforsure/ChemAmaze-cbse)  
**Status:** Planning contract only. This commit does not alter runtime application code.

This harness supersedes the earlier idea of building a separate AI system around ChemAmaze as a static website. The current direction is to make the MERN School Management System the host product, preserve ChemAmaze as the source/reference for existing Wordwall game entries and learning context, and build the first-party learning and AI/ML experience as a distinct module integrated into the school workflows.

The implementation is intentionally phased. Do not implement all phases at once. Inspect the relevant repository files and verify each phase's prerequisites before coding it.

---

## 1. Product decision

Build a school-connected learning platform with three related, but deliberately distinct, experiences:

1. **Games Zone:** teacher-assigned external Wordwall activities. Keep the games that already exist, but make them teacher-managed database records rather than hard-coded embeds.
2. **AI Learning Studio:** first-party quizzes, concept mastery estimates, targeted revision, grounded explanations, and reviewed AI-generated practice questions. This is developed from scratch as a new product module; it is not dependent on Wordwall telemetry.
3. **School Management:** the existing admin, teacher, and student workflows for school/class/subject/attendance/marks remain the source of school structure and identity. Do not rebuild those capabilities in ChemAmaze.

### The three roles use the feature differently

| Role | Games Zone | AI Learning Studio |
|---|---|---|
| Admin | Review/manage a school's game catalogue, archive inappropriate/broken entries, inspect publication status | Configure access and inspect school-level aggregated learning/content status; no unrestricted access to private learner data by default |
| Teacher | Create, edit, publish, unpublish, and assign Wordwall activities only within authorized school/subject/class scope | Create/review questions, assign first-party practice, see class-level concept trends and misconception hypotheses |
| Student | Browse and play published activities assigned/available to their class and subject | Complete first-party quizzes, get grounded explanations, see their own progress and suggested revision |

The UI can show a clearly labelled navigation item for the relevant roles, but it must not expose the same permissions to everyone. Authorization is enforced on the server, not by hiding buttons in React.

## 2. Repository reconnaissance: observed baseline

### ChemAmaze-cbse
The inspected default-branch tree is a small static app: `index.html`, `index.css`, `script.js`, and two image assets. The `script.js` file holds the subject/class/topic game catalogue and embeds hard-coded Wordwall iframes. It currently includes Mathematics and Science, classes 6–8, and chapter-specific game entries. It has no visible API, database, authenticated teacher workflow, first-party quiz engine, or ML pipeline.

The existing game records provide useful seed/reference information, but must be reviewed and migrated into normalized database records. Keep a mapping back to the original public/share link where available. Do not delete or silently rewrite the original ChemAmaze repository while migrating.

### MERN-School-Management-System-main
The inspected main branch has:
- a React 18 frontend using React Router, Redux Toolkit, Material UI and styled-components;
- an Express/Node backend, Mongoose, and MongoDB;
- role-specific dashboard route trees for Admin, Teacher, and Student;
- existing models for admin/school, teacher, student, class, and subject;
- teacher fields including `school`, `teachSubject`, and `teachSclass`;
- student fields including `school` and `sclassName`, with existing subject-level exam result and attendance records;
- subject records linked to class, school, and optionally teacher;
- sidebars and route structures where a learning module can be added without replacing the whole frontend.

Relevant existing integration points:
- `frontend/src/App.js` selects Admin/Teacher/Student dashboard experiences based on Redux user state.
- `frontend/src/pages/admin/AdminDashboard.js` and `SideBar.js` are the admin navigation/route surface.
- `frontend/src/pages/teacher/TeacherDashboard.js` and `TeacherSideBar.js` are the teacher navigation/route surface.
- `frontend/src/pages/student/StudentDashboard.js` and `StudentSideBar.js` are the student navigation/route surface.
- `backend/routes/route.js` is the existing API route registry.
- `backend/models/subjectSchema.js`, `teacherSchema.js`, `studentSchema.js`, and `sclassSchema.js` contain the current links needed to scope learning activities.

### Important security and quality blockers found in inspected code
- The inspected Express setup registers application routes without visible authentication/authorization middleware. Many endpoints take record IDs from client-supplied path/body values. This is not sufficient protection for new learner-level records.
- The inspected Admin controller's current registration stores the submitted password value directly, and Admin login compares the submitted password directly with the stored value. Student/Teacher controllers use bcrypt, but that does not solve the Admin case.
- Frontend role gating and `localStorage` user state are client-side UI state; they are not proof of authorization for a backend request.
- The backend `test` script currently exits with “no test specified” rather than running a test suite.
- A frontend `.env` path is present in the inspected Git tree. Confirm its contents and purpose before deployment; frontend environment variables must never contain server secrets.
- Some existing controller code has legacy patterns and possible correctness issues. This harness is not permission to rewrite unrelated code, but feature work must not extend unsafe patterns.

**Consequence:** security and baseline tests are early phases, not a final checklist. Do not expose student attempts, mastery, class insights, or teacher publishing controls until authentication, role checks, and school/subject/class scoping are enforced on the server.

This is a source inspection, not a claim that every legacy route has been exhaustively audited. Additional route/model risks should be recorded as they are discovered in Phase 01–03.

---

## 3. Desired user workflows

### 3.1 Admin workflow
1. Admin logs in through the existing school's account flow, after the auth hardening phases.
2. Admin opens **Learning & Games** from the Admin sidebar.
3. Admin can filter activities by class, subject, teacher, state, and provider.
4. Admin sees published, draft, archived, invalid, and reported activities for their own school.
5. Admin can publish/unpublish or archive activities within the school's scope.
6. Admin sees aggregated learning/content-review status only where the role is permitted; sensitive student-level explanations are not broadly exposed just because the person is an admin.

### 3.2 Teacher workflow
1. Teacher opens **My Games** from the Teacher sidebar.
2. The default scope comes from the authenticated teacher's assigned school, class, and subject—not arbitrary IDs chosen by the browser.
3. Teacher clicks **Add Wordwall Game** and provides a title, optional short description, topic/chapter, relevant class/subject (validated against their assignments), and the Wordwall **embed URL** obtained from Wordwall's own Embed/Share UI.
4. The backend validates the URL, school/class/subject ownership, required fields, and permissions before saving.
5. Teacher previews the game, saves as draft, and publishes/assigns it.
6. Students in the relevant authorized class can find the game in Games Zone.
7. Teacher can edit, unpublish, or archive their activity; student access changes according to publication status.
8. Teacher can view launch-level events that our application observes, but the app must not claim to know Wordwall answer correctness, score, or time inside the cross-origin game unless Wordwall documents and permits an integration that supplies those data.

### 3.3 Student workflow
1. Student signs in to the existing account.
2. Student opens **Games Zone** and sees only published, eligible activities for the student's school/class and applicable subject.
3. Student opens the details panel and launches the Wordwall activity in an isolated embedded frame with a fallback “Open on Wordwall” link.
4. Student can separately enter **AI Learning Studio**, where quiz answers are captured by our own first-party UI and API.
5. AI progress is derived from first-party learning events, not fabricated from a Wordwall launch or an assumed iframe score.

### 3.4 AI/ML workflow
1. Approved curriculum sources are linked to concepts and question records.
2. Student answers a versioned first-party question; the server calculates correctness from a server-held answer key.
3. The system records a privacy-minimizing attempt event and updates a concept-level model state.
4. A tested knowledge-tracing component estimates mastery; an explainable policy selects the next first-party activity or revision question.
5. A curriculum-grounded assistant can retrieve relevant approved passages and cite them in explanations.
6. AI-generated candidate questions are validated and teacher-reviewed before publication.
7. Metrics are calculated against fixed test sets and simple baselines. Synthetic data is used for development only and is clearly labelled.

---

## 4. Architecture proposal

### 4.1 Keep the MERN app as the school-system host

Do not merge the static ChemAmaze app into the school system as a second standalone site with its own duplicate accounts. Instead, port the existing catalogue entries as seeds/reference data and build the Games Zone using the host app's role-specific dashboards and school/subject/class models.

Initial module boundaries:

```text
React app
  ├── Admin dashboard
  │    └── Learning & Games management / moderation
  ├── Teacher dashboard
  │    ├── My Games (CRUD, preview, publish, assign)
  │    ├── Quiz authoring / assignment
  │    └── Class learning insights
  └── Student dashboard
       ├── Games Zone (Wordwall embeds)
       ├── AI Learning Studio (first-party quiz)
       ├── My mastery / revision
       └── Grounded learning assistant
             │
             ▼ HTTPS / JSON
Existing Express API (versioned learning routes added incrementally)
  ├── Authentication/session and role/tenant authorization
  ├── GameActivity service
  ├── Curriculum / concept / question bank
  ├── Learning attempt event service
  ├── Mastery / recommendation service
  ├── Content retrieval / review workflow
  └── Existing school data: Admin, Teacher, Student, Class, Subject
             │
             ├── MongoDB: game activities, concepts, questions/versions,
             │             attempts, mastery state, content sources/reviews
             └── Python ML/content service (introduced only when needed)
                   ├── BKT inference/evaluation
                   ├── retrieval/embeddings and evaluation
                   └── optional offline experiments/classifier
```

The first implementation should extend the existing Express/Mongoose stack for CRUD and school-linked persistence. A separate Python service is justified for ML evaluation or model-heavy operations; it should not be added on day one just to label the project AI. Keep model logic independent so it can first be tested in Python offline and exposed to Express later through a small, versioned internal interface.

### 4.2 GameActivity model (proposal)

The final schema must be refined after inspecting current conventions and auth decisions. Each activity should have fields along these lines:

- `title`, optional `description`, `provider: "wordwall"`;
- validated `embedUrl` and optional original share/public URL;
- `school`, `class`, `subject`, and `createdByTeacher` object references;
- topic/chapter or concept tags;
- state such as `draft | published | archived`;
- `publishedAt`, sort/display fields, and timestamps;
- audit metadata for created/updated/published action;
- optional moderation reason and schema/version metadata.

Do not overload the existing attendance, exam-result, subject, or teacher schemas with arrays of games. A separate activity model is preferable: it supports filtering, indexing, moderation, versioning, and ownership without making class/subject documents grow unbounded.

Authorization invariants:
- every activity belongs to one school and a subject/class relationship that is valid within that school;
- a teacher may create/update/publish only within assigned class/subject permissions;
- a student may read only published activities eligible for their school/class/subject;
- an admin may manage activities within their own school, not another school's data;
- object IDs supplied by the client are looked up and checked against the authenticated actor's scope;
- deleting a class/subject/teacher must not silently orphan learning records. Define deletion/archive behavior and test it.

### 4.3 Wordwall embedding constraints

- Store a validated URL, not arbitrary HTML pasted into the database.
- Ask teachers to paste the `src` URL from Wordwall's official Embed UI. A public `/play/` share URL cannot be assumed to convert to the correct `/embed/` URL; the current ChemAmaze records demonstrate that they can be different links.
- Parse the URL with the standard URL parser and allow only HTTPS and the exact permitted Wordwall domain(s)/embed path. Reject lookalike domains, credentials in URLs, javascript/data URLs, and arbitrary iframe sources.
- If user pastes a full iframe snippet, the app may extract only the `src` field and then run the same allowlist validation; never store/render the whole pasted snippet.
- Render an iframe from fixed React markup with safe attributes (descriptive title, lazy loading, full screen only as needed, restrictive frame configuration after compatibility testing). Do not interpolate teacher-supplied HTML into `dangerouslySetInnerHTML`.
- Verify real Wordwall embeds in local/deployed browsers before choosing restrictive sandbox settings; do not loosen them without documenting why.
- Preserve a fallback link to the Wordwall activity if iframe policies, network restrictions, or Wordwall availability prevent embedding.
- Do not scrape Wordwall, bypass its restrictions, or promise imported scores. Capture only events that the application itself can reliably observe.

### 4.4 AI/ML responsibilities

**Knowledge tracing:** BKT as a first interpretable baseline for each concept. Inputs are first-party correctness/attempt sequences; outputs are mastery estimates with a model version. Parameters must be tested and documented.

**Adaptive selection:** deterministic, inspectable policy based on published questions, prerequisites, low estimated mastery, and revision priority. Compare against fixed-order/random/simple-heuristic baselines before considering contextual bandits or reinforcement learning.

**Misconception diagnostics:** begin with reviewed misconception tags and distractor/answer-pattern rules. A learned classifier is a conditional later experiment; only build it if there are sufficient, permitted, representative educator-labelled examples and it beats an appropriate baseline.

**Curriculum-grounded explanation (RAG):** index only approved/usable material, preserve source identifiers and chunk versions, retrieve by grade/subject/concept, cite sources in responses, and fall back gracefully. The LLM should explain retrieved content, not be treated as the source of truth.

**Question generation:** generate structured *draft* questions using relevant retrieved passages; persist model/prompt/source metadata; validate shape, option count, answer key, duplicate similarity, allowed topic, and evidence; require teacher review before students can see the question.

**Existing school data:** attendance and term/exam marks may provide context for teacher dashboards, but are not enough to infer concept mastery. Do not start by predicting a child's pass/fail, labeling a child “at risk” as fact, or using opaque models for consequential decisions. Build formative learning intelligence from observable first-party quiz events.

---

## 5. Data and API contract principles

### Core data objects to add only when their phase arrives
- **GameActivity:** school/class/subject/teacher scope, validated Wordwall embed URL, state/audit fields.
- **LearningConcept:** stable ID, subject/grade/topic, description, prerequisites, source references.
- **Question / QuestionVersion:** concept IDs, question content, type/difficulty, server-side answer key, status, source and version.
- **LearningAttempt:** pseudonymous/session-bound learner reference, question version, selected answer, server-derived correctness, timestamp, attempt number, optional bounded duration.
- **LearnerConceptMastery:** learner/concept reference, probability, model/parameter version, last update. Scope all queries to the authenticated learner/allowed staff.
- **SourceDocument / SourceChunk:** source/version/rights/provenance, metadata, content reference/checksum, retrieval information.
- **GeneratedQuestionCandidate / Review:** structured draft, source IDs, model/prompt version, validation findings, reviewer and publication state.
- **RecommendationEvent:** candidate activities, chosen activity, policy/model version, and explanation.

### API namespaces (initial direction, not frozen until implementation)
- `/api/v1/games`: role-scoped list/create/update/publish/archive and student-eligible read operations.
- `/api/v1/curriculum`: read concepts/topics and approved curriculum mapping.
- `/api/v1/learning/questions`: published first-party question fetch; never return the answer key.
- `/api/v1/learning/attempts`: submit an answer; server computes correctness and records event.
- `/api/v1/learning/me/mastery`: own mastery only.
- `/api/v1/learning/me/recommendations`: selected activity/question plus a human-readable reason.
- `/api/v1/learning/content/assist`: source-grounded explanation with citations and safety/quality controls.
- teacher/admin-only routes for review, publishing, and aggregate insights after RBAC is in place.

Do not commit to exact routes before inspecting existing route naming and client API conventions. All inputs need schema validation, consistent HTTP status/error shapes, request size limits, and authorization checks. Never trust a frontend-supplied `school`, `teacher`, `student`, or role field as authority.

### Privacy constraints
Use the least identifying learner reference that supports the required feature; do not add names, school identity, roll number, chat logs, or precise personal data to ML features without a justified need. Minimize logs, define retention/export/deletion behavior, and ensure real student/minor data is used only with authorization, appropriate consent and applicable school/institution requirements. Provide teacher/parent-facing transparency appropriate to the eventual setting. Do not use the data to train external models unless permitted and explicitly designed for that purpose.

---

## 6. Thirty-phase roadmap

Every phase has a scope and an acceptance gate. Complete one phase, run tests and inspect the diff, explain the expected result, and stop for review before proceeding.

### Phase 01 — Two-repository baseline inventory
**Work:** Verify the current main-branch trees, map Admin/Teacher/Student routes and sidebars, map all current backend endpoints and relevant schemas, enumerate ChemAmaze game entries and links, identify deployment/env conventions, and document known broken/legacy behavior without broad refactoring.  
**Exit gate:** A concise current-state inventory exists; all existing ChemAmaze game entries have a source record; unknown behavior is marked unknown rather than guessed.

### Phase 02 — Characterization and smoke-test baseline
**Work:** Establish reproducible local startup and smoke tests for main login flows, role dashboards, classes/subjects, and current navigation; add the first backend tests around pure logic/API behavior without reorganizing the whole app. Replace the current placeholder test command with a useful test entry point only after choosing a compatible test framework.  
**Exit gate:** Existing role navigation and key API calls have repeatable checks; the baseline limitations/failures are recorded; no feature behavior is changed unnecessarily.

### Phase 03 — Security review and environment hygiene
**Work:** Audit routes for missing authentication/authorization, inspect password flows, check how IDs and school scope are obtained, and verify that environment files do not contain secrets. Add security-specific test cases for cross-school/role access.  
**Exit gate:** A risk list is prioritized; no credential is reproduced in docs/logs; secrets are rotated if any genuine secret has already been committed; feature APIs remain blocked until required controls exist.

### Phase 04 — Correct Admin password storage
**Work:** Make Admin registration hash passwords with bcrypt and login verify with bcrypt, matching the intended existing Student/Teacher approach. Design and document a safe one-time migration for any legacy plaintext admin passwords, with backup, dry-run, idempotency, and careful hashed-password detection; do not log values.  
**Exit gate:** Tests prove registration never stores plaintext, valid/invalid logins behave correctly, and a migration rehearsal does not double-hash existing bcrypt credentials. Do not deploy a migration without backup/recovery instructions.

### Phase 05 — Establish a trusted authenticated session
**Work:** Introduce a server-verifiable session mechanism compatible with the existing frontend, preferably a signed short-lived access/session token in a HttpOnly cookie with appropriate SameSite/Secure settings for the target deployment. Return only a safe user profile. Update the shared Axios/API client to send credentials and handle expiry/logout. Keep role in Redux/localStorage as display state only.  
**Exit gate:** Login/logout/expiry tests pass; no password or bearer secret is stored in localStorage; backend requests work without trusting editable role fields; local and production cookie/CORS settings are documented.

### Phase 06 — Server-side authorization and school scoping
**Work:** Add authentication, role middleware, and reusable school/class/subject ownership checks. Protect the existing routes incrementally with regression tests; apply the strongest required checks to new routes first. Prevent object-ID guessing/IDOR across students, teachers, and schools.  
**Exit gate:** Tests prove unauthenticated access is rejected and a user cannot read/mutate another school's records or take another role's actions; the existing frontend still functions through the hardened API. Do not add learning analytics before this gate passes.

### Phase 07 — Stable API contracts and test harness
**Work:** Standardize status codes, validation errors, request validation, logging, async error handling, and endpoint tests for new modules. Create separate test settings/database; ensure logging redacts auth cookies and personal data.  
**Exit gate:** New endpoint tests can run deterministically and isolated from production/local student data; failure responses are predictable; the test command no longer always fails by design.

### Phase 08 — Learning module boundaries and route integration design
**Work:** Define a small module/folder structure consistent with the existing CommonJS/Mongoose backend and React app; map feature pages to each dashboard without changing the entire visual system. Document API ownership, frontend API calls, permission rules, error states, and the initial navigation map.  
**Exit gate:** Proposed files, routes, API payloads, and role access are reviewed before feature coding; existing school management flows remain out of scope for redesign.

### Phase 09 — GameActivity schema and invariants
**Work:** Add a separate Mongoose model for game activity records and validation/indexes on school, class, subject, teacher, state, and provider. Define referential integrity checks and archive behavior when an associated class/subject/teacher is deleted or reassigned.  
**Exit gate:** Model tests reject invalid relationships/statuses and support queries by school/class/subject/state; no existing schema is bloated with an unbounded games array.

### Phase 10 — Safe Wordwall URL validation and embed component
**Work:** Add URL validation that accepts only HTTPS Wordwall embed URLs from the approved host/path. Support pasting an official iframe snippet only by extracting and validating its `src`. Build a fixed React iframe component and fallback link.  
**Exit gate:** Tests reject arbitrary hosts, lookalike domains, unsafe schemes, malformed URLs, and arbitrary HTML; a real approved Wordwall embed works in supported browsers; no teacher text is rendered as executable HTML.

### Phase 11 — Role-scoped Game APIs
**Work:** Add list/create/update/publish/unpublish/archive endpoints using authenticated actor context. Enforce teacher scope to assigned subject/class/school and student scope to published eligible games. Never trust role/school/teacher IDs from the request body.  
**Exit gate:** API tests cover each role's allowed/denied operations and cross-school attempts; students cannot request draft/archived/unassigned games; updates produce auditable state changes.

### Phase 12 — Admin Learning & Games management
**Work:** Add admin sidebar entry and management page to filter/inspect the school's game records, view publication state, archive/unpublish, and review source URL/creator metadata.  
**Exit gate:** Admin can manage only the signed-in school's catalogue; empty/loading/error states work; all actions use secured endpoints and are tested.

### Phase 13 — Teacher My Games management
**Work:** Add teacher sidebar item/routes and a page with list/create/edit/preview/publish/unpublish/archive actions. Prefill current teacher's assigned subject/class and validate every assignment again on the backend. Include a clear instruction for obtaining the Wordwall embed URL from its official Embed UI.  
**Exit gate:** A teacher can create a game for their assigned subject/class, preview safely, publish it, and modify/archive their own eligible records; attempts to alter IDs in requests are denied.

### Phase 14 — Student Games Zone
**Work:** Add student sidebar item/routes and a responsive games catalogue filtered by current student's school/class/subject, with topic labels, activity details, embedded play view, loading/error states, and open-in-Wordwall fallback.  
**Exit gate:** A student sees only eligible published activities; unpublishing/archiving removes it from future listing; iframe URLs are rendered through the safe component; existing Student flows still work.

### Phase 15 — Migrate current ChemAmaze games as seed data
**Work:** Convert the existing game catalogue into a validated import/seed format with source labels, grades/classes, subjects, topics, original share URL, and validated embed URL. Reconcile cases where share and embed URLs differ. Import into a development school/seed dataset, not arbitrary production schools.  
**Exit gate:** Every current entry is accounted for, import is repeatable/idempotent, links are preserved where valid, and failures are reported rather than silently dropped. The old ChemAmaze repository remains intact as the original reference.

### Phase 16 — Curriculum/concept map and AI feature scope
**Work:** Define a small approved concept taxonomy for one initial science/chemistry chapter, link concepts to grade/subject/source, and review which content is permitted to use. Choose a first slice rather than enabling all classes at once.  
**Exit gate:** Concept IDs are stable and curriculum mapping/source rights are reviewed; concepts and distractors are not invented as claims about the official syllabus.

### Phase 17 — First-party question bank and quiz schema
**Work:** Add versioned question/question-option schemas with concepts, difficulty, type, status, source/provenance, reviewer status, and server-held answer keys. Seed a small teacher-reviewed question set independent of Wordwall.  
**Exit gate:** Question validators and seed tests pass; question-fetch APIs never reveal answer keys; duplicate IDs and invalid concept links are rejected.

### Phase 18 — First-party quiz UI and API
**Work:** Build a native student practice flow using the school app, including topic selection, question display, answer submission, server-verified feedback, and explanation. This is separate from the Games Zone; do not infer an answer from a Wordwall iframe.  
**Exit gate:** Students can finish an end-to-end curated quiz; server-side grading is correct for tested examples; retry, API failure, empty state, and mobile/keyboard use work.

### Phase 19 — Learning attempt events and data-quality checks
**Work:** Record pseudonymous learner reference, question version, selected option, server-derived correctness, concept, timestamp, attempt number, and optionally bounded response time when the feature has consent/need. Add deduplication/idempotency and data validation.  
**Exit gate:** Attempts are reproducible and scoped to the authenticated learner; retries do not double-count; no unnecessary PII appears in storage/logs; a data-quality report runs.

### Phase 20 — Baseline analytics and ML evaluation protocol
**Work:** Analyze quiz correctness by concept and attempt sequence. Define model targets and metrics before fitting models. Make a labeled synthetic simulator for engineering tests; mark synthetic data explicitly and keep it out of claims about real students.  
**Exit gate:** A repeatable baseline report and data splitting protocol exist; no leakage from future attempts; all data sources and labels are documented.

### Phase 21 — Bayesian Knowledge Tracing (BKT) implementation
**Work:** Implement a pure Python BKT module with configured (P(L_0)), (P(T)), (P(G)), and (P(S)). Unit-test updates after correct/incorrect attempts, parameter bounds, and edge cases. Expose no endpoint until the model's assumptions and inputs are reviewed.  
**Exit gate:** Formula-level tests and a tiny hand-calculated example pass; probabilities remain valid; the model is documented as an estimate, not a definitive grade.

### Phase 22 — Mastery persistence and service integration
**Work:** Persist concept mastery with model/parameter version and update it from first-party attempts. Integrate Python through a small internal API or deterministic inference module with timeouts and fallback, depending on measured deployment complexity.  
**Exit gate:** Replaying the same event sequence yields the expected state; event and mastery updates are consistent; model failure does not block the core quiz path; cross-learner access is denied.

### Phase 23 — Explainable adaptive recommendation policy
**Work:** Recommend published first-party question/activity candidates using mastery estimates, concept prerequisites, revision needs, and difficulty. Record the chosen item and a human-readable reason; use fixed-order/random/simple rules as baselines.  
**Exit gate:** Selection is deterministic for the same inputs, avoids unpublished or unrelated items, has a safe fallback, and is evaluated against a baseline before being called better.

### Phase 24 — Misconception diagnostics (rules first; classifier only if justified)
**Work:** Create an educator-reviewed misconception taxonomy for the first topic and map specific distractors/answer sequences to tentative hypotheses. Review label volume/quality before training a classifier; if sufficient, compare a simple model with majority/rule baselines using held-out data.  
**Exit gate:** Output language communicates uncertainty; the rule/classifier evaluation reports precision/recall/F1 and class-wise errors; if data is insufficient, document the no-go decision and keep rules.

### Phase 25 — Approved curriculum ingestion and retrieval evaluation
**Work:** Build a repeatable pipeline for permitted source material with source versions, parsing/chunking, checksums, grade/topic/concept metadata, and source-use notes. Add embeddings/retrieval behind an adapter and a manually judged query set.  
**Exit gate:** Each retrieved chunk traces to a source/version; Recall@k or a suitable metric is reported; unsupported or permission-unclear materials are excluded; costs and storage choice are documented.

### Phase 26 — Grounded learning assistant
**Work:** Add a student-facing concept explanation/ask-a-question feature using retrieval-augmented generation over approved sources. Provide references, short age-appropriate explanations, request limits, structured responses, refusal/fallback behavior, and guardrails against unsupported chemistry claims.  
**Exit gate:** Responses cite available sources, work without the LLM via curated fallback, and pass a fixed adversarial/factuality set. The interface does not claim hallucinations are impossible.

### Phase 27 — AI-generated practice-question candidates
**Work:** Generate structured question drafts tied to retrieved source passages and concept IDs. Record provider/model/prompt version, evidence IDs, answer options, answer key, and explanation. Add deterministic schema, duplicate, topic, and answer consistency checks.  
**Exit gate:** Malformed, unsupported, duplicate, wrong-scope, and failed-provider responses are handled safely; no generated content is auto-published.

### Phase 28 — Teacher review and publishing workflow for AI content
**Work:** Add teacher review of candidate questions, source evidence, validation warnings, edit/reject/approve actions, immutable published versions, and appropriate role/school scope. Published AI candidate questions enter the normal question bank and recommendation engine.  
**Exit gate:** Only authorized reviewers can publish; rejected/draft items are never served to students; provenance survives edits/attempt history; reviewers can inspect the source behind an item.

### Phase 29 — Teacher insights, evaluation, security and pilot readiness
**Work:** Add class-level aggregated concept difficulty and misconception patterns with small-group privacy safeguards. Evaluate BKT/next-response prediction against baseline metrics, generation quality separately from retrieval, and recommendation performance separately from learning outcomes. Re-test access control, iframe validation, rate limits, session expiry, CORS, dependency/security issues, logs, and backup/recovery.  
**Exit gate:** Reproducible reports include real sample sizes, provenance, metrics, uncertainty and limitations; no unsupported educational-improvement claim is made; security and privacy review passes before any real-student pilot.

### Phase 30 — Deployment, complete documentation and portfolio evidence
**Work:** Document Windows setup, environment configuration, migrations, test commands, role/permission matrix, architecture and data-flow diagrams, endpoints, model assumptions, provenance, evaluations, troubleshooting, and a demo walkthrough. Clearly separate original fellowship work, imported legacy games, and new AI/ML extensions.  
**Exit gate:** A new developer can reproduce the app and tests; the demo can show teacher-created Wordwall activity, student Games Zone, first-party quiz, mastery update, grounded answer and review/publish flow; all resume metrics are backed by actual runs.

---

## 7. Build rules for each phase

Before implementation:
1. Inspect the exact source files, default branch and current working branch. Never rely solely on README claims.
2. State phase objective, scope, out-of-scope files, assumptions, dependencies, permissions, and acceptance checks.
3. Confirm prior-phase gates actually pass.
4. Make a minimal, coherent change on the implementation branch; do not touch the default branch directly.
5. Do not add API keys or real learner data to source control.

After implementation:
1. Run the appropriate backend/frontend tests and report actual outputs.
2. Review the diff for unrelated rewrites, broken routes, changes to existing role workflows, unsafe embed handling, secrets, and data exposure.
3. Explain design and algorithm choices with enough detail to review and maintain them.
4. Give Windows-compatible run/test commands and the expected result.
5. State limitations and the next phase's entry criteria.
6. Stop for review. Do not start a later phase until the user asks to continue.

## 8. Acceptance criteria for the whole project

The new system is genuinely stronger than the original static game catalogue when:
- Wordwall games are stored as school-scoped records and assigned through authenticated teacher/admin workflows;
- all three roles see an appropriate Games Zone without crossing school/class/subject boundaries;
- the original game catalogue has been preserved and validated as seed/reference data;
- first-party quizzes record versioned, server-graded attempts;
- a tested concept mastery model influences explainable recommendations;
- grounded AI content carries source provenance and has validation plus educator review;
- evaluations compare against baselines and report their data source honestly;
- security, privacy, setup and testing are documented;
- portfolio claims distinguish existing functionality from new implementation.

A generic chatbot, an iframe collection alone, an ML score calculated only from synthetic data, or a dashboard that uses hard-coded “analytics” does not meet these criteria.
