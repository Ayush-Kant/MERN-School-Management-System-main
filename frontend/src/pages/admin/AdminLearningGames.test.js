import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import apiClient from "../../utils/apiClient";
import AdminLearningGames from "./AdminLearningGames";

jest.mock("../../utils/apiClient", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

const ACTIVITY_ID = "111111111111111111111111";
const CLASS_ID = "cccccccccccccccccccccccc";
const SUBJECT_ID = "dddddddddddddddddddddddd";
const TEACHER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const EMBED_URL = "https://wordwall.net/embed/123456";

const publishedActivity = {
    _id: ACTIVITY_ID,
    title: "Fractions Challenge",
    description: "Practise fraction operations",
    topic: "Fractions",
    provider: "wordwall",
    originalUrl: "https://wordwall.net/resource/123456",
    embedUrl: EMBED_URL,
    status: "published",
    class: { _id: CLASS_ID, sclassName: "Class 8" },
    subject: { _id: SUBJECT_ID, subName: "Mathematics", subCode: "MATH" },
    createdByTeacher: { _id: TEACHER_ID, name: "Teacher One" },
    createdAt: "2026-11-07T10:00:00.000Z",
    publishedAt: "2026-11-07T11:00:00.000Z",
};

function catalogueResponse(overrides = {}) {
    return {
        data: {
            activities: [publishedActivity],
            pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
            summary: { total: 3, draft: 1, published: 1, archived: 1 },
            filters: {
                classes: [{ _id: CLASS_ID, sclassName: "Class 8" }],
                subjects: [{ _id: SUBJECT_ID, subName: "Mathematics", subCode: "MATH", sclassName: CLASS_ID }],
                teachers: [{ _id: TEACHER_ID, name: "Teacher One" }],
            },
            ...overrides,
        },
    };
}

let container;
let root;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

async function renderPage() {
    await act(async () => {
        root.render(<AdminLearningGames />);
        await flushPromises();
    });
}

function findButton(label) {
    return Array.from(document.body.querySelectorAll("button"))
        .find((button) => button.textContent.includes(label));
}

function setTextField(name, value) {
    const input = container.querySelector('input[name="' + name + '"]');
    if (!input) throw new Error("Could not find input named " + name);
    const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
    ).set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    apiClient.get.mockResolvedValue(catalogueResponse());
    apiClient.put.mockResolvedValue({ data: { ...publishedActivity, status: "draft" } });
    window.confirm = jest.fn(() => true);
});

afterEach(async () => {
    await act(async () => {
        root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
});

test("shows a loading state while the catalogue request is pending", async () => {
    let resolveRequest;
    apiClient.get.mockReturnValue(new Promise((resolve) => {
        resolveRequest = resolve;
    }));

    await act(async () => {
        root.render(<AdminLearningGames />);
    });

    expect(document.body.textContent).toContain("Loading game catalogue");

    await act(async () => {
        resolveRequest(catalogueResponse());
        await flushPromises();
    });

    expect(document.body.textContent).toContain("Fractions Challenge");
});

test("loads the Admin catalogue and renders source, creator, class, subject, and lifecycle metadata", async () => {
    await renderPage();

    expect(apiClient.get).toHaveBeenCalledWith("/AdminGameActivityList", {
        params: { page: 1, limit: 25 },
    });
    expect(document.body.textContent).toContain("Learning & Games");
    expect(document.body.textContent).toContain("Fractions Challenge");
    expect(document.body.textContent).toContain("Class 8");
    expect(document.body.textContent).toContain("Mathematics");
    expect(document.body.textContent).toContain("Teacher One");
    expect(document.body.textContent).toContain("Published");
    expect(document.body.textContent).toContain("Original source");
    expect(document.body.textContent).toContain("Validated embed");

    const sourceLink = Array.from(document.body.querySelectorAll("a"))
        .find((link) => link.textContent.includes("Original source"));
    expect(sourceLink.getAttribute("href")).toBe("https://wordwall.net/resource/123456");
    expect(sourceLink.getAttribute("rel")).toContain("noopener");
});

test("applies search filters through the server-backed catalogue endpoint", async () => {
    await renderPage();

    await act(async () => {
        setTextField("search", "chemistry");
    });
    await act(async () => {
        const form = container.querySelector("form");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();
    });

    expect(apiClient.get).toHaveBeenLastCalledWith("/AdminGameActivityList", {
        params: { page: 1, limit: 25, search: "chemistry" },
    });
});

test("shows a useful empty state when the school has no activities", async () => {
    apiClient.get.mockResolvedValue(catalogueResponse({
        activities: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
        summary: { total: 0, draft: 0, published: 0, archived: 0 },
    }));

    await renderPage();

    expect(document.body.textContent).toContain("No game activities yet");
});

test("shows an API error and allows the Admin to retry", async () => {
    apiClient.get.mockRejectedValueOnce({
        response: { data: { message: "Catalogue unavailable" } },
    });

    await renderPage();

    expect(document.body.textContent).toContain("Catalogue unavailable");
    expect(findButton("Retry")).toBeTruthy();

    await act(async () => {
        findButton("Retry").click();
        await flushPromises();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(document.body.textContent).toContain("Fractions Challenge");
});

test("requires confirmation and calls the Admin unpublish endpoint", async () => {
    await renderPage();

    await act(async () => {
        findButton("Unpublish").click();
        await flushPromises();
        await flushPromises();
    });

    expect(window.confirm).toHaveBeenCalledWith(
        "Unpublish this activity? It will return to draft and disappear from the student catalogue."
    );
    expect(apiClient.put).toHaveBeenCalledWith(
        "/AdminGameActivityUnpublish/" + ACTIVITY_ID,
        {}
    );
    expect(document.body.textContent).toContain(
        "Game activity unpublished and moved to drafts."
    );
});

test("requires confirmation and calls the Admin archive endpoint", async () => {
    await renderPage();

    await act(async () => {
        findButton("Archive").click();
        await flushPromises();
        await flushPromises();
    });

    expect(window.confirm).toHaveBeenCalledWith(
        "Archive this published activity? Students will no longer see it."
    );
    expect(apiClient.put).toHaveBeenCalledWith(
        "/AdminGameActivityArchive/" + ACTIVITY_ID,
        {}
    );
    expect(document.body.textContent).toContain(
        "Game activity archived successfully."
    );
});

test("shows action failures without pretending the activity changed", async () => {
    apiClient.put.mockRejectedValue({
        response: { data: { message: "Only published activities can be archived" } },
    });
    await renderPage();

    await act(async () => {
        findButton("Archive").click();
        await flushPromises();
        await flushPromises();
    });

    expect(document.body.textContent).toContain(
        "Only published activities can be archived"
    );
    expect(document.body.textContent).toContain("Fractions Challenge");
});

test("does not render admin lifecycle actions for draft or archived activities", async () => {
    apiClient.get.mockResolvedValue(catalogueResponse({
        activities: [
            { ...publishedActivity, status: "draft" },
            { ...publishedActivity, _id: "222222222222222222222222", status: "archived" },
        ],
    }));

    await renderPage();

    expect(findButton("Unpublish")).toBeUndefined();
    expect(findButton("Archive")).toBeUndefined();
    expect(document.body.textContent.match(/No admin action/g)).toHaveLength(2);
});
