# ChemAmaze CBSE legacy game import

**Phase:** 15 — Migrate current ChemAmaze games as seed data  
**Scope:** Development-only import of the canonical legacy Wordwall catalogue. This utility does not import into a production school or publish any game.

## Source audit and coverage

The primary source of record is [dikshaforsure/ChemAmaze-cbse](https://github.com/dikshaforsure/ChemAmaze-cbse), file \`script.js\`, pinned to:

- Branch: \`main\`
- Commit: \`513f7c254597d291446d31b45864c3856c518354\`
- File blob: \`1e32228d9bd7ec583bb2e2b81f2688e7aab1b0e9\`

The source catalogue contains exactly 18 primary Wordwall records:
- Science: Classes 6, 7 and 8, three chapters per class (9 records).
- Mathematics: Classes 6, 7 and 8, three chapters per class (9 records).

The import manifest preserves each subject, grade/class label, chapter, topic, original share URL, and exact iframe \`src\` URL. It does not infer an embed URL from a share URL. Each embed URL is independently validated against the application's HTTPS Wordwall host/path allowlist.

A separate repository, [StemGames/ChemAmaze-cbseGames](https://github.com/StemGames/ChemAmaze-cbseGames), contains the same 18 primary records plus six entries in an additional-games list. The primary records were compared field-by-field (subject, grade, chapter, topic, share URL, embed URL) and all 18 match. The six supplemental entries are retained in \`seeds/chemamaze-supplemental-review.json\`, not silently dropped:
- Class 6 Science crossword: Google Drive file, not a Wordwall embed.
- Class 7 Science Maze-Chase and Class 8 Science Whack-a-mole: Wayground links, a provider not supported by the current Wordwall-only GameActivity schema.
- Class 6/7/8 Mathematics: three literal placeholder strings, not working URLs.

These six derivative-only entries need separate provider/link review before they can be migrated. They are not part of the canonical source-of-record Wordwall import.

## What gets created

Each of the 18 imported GameActivity records contains:
- A title that preserves the source chapter and topic.
- The source topic, original Wordwall share URL, and separately validated Wordwall embed URL.
- Database references to the selected development school, class, subject, and a Teacher already assigned to that exact scope.
- \`status: "draft"\`; the importer never auto-publishes legacy content.
- Immutable \`legacySource\` provenance: stable source key, source label, repository, commit revision, file path, grade and chapter.

The compound unique partial index on \`school + legacySource.sourceKey\` protects the per-school import identity without changing uniqueness for normal Teacher-created records. The importer skips unchanged records on rerun. It never overwrites an existing record. If a seeded record's content/scope differs from the manifest, the run reports a conflict and blocks new inserts until the discrepancy is reviewed.

## Prepare a development target mapping

The importer requires one existing development school with the required Class, Subject and Teacher records already set up. It does not create or modify those school-management records.

From the \`backend\` directory in Windows PowerShell:

~~~powershell
Copy-Item .\seeds\chemamaze-targets.example.json .\seeds\chemamaze-targets.local.json
notepad .\seeds\chemamaze-targets.local.json
~~~

Replace every placeholder ObjectId with IDs from your **development** database:
- \`schoolId\`: the development Admin/school record.
- Six assignment entries: \`6|Science\`, \`6|Mathematics\`, \`7|Science\`, \`7|Mathematics\`, \`8|Science\`, \`8|Mathematics\`.
- Each entry's \`grade\` must match its key.
- \`classId\` and \`className\` must identify the exact same class record; \`className\` must exactly match the database's \`sclassName\`.
- \`subjectId\` must be the named subject in that school/class.
- \`teacherId\` must be a persisted Teacher whose current school/class/subject assignment matches that mapping. If the Subject record has a Teacher assigned, it must match too.

The target file is ignored by Git because it contains local school/teacher IDs. Do not commit it.

## Safe dry-run and import

Use a dedicated local development database named exactly \`school_management_dev\`. The running backend's normal database is not changed by these commands.

~~~powershell
# Still in backend/
$env:NODE_ENV = "development"
$env:MONGO_URL = "mongodb://127.0.0.1:27017/school_management_dev"

# Validate the checked-in catalog without connecting to MongoDB.
npm run seed:chemamaze:validate

# Resolve all six school/class/subject/teacher mappings and inspect the plan.
npm run seed:chemamaze:dry-run
~~~

The dry-run must report 18 records, zero conflicts, and a create/unchanged count appropriate to the current development database. It performs no GameActivity writes.

Only after reviewing the dry-run, run the explicit development import:

~~~powershell
$env:CHEMAMAZE_SEED_CONFIRM = "IMPORT_CHEMAMAZE_TO_SCHOOL_MANAGEMENT_DEV"
npm run seed:chemamaze:apply
~~~

Expected first clean import: 18 inserted, 0 unchanged, 0 failures. A repeat with no intervening edits: 0 inserted, 18 unchanged, 0 failures. The exact output from the user's database is not known until these commands are run locally.

The script independently checks \`NODE_ENV\`, parses the connected database name, and verifies the live Mongoose connection is still \`school_management_dev\`. \`--apply\` additionally requires the confirmation token. The database unique index is initialized before the plan is applied. Inserts are sequential and resumable: if the database fails part-way through, the next run identifies already inserted source keys and only proposes missing records. It does not use a multi-document transaction because the deployment's replica-set topology has not been established.

## Validation commands

From \`backend\`:

~~~powershell
npm run seed:chemamaze:validate
npm test
~~~

The regular backend test suite includes catalog-shape/URL validation, unsafe-link rejection, schema provenance/index validation, development guard checks, assignment-scope checks, draft-only import documents, idempotent rerun behavior and edited-record conflict handling.

## Important limits

- This phase preserves and imports catalogue metadata and Wordwall links; it does not copy Wordwall activity content or infer Wordwall scores.
- Imported items stay drafts until a Teacher explicitly reviews and publishes them through My Games.
- No import into production or a real school is permitted by this script.
- Wordwall links are validated syntactically, but live availability, ownership and browser playback still require manual checks.
- The source legacy repository is reference-only and is not modified by this phase.
