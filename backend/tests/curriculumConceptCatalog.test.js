const test = require("node:test");
const assert = require("node:assert/strict");
const catalog = require("../seeds/curriculum-concept-catalog.json");

const CONCEPT_ID_PATTERN = new RegExp("^SCI7-MAT-ABN-[0-9]{3}$");

function conceptMap() {
    return new Map(catalog.concepts.map((concept) => [concept.conceptId, concept]));
}

function assertAcyclicPrerequisites(concepts) {
    const map = conceptMap();
    const visiting = new Set();
    const visited = new Set();

    function visit(conceptId) {
        if (visiting.has(conceptId)) {
            throw new Error("Prerequisite cycle at " + conceptId);
        }
        if (visited.has(conceptId)) return;

        const concept = map.get(conceptId);
        assert.ok(concept, "Unknown concept prerequisite: " + conceptId);
        visiting.add(conceptId);

        for (const prerequisiteId of concept.prerequisiteConceptIds) {
            visit(prerequisiteId);
        }

        visiting.delete(conceptId);
        visited.add(conceptId);
    }

    concepts.forEach((concept) => visit(concept.conceptId));
}

test("defines one versioned Class 7 Science chapter slice only", () => {
    assert.equal(catalog.schemaVersion, 1);
    assert.equal(catalog.taxonomy.taxonomyId, "NCERT-CURIOSITY-G7-SCI-CH02-ABN");
    assert.equal(catalog.taxonomy.version, "1.0.0");
    assert.equal(catalog.taxonomy.lifecycleStatus, "draft_for_teacher_review");
    assert.equal(catalog.scope.grade, 7);
    assert.equal(catalog.scope.subject, "Science");
    assert.equal(catalog.scope.textbook.chapterNumber, 2);
    assert.equal(
        catalog.scope.textbook.chapterTitle,
        "Exploring Substances: Acidic, Basic, and Neutral"
    );
    assert.deepEqual(catalog.scope.relatedLegacyGameSourceKey, "chemamaze-cbse:science:class-7:chapter-2");
});

test("concept IDs are stable, unique, scoped and versioned", () => {
    const ids = catalog.concepts.map((concept) => concept.conceptId);

    assert.equal(ids.length, 7);
    assert.equal(new Set(ids).size, ids.length);

    for (const concept of catalog.concepts) {
        assert.match(concept.conceptId, CONCEPT_ID_PATTERN);
        assert.equal(concept.conceptVersion, 1);
        assert.equal(concept.displayName.trim(), concept.displayName);
        assert.ok(concept.description.length >= 20);
        assert.equal(concept.grade, undefined, "Grade is inherited from the immutable taxonomy scope");
        assert.equal(concept.subject, undefined, "Subject is inherited from the immutable taxonomy scope");
    }
});

test("all prerequisite edges reference known concepts and form a directed acyclic graph", () => {
    const map = conceptMap();

    for (const concept of catalog.concepts) {
        assert.ok(Array.isArray(concept.prerequisiteConceptIds));
        assert.equal(new Set(concept.prerequisiteConceptIds).size, concept.prerequisiteConceptIds.length);
        assert.equal(concept.prerequisiteConceptIds.includes(concept.conceptId), false);

        for (const prerequisiteId of concept.prerequisiteConceptIds) {
            assert.ok(map.has(prerequisiteId), prerequisiteId);
        }
    }

    assertAcyclicPrerequisites(catalog.concepts);
});

test("every curriculum/source reference resolves to a catalogued source", () => {
    const sourceIds = new Set(catalog.sources.map((source) => source.sourceId));
    const conceptIds = new Set(catalog.concepts.map((concept) => concept.conceptId));

    assert.equal(sourceIds.size, catalog.sources.length);
    assert.ok(sourceIds.has("doe-delhi-class7-science-2026-27"));
    assert.ok(sourceIds.has("ncert-curiosity-grade7-science-chapter2"));

    for (const concept of catalog.concepts) {
        assert.ok(concept.sourceIds.length > 0);
        concept.sourceIds.forEach((sourceId) => assert.ok(sourceIds.has(sourceId)));
        concept.curriculumActivityRefs.forEach((activityId) =>
            assert.ok(catalog.alignment.curriculumIdentifiers.some((ref) => ref.id === activityId))
        );
    }

    for (const outcome of catalog.alignment.learningOutcomeMap) {
        assert.ok(outcome.conceptIds.length > 0);
        outcome.conceptIds.forEach((id) => assert.ok(conceptIds.has(id)));
    }
});

test("GNCT Delhi source is precisely scoped as a local 2026-27 alignment reference", () => {
    const source = catalog.sources.find((item) =>
        item.sourceId === "doe-delhi-class7-science-2026-27"
    );

    assert.equal(source.location.printedPage, 5);
    assert.equal(source.location.chapterEntry, "Chapter 2");
    assert.equal(source.location.activityReferenceRange, "2.1–2.7");
    assert.equal(new URL(source.url).hostname, "edustud.nic.in");
    assert.match(catalog.scope.alignmentQualification, /local alignment source/i);
    assert.match(catalog.scope.alignmentQualification, /not be represented as a universal CBSE/i);
});

test("NCERT textbook rights are restricted and no textbook content is authorised for in-app use", () => {
    const textbook = catalog.sources.find((item) =>
        item.sourceId === "ncert-curiosity-grade7-science-chapter2"
    );

    assert.equal(textbook.contentUse.reviewStatus, "restricted_pending_written_permission");
    assert.equal(textbook.contentUse.directLinkMayBeDisplayedInProduct, false);
    assert.equal(textbook.contentUse.textbookPdfMayBeHosted, false);
    assert.equal(textbook.contentUse.textFiguresTablesActivitiesQuestionsAnswersMayBeCopied, false);
    assert.equal(textbook.contentUse.summariesTranslationsAdaptationsOrEmbeddingsMayBeCreated, false);

    const policy = catalog.sources.find((item) =>
        item.sourceId === "ncert-textbook-copyright-notice"
    );
    assert.equal(policy.contentUse.reviewStatus, "reviewed");
    assert.equal(policy.contentUse.directLinkMayBeDisplayedInProduct, false);
});

test("taxonomy contains no generated questions, distractors, answers or copied source content", () => {
    assert.deepEqual(catalog.exclusions.contentNotCreatedInPhase16.includes("distractors or misconception labels"), true);

    for (const concept of catalog.concepts) {
        for (const forbiddenField of [
            "prompt",
            "question",
            "options",
            "correctOptionId",
            "answer",
            "distractors",
            "textbookExcerpt",
            "sourceParagraph",
            "pageImage",
        ]) {
            assert.equal(Object.hasOwn(concept, forbiddenField), false, concept.conceptId + "." + forbiddenField);
        }
    }
});

test("student-facing AI features remain disabled until their roadmap phases", () => {
    assert.deepEqual(catalog.featureScope.enabledInPhase16, []);
    assert.equal(catalog.featureScope.firstPartyLearningEvidenceOnly, true);
    assert.equal(catalog.featureScope.wordwallAsAssessmentEvidence, false);

    for (const enabled of Object.values(catalog.featureScope.hardDisabledUntilLaterPhases)) {
        assert.equal(enabled, true);
    }

    assert.equal(catalog.reviewChecklist.taxonomyApproval, "pending_educator_review");
});
