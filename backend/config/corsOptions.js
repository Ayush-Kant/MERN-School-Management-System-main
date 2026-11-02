function parseAllowedOrigins(env = process.env) {
    const configuredOrigins = env.FRONTEND_URLS || env.FRONTEND_URL || "http://localhost:3000";
    const entries = String(configuredOrigins)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    if (entries.length === 0) {
        throw new Error("At least one frontend origin must be configured");
    }

    const allowedOrigins = new Set();

    for (const entry of entries) {
        let parsed;
        try {
            parsed = new URL(entry);
        } catch {
            throw new Error(`Invalid frontend origin: ${entry}`);
        }

        if (
            !["http:", "https:"].includes(parsed.protocol) ||
            parsed.username ||
            parsed.password ||
            parsed.pathname !== "/" ||
            parsed.search ||
            parsed.hash
        ) {
            throw new Error(`FRONTEND_URLS entries must be origins only: ${entry}`);
        }

        allowedOrigins.add(parsed.origin);
    }

    return allowedOrigins;
}

function createCorsOptions(env = process.env) {
    const allowedOrigins = parseAllowedOrigins(env);

    return {
        credentials: true,
        exposedHeaders: ["X-Request-Id"],
        origin(origin, callback) {
            // Non-browser clients such as local scripts do not send an Origin header.
            if (!origin || allowedOrigins.has(origin)) {
                return callback(null, true);
            }

            const error = new Error("Origin is not allowed by CORS");
            error.code = "CORS_ORIGIN_NOT_ALLOWED";
            return callback(error);
        },
    };
}

module.exports = {
    parseAllowedOrigins,
    createCorsOptions,
};
