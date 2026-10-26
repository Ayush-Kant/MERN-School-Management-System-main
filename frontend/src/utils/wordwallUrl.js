/**
 * Frontend guard for Wordwall embeds. The backend independently validates
 * every submitted URL; this helper only improves client-side feedback.
 */
export function isOfficialWordwallEmbedUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;

    try {
        const parsed = new URL(value.trim());
        const hostname = parsed.hostname.toLowerCase();

        return parsed.protocol === "https:" &&
            (hostname === "wordwall.net" || hostname === "www.wordwall.net") &&
            !parsed.username &&
            !parsed.password &&
            parsed.pathname.startsWith("/embed/") &&
            !parsed.hash;
    } catch {
        return false;
    }
}

export function getEntityId(value) {
    if (typeof value === "string") return value;
    return value && typeof value._id === "string" ? value._id : "";
}
