const test = require("node:test");
const assert = require("node:assert/strict");
const {
    parseAllowedOrigins,
    createCorsOptions,
} = require("../config/corsOptions.js");

test("parses a comma-separated list of frontend origins", () => {
    const origins = parseAllowedOrigins({
        FRONTEND_URLS: "http://localhost:3000, https://school.example.com",
    });

    assert.deepEqual([...origins], [
        "http://localhost:3000",
        "https://school.example.com",
    ]);
});

test("uses localhost as the development default", () => {
    const origins = parseAllowedOrigins({});

    assert.equal(origins.has("http://localhost:3000"), true);
});

test("rejects frontend URLs containing paths or credentials", () => {
    assert.throws(
        () => parseAllowedOrigins({ FRONTEND_URLS: "https://example.com/app" }),
        /origins only/
    );
    assert.throws(
        () => parseAllowedOrigins({ FRONTEND_URLS: "https://user:pass@example.com" }),
        /origins only/
    );
});

test("enables credentials only for configured origins", async () => {
    const options = createCorsOptions({
        FRONTEND_URLS: "http://localhost:3000,https://school.example.com",
    });

    const allowed = await new Promise((resolve, reject) => {
        options.origin("https://school.example.com", (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
    assert.equal(allowed, true);
    assert.equal(options.credentials, true);
    assert.deepEqual(options.exposedHeaders, ["X-Request-Id"]);

    await assert.rejects(
        () => new Promise((resolve, reject) => {
            options.origin("https://untrusted.example", (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        }),
        (error) => {
            assert.match(error.message, /Origin is not allowed by CORS/);
            assert.equal(error.code, "CORS_ORIGIN_NOT_ALLOWED");
            return true;
        }
    );
});
