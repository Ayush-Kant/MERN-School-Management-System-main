const test = require("node:test");
const assert = require("node:assert/strict");
const catalog = require("../seeds/chemamaze-cbse-games.json");
const {
    EXPECTED_RECORD_COUNT,
    validateWordwallShareUrl,
    validateLegacyGameCatalog,
} = require("../services/learning/legacyGameCatalog");

test("validates the complete pinned ChemAmaze CBSE catalog", () => {
    const validated = validateLegacyGameCatalog(catalog);

    assert.equal(validated.records.length, EXPECTED_RECORD_COUNT);
    assert.equal(validated.source.repository, "dikshaforsure/ChemAmaze-cbse");
    assert.equal(validated.source.revision, "513f7c254597d291446d31b45864c3856c518354");

    for (const subject of ["Science", "Mathematics"]) {
        for (const grade of [6, 7, 8]) {
            const group = validated.records.filter((record) =>
                record.subject === subject && record.grade === grade
            );
            assert.equal(group.length, 3, `Expected three ${subject} records for Class ${grade}`);
        }
    }
});

test("preserves each legacy share URL and validates every embed URL", () => {
    const validated = validateLegacyGameCatalog(catalog);

    validated.records.forEach((record, index) => {
        assert.equal(record.originalUrl, catalog.records[index].originalUrl);
        assert.match(record.embedUrl, /^https:\/\/wordwall\.net\/embed\//);
    });
});

test("rejects non-Wordwall, non-HTTPS, and lookalike share URLs", () => {
    for (const originalUrl of [
        "http://wordwall.net/play/114428/879/247",
        "https://wordwall.net.evil.example/play/114428/879/247",
        "https://wayground.com/join/game/123",
        "https://wordwall.net/embed/123",
        "https://wordwall.net:8443/play/114428/879/247",
    ]) {
        assert.throws(
            () => validateWordwallShareUrl(originalUrl),
            /HTTPS Wordwall/
        );
    }
});

test("rejects an unsafe embed URL before it can be imported", () => {
    const invalidCatalog = structuredClone(catalog);
    invalidCatalog.records[0].embedUrl = "https://evil.example/embed/123";

    assert.throws(
        () => validateLegacyGameCatalog(invalidCatalog),
        /Wordwall/
    );
});

test("rejects a duplicate source key and an incomplete catalog", () => {
    const duplicateCatalog = structuredClone(catalog);
    duplicateCatalog.records[1] = structuredClone(duplicateCatalog.records[0]);

    assert.throws(
        () => validateLegacyGameCatalog(duplicateCatalog),
        /Duplicate legacy sourceKey/
    );

    const incompleteCatalog = structuredClone(catalog);
    incompleteCatalog.records.pop();

    assert.throws(
        () => validateLegacyGameCatalog(incompleteCatalog),
        /exactly 18 primary records/
    );
});

test("rejects catalog metadata that no longer points to a pinned Git source", () => {
    const invalidCatalog = structuredClone(catalog);
    invalidCatalog.source.revision = "main";

    assert.throws(
        () => validateLegacyGameCatalog(invalidCatalog),
        /full 40-character Git commit\/blob SHAs/
    );
});

test("rejects topic/title drift so the chapter and source topic stay aligned", () => {
    const invalidCatalog = structuredClone(catalog);
    invalidCatalog.records[0].title = "Different title";

    assert.throws(
        () => validateLegacyGameCatalog(invalidCatalog),
        /preserve the chapter and topic labels/
    );
});
