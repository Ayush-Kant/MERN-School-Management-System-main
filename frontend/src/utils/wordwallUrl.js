const ALLOWED_HOSTS = new Set(["wordwall.net", "www.wordwall.net"]);
const EMBED_PATH_PATTERN = /^\/embed\/[a-z\d_-]+\/?$/i;

export function extractWordwallEmbedSrc(value) {
    if (typeof value !== "string") {
        throw new TypeError("Wordwall embed input must be a string");
    }

    const snippet = value.trim();
    const iframeMatch = snippet.match(/^<iframe\b([^>]*)\/?>(?:\s*<\/iframe>)?$/i);
    if (!iframeMatch) {
        throw new TypeError("Paste one complete Wordwall iframe snippet or its embed URL");
    }

    const srcAttributes = [...iframeMatch[1].matchAll(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)];
    if (srcAttributes.length !== 1) {
        throw new TypeError("The iframe snippet must contain exactly one quoted src attribute");
    }

    const src = srcAttributes[0][1] ?? srcAttributes[0][2];
    if (!src || !src.trim()) {
        throw new TypeError("The iframe snippet does not contain a valid src URL");
    }

    return src.trim().replace(/&amp;/gi, "&");
}

export function normalizeWordwallEmbedInput(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw new TypeError("Wordwall embed URL is required");
    }

    const input = value.trim();
    const candidate = input.startsWith("<")
        ? extractWordwallEmbedSrc(input)
        : input;

    return validateWordwallEmbedUrl(candidate);
}

export function validateWordwallEmbedUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw new TypeError("Wordwall embed URL is required");
    }

    let parsed;
    try {
        parsed = new URL(value.trim());
    } catch {
        throw new TypeError("Enter a valid Wordwall embed URL");
    }

    if (parsed.protocol !== "https:") {
        throw new TypeError("Wordwall embed URL must use HTTPS");
    }

    if (parsed.username || parsed.password) {
        throw new TypeError("Credentials are not allowed in the embed URL");
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase()) || parsed.port) {
        throw new TypeError("Only official Wordwall URLs on the standard HTTPS port are supported");
    }

    if (!EMBED_PATH_PATTERN.test(parsed.pathname)) {
        throw new TypeError("Use a valid /embed/<activity-id> URL from Wordwall's Embed interface");
    }

    if (parsed.hash) {
        throw new TypeError("URL fragments are not allowed");
    }

    return parsed.toString();
}

export function isOfficialWordwallEmbedUrl(value) {
    try {
        validateWordwallEmbedUrl(value);
        return true;
    } catch {
        return false;
    }
}

export function getEntityId(value) {
    if (typeof value === "string") return value;
    return value && typeof value._id === "string" ? value._id : "";
}
