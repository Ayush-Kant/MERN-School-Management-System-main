const bcrypt = require("bcrypt");

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

async function hashAdminPassword(password) {
    if (typeof password !== "string" || password.length === 0) {
        throw new TypeError("A non-empty password string is required");
    }

    return bcrypt.hash(password, 10);
}

async function verifyAdminPassword(candidatePassword, storedPassword) {
    if (
        typeof candidatePassword !== "string" ||
        candidatePassword.length === 0 ||
        typeof storedPassword !== "string" ||
        storedPassword.length === 0
    ) {
        return { valid: false, needsRehash: false };
    }

    if (BCRYPT_HASH_PATTERN.test(storedPassword)) {
        return {
            valid: await bcrypt.compare(candidatePassword, storedPassword),
            needsRehash: false,
        };
    }

    // A matching non-bcrypt value is treated as a legacy plaintext password.
    // The controller immediately replaces it with a bcrypt hash after login.
    const valid = candidatePassword === storedPassword;
    return {
        valid,
        needsRehash: valid,
    };
}

module.exports = {
    hashAdminPassword,
    verifyAdminPassword,
};
