const test = require("node:test");
const assert = require("node:assert/strict");
const { validateWordwallEmbedUrl } = require("../utils/wordwallUrl");

test("accepts an official HTTPS Wordwall embed URL", () => {
    const input = "https://wordwall.net/embed/123456";
    assert.equal(validateWordwallEmbedUrl(input), input);
});

test("normalizes surrounding whitespace and URL host casing", () => {
    assert.equal(
        validateWordwallEmbedUrl("  https://WORDWALL.net/embed/123456  "),
        "https://wordwall.net/embed/123456"
    );
});

test("rejects blank and non-string input", () => {
    for (const value of ["", "   ", null, undefined, 42]) {
        assert.throws(() => validateWordwallEmbedUrl(value), TypeError);
    }
});

test("rejects non-HTTPS URLs", () => {
    assert.throws(
        () => validateWordwallEmbedUrl("http://wordwall.net/embed/123"),
        /HTTPS/
    );
});

test("rejects non-Wordwall and lookalike hosts", () => {
    for (const value of [
        "https://example.com/embed/123",
        "https://wordwall.net.example.com/embed/123",
        "https://notwordwall.net/embed/123",
    ]) {
        assert.throws(() => validateWordwallEmbedUrl(value), /official Wordwall/);
    }
});

test("rejects public play/share links that are not embed links", () => {
    assert.throws(
        () => validateWordwallEmbedUrl("https://wordwall.net/resource/123"),
        /embed URL/
    );
});

test("rejects URLs containing credentials or fragments", () => {
    assert.throws(
        () => validateWordwallEmbedUrl("https://user:pass@wordwall.net/embed/123"),
        /Credentials/
    );
    assert.throws(
        () => validateWordwallEmbedUrl("https://wordwall.net/embed/123#fragment"),
        /fragments/
    );
});

test("rejects unsafe URL schemes", () => {
    assert.throws(
        () => validateWordwallEmbedUrl("javascript:alert(1)"),
        /valid Wordwall embed URL/
    );
});
