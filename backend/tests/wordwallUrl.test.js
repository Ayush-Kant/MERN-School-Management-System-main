const test = require("node:test");
const assert = require("node:assert/strict");
const {
    extractWordwallEmbedSrc,
    normalizeWordwallEmbedInput,
    validateWordwallEmbedUrl,
} = require("../utils/wordwallUrl");

test("accepts official HTTPS Wordwall embed URLs and preserves query parameters", () => {
    assert.equal(
        validateWordwallEmbedUrl(" https://wordwall.net/embed/123456?themeId=1 "),
        "https://wordwall.net/embed/123456?themeId=1"
    );
    assert.equal(
        validateWordwallEmbedUrl("https://www.wordwall.net/embed/abc_DEF-9/"),
        "https://www.wordwall.net/embed/abc_DEF-9/"
    );
});

test("normalizes surrounding whitespace and host casing", () => {
    assert.equal(
        validateWordwallEmbedUrl("  https://WORDWALL.net/embed/123456  "),
        "https://wordwall.net/embed/123456"
    );
});

test("rejects unsafe schemes, nonstandard ports, credentials, and non-Wordwall hosts", () => {
    const invalidUrls = [
        "http://wordwall.net/embed/123",
        "javascript:alert(1)",
        "data:text/html,hello",
        "https://example.com/embed/123",
        "https://wordwall.net.example.com/embed/123",
        "https://wordwall-net.com/embed/123",
        "https://wordwall.net.evil.test/embed/123",
        "https://user:pass@wordwall.net/embed/123",
        "https://wordwall.net:8443/embed/123",
    ];

    for (const value of invalidUrls) {
        assert.throws(() => validateWordwallEmbedUrl(value), TypeError, value);
    }
});

test("rejects malformed or unsupported Wordwall paths and fragments", () => {
    const invalidUrls = [
        "https://wordwall.net/",
        "https://wordwall.net/embed",
        "https://wordwall.net/embed/",
        "https://wordwall.net/embed/123/extra",
        "https://wordwall.net/play/123",
        "https://wordwall.net/embed/123#section",
        "not a URL",
        "",
        null,
        123,
    ];

    for (const value of invalidUrls) {
        assert.throws(() => validateWordwallEmbedUrl(value), TypeError);
    }
});

test("extracts only the quoted src from a single official iframe snippet", () => {
    const snippet = '<iframe width="800" height="600" src="https://wordwall.net/embed/123456?themeId=1&amp;templateId=2" allowfullscreen></iframe>';

    assert.equal(
        extractWordwallEmbedSrc(snippet),
        "https://wordwall.net/embed/123456?themeId=1&templateId=2"
    );
    assert.equal(
        normalizeWordwallEmbedInput(snippet),
        "https://wordwall.net/embed/123456?themeId=1&templateId=2"
    );
});

test("normalizes self-closing and single-quoted iframe snippets", () => {
    assert.equal(
        normalizeWordwallEmbedInput("<iframe src='https://www.wordwall.net/embed/abc-1' />"),
        "https://www.wordwall.net/embed/abc-1"
    );
});

test("rejects iframe snippets without a src or with an invalid iframe shape", () => {
    for (const value of [
        "<iframe></iframe>",
        "<iframe src=https://wordwall.net/embed/123></iframe>",
        '<iframe src="https://wordwall.net/embed/123"',
        '<iframe src="https://wordwall.net/embed/123">untrusted content</iframe>',
    ]) {
        assert.throws(() => extractWordwallEmbedSrc(value), TypeError);
    }
});

test("rejects snippets without one unambiguous quoted src or with extra markup", () => {
    const invalidSnippets = [
        "<iframe></iframe>",
        "<iframe src=https://wordwall.net/embed/123></iframe>",
        '<iframe src="https://wordwall.net/embed/123" src="https://wordwall.net/embed/456"></iframe>',
        '<iframe src="https://example.com/embed/123"></iframe>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<div><iframe src="https://wordwall.net/embed/123"></iframe></div>',
        '<iframe src="https://wordwall.net/embed/123"></iframe><iframe src="https://wordwall.net/embed/456"></iframe>',
        '<iframe src="https://wordwall.net/embed/123">untrusted content</iframe>',
        '<iframe src="https://wordwall.net/embed/123"',
    ];

    for (const value of invalidSnippets) {
        assert.throws(() => normalizeWordwallEmbedInput(value), TypeError);
    }
});
