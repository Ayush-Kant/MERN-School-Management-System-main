const test = require("node:test");
const assert = require("node:assert/strict");
const GameActivity = require("../models/gameActivitySchema.js");

const IDS = {
    school: "aaaaaaaaaaaaaaaaaaaaaaaa",
    class: "bbbbbbbbbbbbbbbbbbbbbbbb",
    subject: "cccccccccccccccccccccccc",
    createdByTeacher: "dddddddddddddddddddddddd",
};

function makeActivity(overrides = {}) {
    return new GameActivity({
        title: "Fractions Challenge",
        embedUrl: "https://wordwall.net/embed/123456",
        ...IDS,
        ...overrides,
    });
}

test("valid GameActivity records keep safe defaults and validate successfully", async () => {
    const activity = makeActivity();

    await activity.validate();

    assert.equal(activity.provider, "wordwall");
    assert.equal(activity.status, "draft");
    assert.equal(activity.unpublishedAt, null);
    assert.equal(activity.archivedAt, null);
    assert.equal(activity.archiveReason, null);
    assert.equal(activity.title, "Fractions Challenge");
});

test("GameActivity requires all four school-scope and creator references", async () => {
    for (const field of ["school", "class", "subject", "createdByTeacher"]) {
        const activity = makeActivity({ [field]: undefined });

        await assert.rejects(
            activity.validate(),
            (error) => error.name === "ValidationError" &&
                Object.hasOwn(error.errors, field)
        );
    }
});

test("GameActivity rejects malformed ObjectId references", async () => {
    for (const field of ["school", "class", "subject", "createdByTeacher"]) {
        const activity = makeActivity({ [field]: "not-an-object-id" });

        await assert.rejects(
            activity.validate(),
            (error) => error.name === "ValidationError" &&
                Object.hasOwn(error.errors, field)
        );
    }
});

test("GameActivity rejects unsupported providers and lifecycle states", async () => {
    const invalidProvider = makeActivity({ provider: "unknown-provider" });
    await assert.rejects(invalidProvider.validate(), (error) =>
        error.name === "ValidationError" && Boolean(error.errors.provider)
    );

    const invalidStatus = makeActivity({ status: "pending" });
    await assert.rejects(invalidStatus.validate(), (error) =>
        error.name === "ValidationError" && Boolean(error.errors.status)
    );
});

test("GameActivity accepts only the approved Wordwall embed URL format", async () => {
    const activity = makeActivity({ embedUrl: "https://wordwall.example.com/embed/123456" });

    await assert.rejects(activity.validate(), (error) =>
        error.name === "ValidationError" && Boolean(error.errors.embedUrl)
    );
});

test("archive metadata is constrained to the supported lifecycle reasons", async () => {
    const invalidReason = makeActivity({
        status: "archived",
        archivedAt: new Date("2026-11-02T00:00:00.000Z"),
        archiveReason: "deleted-for-unknown-reason",
    });

    await assert.rejects(invalidReason.validate(), (error) =>
        error.name === "ValidationError" && Boolean(error.errors.archiveReason)
    );

    const validReason = makeActivity({
        status: "archived",
        archivedAt: new Date("2026-11-02T00:00:00.000Z"),
        archiveReason: "class_deleted",
    });
    await validReason.validate();
});

test("GameActivity indexes support scope, creator, status, and provider lookups", () => {
    const indexes = GameActivity.schema.indexes().map(([keys]) => keys);

    for (const field of [
        "school",
        "class",
        "subject",
        "createdByTeacher",
        "status",
        "provider",
    ]) {
        assert.ok(
            indexes.some((keys) =>
                Object.keys(keys).length === 1 && keys[field] === 1
            ),
            `Expected a single-field index for ${field}`
        );
    }

    assert.ok(indexes.some((keys) =>
        keys.school === 1 &&
        keys.class === 1 &&
        keys.subject === 1 &&
        keys.status === 1 &&
        keys.createdAt === -1
    ));

    assert.ok(indexes.some((keys) =>
        keys.createdByTeacher === 1 &&
        keys.school === 1 &&
        keys.class === 1 &&
        keys.subject === 1 &&
        keys.status === 1 &&
        keys.createdAt === -1
    ));
});
