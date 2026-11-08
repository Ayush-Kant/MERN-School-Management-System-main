const { validateWordwallEmbedUrl } = require("../../utils/wordwallUrl");

const CATALOG_SCHEMA_VERSION = 1;
const EXPECTED_SUBJECTS = Object.freeze(["Science", "Mathematics"]);
const EXPECTED_GRADES = Object.freeze([6, 7, 8]);
const EXPECTED_CHAPTERS_PER_GROUP = 3;
const EXPECTED_RECORD_COUNT =
    EXPECTED_SUBJECTS.length * EXPECTED_GRADES.length * EXPECTED_CHAPTERS_PER_GROUP;
const OBJECT_ID_PATTERN = /^[a-f\\d]{24}$/i;
const SHA_PATTERN = /^[a-f\\d]{40}$/i;
const SHARE_PATH_PATTERN = /^\\/play\\/\\d+\\/\\d+\\/\\d+\\/?$/;

function requireString(value, label, maxLength) {
    if (
        typeof value !== "string" ||
        value.trim().length === 0 ||
        value.trim().length > maxLength
    ) {
        throw new TypeError(`${label} must be a non-empty string of at most ${maxLength} characters`);
    }

    return value.trim();
}

function validateWordwallShareUrl(value) {
    const originalUrl = requireString(value, "originalUrl", 2048);

    let parsed;
    try {
        parsed = new URL(originalUrl);
    } catch {
        throw new TypeError("originalUrl must be a valid Wordwall share URL");
    }

    if (
        parsed.protocol !== "https:" ||
        !["wordwall.net", "www.wordwall.net"].includes(parsed.hostname.toLowerCase()) ||
        parsed.username ||
        parsed.password ||
        parsed.port ||
        parsed.hash ||
        !SHARE_PATH_PATTERN.test(parsed.pathname)
    ) {
        throw new TypeError("originalUrl must be an HTTPS Wordwall /play/<id>/<id>/<id> share URL");
    }

    // Return the exact source string rather than reconstructing it so the
    // legacy share link remains preserved in the import manifest/database.
    return originalUrl;
}

function validateCatalogSource(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
        throw new TypeError("Catalog source metadata is required");
    }

    const label = requireString(source.label, "source.label", 120);
    const repository = requireString(source.repository, "source.repository", 200);
    const repositoryUrl = requireString(source.repositoryUrl, "source.repositoryUrl", 500);
    const branch = requireString(source.branch, "source.branch", 100);
    const revision = requireString(source.revision, "source.revision", 40);
    const path = requireString(source.path, "source.path", 240);
    const blobSha = requireString(source.blobSha, "source.blobSha", 40);

    if (!/^[a-zA-Z0-9_.-]+\\/[a-zA-Z0-9_.-]+$/.test(repository)) {
        throw new TypeError("source.repository must be an owner/repository name");
    }
    if (!/^https:\\/\\/github\\.com\\/[a-zA-Z0-9_.-]+\\/[a-zA-Z0-9_.-]+$/.test(repositoryUrl)) {
        throw new TypeError("source.repositoryUrl must be the canonical GitHub repository URL");
    }
    if (!SHA_PATTERN.test(revision) || !SHA_PATTERN.test(blobSha)) {
        throw new TypeError("source revision and blobSha must be full 40-character Git commit/blob SHAs");
    }
    if (path.startsWith("/") || path.split(/[\\\\/]/).includes("..")) {
        throw new TypeError("source.path must be a safe repository-relative path");
    }

    return { label, repository, repositoryUrl, branch, revision, path, blobSha };
}

