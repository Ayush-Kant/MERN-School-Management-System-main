# AI Learning Studio — Phase 16 curriculum and concept scope

**Implementation branch:** `feature/learning-game-zones`  
**Phase:** 16 — Curriculum/concept map and AI feature scope  
**Initial slice:** Class 7 Science, *Curiosity*, Chapter 2 — *Exploring Substances: Acidic, Basic, and Neutral*  
**Taxonomy version:** 1.0.0  
**Review state:** Draft for educator approval; no student-facing content is enabled by this phase.

## 1. Why this slice

The ChemAmaze catalogue already has a Class 7 Science entry for this topic. The current Directorate of Education, GNCT of Delhi, Class 7 Science annual syllabus for 2026–27 identifies the book as *Curiosity*, lists this as Chapter 2, and supplies learning-outcome and activity references 2.1–2.7. That gives this phase a concrete curriculum anchor without expanding to all 18 legacy games.

**Qualification:** The GNCT Delhi syllabus is a local official alignment reference. It must not be described as a universal CBSE prescription for every school or state. The taxonomy is explicitly scoped to Class 7 Science and this one chapter.

## 2. Concept map

The stable IDs are stored in `backend/seeds/curriculum-concept-catalog.json`. They are application-owned identifiers, not NCERT identifiers. Their meanings are original, concise learning-intent descriptors.

| Stable concept ID | Concept | Coverage boundary |
|---|---|---|
| `SCI7-MAT-ABN-001` | Acidic, basic and neutral categories | Classify approved samples using observable evidence |
| `SCI7-MAT-ABN-002` | Indicators as evidence | Interpret an indicator observation |
| `SCI7-MAT-ABN-003` | Litmus observations | Red/blue litmus tests |
| `SCI7-MAT-ABN-004` | Colour-based natural indicators | Teacher-prepared colour indicator investigations |
| `SCI7-MAT-ABN-005` | Olfactory indicator observations | Teacher-supervised odour-indicator demonstration |
| `SCI7-MAT-ABN-006` | Neutralisation investigation | Controlled acid/base demonstration |
| `SCI7-MAT-ABN-007` | Acid–base ideas in everyday contexts | Only educator-checked examples |

Prerequisites are intentionally small and acyclic: classification precedes indicator interpretation; indicator interpretation precedes the specific indicator methods; classification and indicator evidence precede the neutralisation investigation; educator-approved everyday applications follow neutralisation.

No pH calculations, strong/weak comparisons, unsupported reaction equations, unverified household classifications, or out-of-chapter extensions are added. No distractors or misconception labels are invented in Phase 16.

## 3. Curriculum mapping and source provenance

### Alignment source

**Directorate of Education, Government of NCT of Delhi — Annual Syllabus 2026–27, Class 7 Science, Book: Curiosity.**

The mapping records the printed page 5 chapter entry and only the syllabus activity identifiers (2.1–2.7). The taxonomy stores its own paraphrased concept descriptors; it does not store the syllabus PDF or reproduce its full learning-outcome text. The source URL and exact location are retained for audit.

### Textbook reference and permissions decision

**NCERT — Curiosity, Textbook of Science for Grade 7, Chapter 2.**

The NCERT textbook portal states that the textbooks are copyrighted, prohibits republication and use of the online textbooks as part of digital content packages or software, and says links may be provided with written permission. Therefore this implementation adopts the conservative rule:

- No NCERT textbook PDF, page image, figure, table, activity text, exercise, question, answer key or explanation is copied into the repository or application.
- No textbook-derived summary, translation, adaptation, embedding or retrieval index is created.
- The chapter reference is retained as internal provenance metadata only. It must not be exposed as a direct in-app textbook link until written permission is obtained.
- Future curriculum retrieval or AI question generation must exclude NCERT textbook content unless the required written permission is documented first.

The GNCT Delhi syllabus is also kept as a citation/alignment reference only. An explicit reuse licence was not established during this review, so the PDF is not copied or bundled. Its source attribution and page/activity identifiers are retained.

These are conservative engineering/content-use controls, not a legal opinion or a substitute for a written permission review.

## 4. Safety and educational boundaries

- Do not ask a student to taste, directly touch, or independently mix unknown household substances. The syllabus's taste/touch comparison is not turned into a student self-experiment in this product.
- Litmus, plant-colour and olfactory indicator work is framed as teacher-approved observation using prepared samples.
- Neutralisation is a teacher-supervised demonstration using selected dilute materials. Never provide an open-ended recipe for mixing household chemicals.
- A real-life example must be checked by an educator before it becomes a student-facing question or explanation.
- Wordwall launch, dwell time, iframe state, or external game behaviour is not quiz evidence and must never update concept mastery.

## 5. AI feature scope decision

Phase 16 enables no runtime AI feature. It establishes the one chapter and concept IDs that later phases may use.

| Capability | Decision |
|---|---|
| Stable concept catalogue | Defined as review-ready metadata |
| First-party questions | Phase 17; teacher-reviewed and independently authored |
| Native quiz and server grading | Phase 18 |
| Learning-attempt events | Phase 19; minimum necessary learner data only |
| BKT/mastery | Phase 21 onward; only after first-party attempt data and baseline checks |
| Curriculum ingestion/RAG | Phase 25 onward; only from rights-cleared sources |
| Student grounded assistant | Phase 26; no NCERT-textbook retrieval without written permission |
| AI question candidates | Phase 27; draft only, tied to allowed evidence |
| Teacher review and publishing | Phase 28 |

The following are explicitly disabled/not implemented: student quiz UI, automated question generation, open-ended AI assistant, textbook RAG, learner mastery scores, adaptive recommendations, Wordwall score inference.

This keeps the first slice small, testable, and compatible with the existing separation between Games Zone and first-party Learning Studio.

## 6. Relationship to existing quiz code

The current `learningQuizSchema.js` and `learning-quiz-controller.js` use a free-text `concept` label. Phase 16 does not change those runtime contracts. Phase 17 must add the concept-ID validation/versioning contract before new first-party questions are expected to use this taxonomy. Do not silently accept arbitrary client concept strings as catalogue IDs.

No concept API, Mongoose concept model, route, UI, quiz, question, distractor, answer key, or AI provider is added in Phase 16.

## 7. Approval and exit gate

The taxonomy is source-mapped and rights-reviewed conservatively, but its academic approval remains **pending educator review**. A teacher/science educator should confirm:
1. The seven concept boundaries match the chapter taught to the intended Class 7 cohort.
2. The local GNCT Delhi mapping is appropriate for the target school; schools following a different board/state sequence should map their own approved source before enabling this taxonomy.
3. The indicator/neutralisation safety wording is suitable for the school's lab policy.
4. Any later question and distractor is original, fact-checked, and mapped to one stable concept ID.

No claim is made that a teacher has approved the taxonomy. Phase 17 question-bank authoring should wait for that review.

## Source references

- [GNCT Delhi Directorate of Education — Class 7 Science Annual Syllabus 2026–27](https://edustud.nic.in/edu/Syllabus_2026_27/7/7_SCIENCE_SYLLABUS_2026_27_EM.pdf), printed page 5.
- [NCERT textbook catalogue](https://ncert.nic.in/textbook.php) and internal chapter reference `https://ncert.nic.in/textbook/pdf/gecu102.pdf`.
- [NCERT textbook copyright and terms notice](https://ncert.nic.in/textbook.php).

