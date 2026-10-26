const ALLOWED_HOSTS = new Set(["wordwall.net", "www.wordwall.net"]);

/**
 * Accepts only a Wordwall HTTPS embed URL.
 * We persist the URL rather than user-supplied iframe HTML.
 *
 * @param {string} value
 * @returns {string} normalized, validated URL
 * @throws {TypeError} when the URL is not a supported Wordwall embed URL
 */
function validateWordwallEmbedUrl(value) {
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

    if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
        throw new TypeError("Only official Wordwall URLs are supported");
    }

    if (!/^\/embed\//.test(parsed.pathname)) {
        throw new TypeError("Use the embed URL from Wordwall's Embed interface");
    }

    if (parsed.hash) {
        throw new TypeError("URL fragments are not allowed");
    }

    return parsed.toString();
}

module.exports = { validateWordwallEmbedUrl };
