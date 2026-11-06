import {
    extractWordwallEmbedSrc,
    isOfficialWordwallEmbedUrl,
    normalizeWordwallEmbedInput,
    validateWordwallEmbedUrl,
} from "./wordwallUrl";

test("accepts official HTTPS Wordwall embed URLs", () => {
    expect(validateWordwallEmbedUrl(" https://wordwall.net/embed/123456?themeId=1 "))
        .toBe("https://wordwall.net/embed/123456?themeId=1");
    expect(isOfficialWordwallEmbedUrl("https://www.wordwall.net/embed/abc_DEF-9/")).toBe(true);
});

test("rejects unsafe schemes, hosts, credentials, ports, and paths", () => {
    [
        "http://wordwall.net/embed/123",
        "javascript:alert(1)",
        "https://example.com/embed/123",
        "https://wordwall.net.example.com/embed/123",
        "https://user:pass@wordwall.net/embed/123",
        "https://wordwall.net:8443/embed/123",
        "https://wordwall.net/embed/",
        "https://wordwall.net/play/123",
        "https://wordwall.net/embed/123#fragment",
    ].forEach((value) => {
        expect(isOfficialWordwallEmbedUrl(value)).toBe(false);
        expect(() => validateWordwallEmbedUrl(value)).toThrow(TypeError);
    });
});

test("extracts only the src from an official iframe snippet", () => {
    const snippet = '<iframe width="800" src="https://wordwall.net/embed/123?themeId=1&amp;templateId=2" allowfullscreen></iframe>';

    expect(extractWordwallEmbedSrc(snippet))
        .toBe("https://wordwall.net/embed/123?themeId=1&templateId=2");
    expect(normalizeWordwallEmbedInput(snippet))
        .toBe("https://wordwall.net/embed/123?themeId=1&templateId=2");
});

test("rejects ambiguous or malformed iframe snippets", () => {
    [
        "<iframe></iframe>",
        "<iframe src=https://wordwall.net/embed/123></iframe>",
        '<iframe src="https://wordwall.net/embed/123" src="https://wordwall.net/embed/456"></iframe>',
        '<iframe src="https://example.com/embed/123"></iframe>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<div><iframe src="https://wordwall.net/embed/123"></iframe></div>',
        '<iframe src="https://wordwall.net/embed/123"></iframe><iframe src="https://wordwall.net/embed/456"></iframe>',
    ].forEach((value) => {
        expect(() => normalizeWordwallEmbedInput(value)).toThrow(TypeError);
    });
});
