# GameActivity schema and lifecycle invariants

**Phase:** 09 — GameActivity schema and invariants  
**Implementation branch:** `feature/learning-game-zones`

## 1. Persistence boundary

Game activities remain in the dedicated `gameActivity` collection. Existing Admin, Teacher, Student, Class, and Subject schemas are not given an activities array.

Each activity stores required ObjectId references to:

- `school` → Admin
- `class` → Sclass
- `subject` → Subject
- `createdByTeacher` → Teacher

The activity also stores a validated Wordwall embed URL, provider, topic, lifecycle status, timestamps, and archive metadata. Provider remains restricted to `wordwall`; statuses remain `draft`, `published`, and `archived`.

## 2. Relationship invariant

Before a Teacher creates an activity, the controller loads the referenced Admin school, the Teacher, the Teacher's assigned Class, and the Teacher's assigned Subject from MongoDB. The shared `validateGameActivityRelationships` function verifies:

1. The Teacher and all required assignment references exist and are valid ObjectIds.
2. The Admin school exists and its ID matches the Teacher's persisted school reference.
3. The loaded Class and Subject IDs match the Teacher's persisted assignments.
4. The Class and Subject belong to the Teacher's school.
5. The Subject belongs to the Teacher's assigned Class.
6. If the Subject is already assigned to a Teacher, it must be assigned to this Teacher.

The helper is pure and unit-tested. It does not trust request-supplied school, class, subject, or teacher IDs as authority.

## 3. Indexes

Single-field indexes support school, class, subject, creator Teacher, status, and provider lookups. Compound indexes support:

- student catalogue filters by school/class/subject/status, sorted newest first;
- teacher management filters by creator/school/class/subject/status, sorted newest first.

Provider is a low-cardinality field today; its single-field index is present to satisfy provider-level filtering and future provider expansion, but query plans should be re-evaluated if the dataset grows or additional providers are introduced.

## 4. Archive metadata

When an activity is archived, the following fields are set together:

- `status: "archived"`
- `archivedAt`: server-generated timestamp
- `archiveReason`: one of `manual`, `teacher_deleted`, `teacher_reassigned`, `class_deleted`, `subject_deleted`, or `school_resources_deleted`.

Previously archived records are not rewritten by lifecycle cleanup. Their original archive timestamp and reason remain intact. Legacy archived rows may have null archive metadata; the metadata fields are additive and do not invalidate historical documents.

## 5. Lifecycle behavior

The lifecycle helper uses `updateMany` with `runValidators: true` and a filter that excludes rows already archived. This makes archive operations idempotent: retries do not overwrite the original archive reason or timestamp.

| School-management operation | GameActivity filter | Archive reason |
| --- | --- | --- |
| Delete one Class | `class` | `class_deleted` |
| Delete all Classes in a school | `school` | `school_resources_deleted` |
| Delete one Subject | `subject` | `subject_deleted` |
| Delete all Subjects in a school | `subject: { $in: subjectIds }` | `subject_deleted` |
| Delete Subjects in one Class | `subject: { $in: subjectIds }` | `subject_deleted` |
| Delete one Teacher | `createdByTeacher` | `teacher_deleted` |
| Delete multiple Teachers | `createdByTeacher: { $in: teacherIds }` | `teacher_deleted` |
| Reassign a Teacher's Subject | Teacher plus any old school/class/subject scope that differs from the new assignment | `teacher_reassigned` |
| Explicit Teacher archive action | Owned activity and expected prior state | `manual` |

Archive happens before the referenced Class, Subject, or Teacher is deleted or the Teacher assignment is changed. If archival fails, the enclosing controller catches the failure and does not proceed to the destructive operation. The operation is deliberately fail-closed.

The repository's current controllers do not use a transaction for multi-document school-management deletions. Pre-archiving avoids exposing a game whose backing assignment is being removed, but a later failure in a multi-step legacy deletion may leave the activity archived while some related school records remain. A retry is safe. Transactions are not introduced here because MongoDB deployment topology has not been verified as a replica set.

## 6. Future mutation rule

Any future code path that deletes or changes a Class, Subject, Teacher, or school-wide learning assignment must call the corresponding lifecycle operation before the mutation. A direct database write that bypasses these controllers can still create dangling references because MongoDB does not enforce foreign keys. The lifecycle service is the application-level integrity boundary; keep its use centralized and tested.

This phase does not add edit/unpublish/admin GameActivity APIs, does not change existing route URLs, and does not infer Wordwall score/answer telemetry.

## 7. Legacy source provenance and import identity (Phase 15)

Normal Teacher-created GameActivity documents do not require legacy provenance. A ChemAmaze-imported record has an optional `legacySource` subdocument containing:

- a deterministic source key for source repository + subject + grade + chapter;
- source label and repository;
- the pinned source commit revision and relative file path;
- source grade and chapter.

The nested metadata and parent `legacySource` path are immutable after creation. The import manifest's original share URL and embed URL are stored separately in the existing `originalUrl` and `embedUrl` fields. The embed URL uses the same strict HTTPS Wordwall validator as normal Teacher-created records. The import validator separately requires an exact HTTPS Wordwall `/play/<id>/<id>/<id>` share URL; it never tries to derive one URL from the other.

A partial unique compound index on `school` and `legacySource.sourceKey` protects one copy of each source record per school. The partial filter applies only when a string legacy source key exists, so ordinary GameActivity records remain outside that unique keyspace.

The importer is a development-only, explicit command. It requires `NODE_ENV=development`, the exact MongoDB database name `school_management_dev`, and a separate confirmation token for writes. A target mapping must explicitly name one existing school and the existing Class, Subject and Teacher records for all six grade/subject combinations. The importer resolves those documents from MongoDB and reuses `validateGameActivityRelationships`; client/local mapping values are selectors, not permission authority. Science and Mathematics for a grade must point to the same Class record.

The import plan is read-only. It creates records as drafts and never auto-publishes them. Re-running an import skips identical source records and does not overwrite their lifecycle state. If source content or scope differs from an existing imported record, the plan reports a conflict and blocks new inserts until a human reviews the discrepancy. Inserts are sequential; partial failures are reported per source key and a subsequent run can resume missing entries. The unique index and duplicate-key reconciliation protect concurrent/repeated attempts. No production-database import command is provided.

The canonical legacy source is `dikshaforsure/ChemAmaze-cbse`, pinned to commit `513f7c254597d291446d31b45864c3856c518354` and `script.js` blob `1e32228d9bd7ec583bb2e2b81f2688e7aab1b0e9`. It contains 18 primary Wordwall records (Science and Mathematics, Classes 6–8, three chapters each). A related StemGames derivative has the same 18 primary records plus six supplemental entries; the non-Wordwall resources and unresolved placeholders are recorded separately and excluded from this Wordwall-only import.

## 8. Tests

Run from `backend`:

~~~powershell
npm test
~~~

The new tests validate the Mongoose schema without a live database, exercise relationship checks and lifecycle query construction with injected model doubles, and verify that controller-level archival runs before destructive operations or reassignment. A failure-path test confirms that a failed archive prevents the Class deletion. Existing tests continue to use the isolated test environment.
