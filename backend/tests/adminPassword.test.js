const test = require("node:test");
const assert = require("node:assert/strict");
const {
    hashAdminPassword,
    verifyAdminPassword,
} = require("../utils/adminPassword.js");

test("hashes new Admin passwords instead of storing the original value", async () => {
    const password = "Admin-Password-123!";
    const hashedPassword = await hashAdminPassword(password);

    assert.notEqual(hashedPassword, password);
    assert.match(hashedPassword, /^\$2[aby]\$/);

    const result = await verifyAdminPassword(password, hashedPassword);
    assert.deepEqual(result, { valid: true, needsRehash: false });
});

test("rejects an incorrect password for a bcrypt-backed Admin account", async () => {
    const hashedPassword = await hashAdminPassword("Correct-Password-123!");

    const result = await verifyAdminPassword("Wrong-Password", hashedPassword);

    assert.deepEqual(result, { valid: false, needsRehash: false });
});

test("recognizes legacy plaintext credentials and requests an upgrade only after a match", async () => {
    const validAttempt = await verifyAdminPassword("legacy-password", "legacy-password");
    const invalidAttempt = await verifyAdminPassword("wrong-password", "legacy-password");

    assert.deepEqual(validAttempt, { valid: true, needsRehash: true });
    assert.deepEqual(invalidAttempt, { valid: false, needsRehash: false });
});

test("upgraded legacy credentials work as bcrypt hashes and no longer request rehashing", async () => {
    const legacyPassword = "legacy-password";
    const firstCheck = await verifyAdminPassword(legacyPassword, legacyPassword);
    assert.equal(firstCheck.needsRehash, true);

    const upgradedHash = await hashAdminPassword(legacyPassword);
    const secondCheck = await verifyAdminPassword(legacyPassword, upgradedHash);

    assert.deepEqual(secondCheck, { valid: true, needsRehash: false });
});

test("rejects missing or non-string password inputs", async () => {
    assert.deepEqual(
        await verifyAdminPassword("", "stored-value"),
        { valid: false, needsRehash: false }
    );
    assert.deepEqual(
        await verifyAdminPassword("password", null),
        { valid: false, needsRehash: false }
    );
    await assert.rejects(
        () => hashAdminPassword(""),
        { name: "TypeError" }
    );
});