function validateLegacyGameCatalog(catalog) {
    if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
        throw new TypeError("Legacy game catalog must be an object");
    }
    if (catalog.schemaVersion !== CATALOG_SCHEMA_VERSION) {
        throw new TypeError(`Legacy game catalog schemaVersion must be ${CATALOG_SCHEMA_VERSION}`);
    }
    if (!Array.isArray(catalog.records) || catalog.records.length !== EXPECTED_RECORD_COUNT) {
        throw new TypeError(`ChemAmaze CBSE catalog must contain exactly ${EXPECTED_RECORD_COUNT} primary records`);
    }

    const source = validateCatalogSource(catalog.source);
    const sourceKeys = new Set();
    const originalUrls = new Set();
    const embedUrls = new Set();
    const groupCounts = new Map();

    const records = catalog.records.map((record, index) => {
        const label = `records[${index}]`;
        if (!record || typeof record !== "object" || Array.isArray(record)) {
            throw new TypeError(`${label} must be an object`);
        }

        const subject = requireString(record.subject, `${label}.subject`, 40);
        const grade = Number(record.grade);
        const classLabel = requireString(record.classLabel, `${label}.classLabel`, 40);
        const chapter = requireString(record.chapter, `${label}.chapter`, 40);
        const topic = requireString(record.topic, `${label}.topic`, 160);
        const title = requireString(record.title, `${label}.title`, 120);
        const sourceKey = requireString(record.sourceKey, `${label}.sourceKey`, 180);
        const originalUrl = validateWordwallShareUrl(record.originalUrl);
        const embedUrl = validateWordwallEmbedUrl(record.embedUrl);

        if (!EXPECTED_SUBJECTS.includes(subject)) {
            throw new TypeError(`${label}.subject must be Science or Mathematics`);
        }
        if (!EXPECTED_GRADES.includes(grade) || String(record.grade) !== String(grade)) {
            throw new TypeError(`${label}.grade must be 6, 7, or 8`);
        }
        if (classLabel !== `Class ${grade}`) {
            throw new TypeError(`${label}.classLabel must match its grade (Class ${grade})`);
        }

        const chapterMatch = chapter.match(/^Chapter ([1-3])$/);
        if (!chapterMatch) {
            throw new TypeError(`${label}.chapter must be Chapter 1, Chapter 2, or Chapter 3`);
        }
        const expectedKey = `chemamaze-cbse:${subject.toLowerCase()}:class-${grade}:chapter-${chapterMatch[1]}`;
        if (sourceKey !== expectedKey) {
            throw new TypeError(`${label}.sourceKey must be the deterministic key ${expectedKey}`);
        }
        if (title !== `${chapter}: ${topic}`) {
            throw new TypeError(`${label}.title must preserve the chapter and topic labels`);
        }

        if (sourceKeys.has(sourceKey)) {
            throw new TypeError(`Duplicate legacy sourceKey: ${sourceKey}`);
        }
        if (originalUrls.has(originalUrl)) {
            throw new TypeError(`Duplicate legacy originalUrl: ${originalUrl}`);
        }
        if (embedUrls.has(embedUrl)) {
            throw new TypeError(`Duplicate legacy embedUrl: ${embedUrl}`);
        }

        sourceKeys.add(sourceKey);
        originalUrls.add(originalUrl);
        embedUrls.add(embedUrl);

        const groupKey = `${grade}|${subject}`;
        groupCounts.set(groupKey, (groupCounts.get(groupKey) || 0) + 1);

        return {
            sourceKey,
            subject,
            grade,
            classLabel,
            chapter,
            topic,
            title,
            originalUrl,
            embedUrl,
        };
    });

    for (const grade of EXPECTED_GRADES) {
        for (const subject of EXPECTED_SUBJECTS) {
            const key = `${grade}|${subject}`;
            if (groupCounts.get(key) !== EXPECTED_CHAPTERS_PER_GROUP) {
                throw new TypeError(
                    `Catalog must contain exactly ${EXPECTED_CHAPTERS_PER_GROUP} chapters for Class ${grade} ${subject}`
                );
            }
        }
    }

    return {
        schemaVersion: CATALOG_SCHEMA_VERSION,
        source,
        records,
    };
}

module.exports = {
    CATALOG_SCHEMA_VERSION,
    EXPECTED_RECORD_COUNT,
    EXPECTED_SUBJECTS,
    EXPECTED_GRADES,
    validateWordwallShareUrl,
    validateCatalogSource,
    validateLegacyGameCatalog,
};
