import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import apiClient from "../../utils/apiClient";
import { useSelector } from "react-redux";
import TeacherGameZone from "./TeacherGameZone";
import { getEntityId, isOfficialWordwallEmbedUrl } from "../../utils/wordwallUrl";

jest.mock("../../utils/apiClient", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
    },
}));

jest.mock("react-redux", () => ({
    useSelector: jest.fn(),
}));

const TEACHER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const SCHOOL_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const ACTIVITY_ID = "111111111111111111111111";
const EMBED_URL = "https://wordwall.net/embed/123456";
const CURRENT_USER = {
    _id: TEACHER_ID,
    role: "Teacher",
    school: { _id: SCHOOL_ID, schoolName: "Demo School" },
    teachSclass: { _id: "cccccccccccccccccccccccc", sclassName: "Class 8" },
    teachSubject: { _id: "dddddddddddddddddddddddd", subName: "Science" },
};

const draftActivity = {
    _id: ACTIVITY_ID,
    title: "Fractions Challenge",
    description: "Practise the basics",
    topic: "Fractions",
    embedUrl: EMBED_URL,
    status: "draft",
    class: { sclassName: "Class 8" },
    subject: { subName: "Science" },
};

let container;
let root;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

async function renderPage() {
    await act(async () => {
        root.render(<TeacherGameZone />);
        await flushPromises();
    });
}

function findButton(label) {
    return Array.from(document.body.querySelectorAll("button"))
        .find((button) => button.textContent.includes(label));
}

function setTextField(name, value) {
    const input = container.querySelector(`[name="${name}"]`);
    if (!input) throw new Error(`Could not find input named ${name}`);

    const prototype = input.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    useSelector.mockImplementation((selector) => selector({
        user: { currentUser: CURRENT_USER },
    }));
    apiClient.get.mockResolvedValue({ data: [] });
    apiClient.post.mockResolvedValue({ data: { ...draftActivity, status: "draft" } });
    apiClient.put.mockResolvedValue({ data: { ...draftActivity, status: "published" } });
    window.confirm = jest.fn(() => true);
});

afterEach(async () => {
    await act(async () => {
        root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
});

test("extracts ids from populated objects and plain id strings", () => {
    expect(getEntityId(CURRENT_USER)).toBe(TEACHER_ID);
    expect(getEntityId(CURRENT_USER.school)).toBe(SCHOOL_ID);
    expect(getEntityId(SCHOOL_ID)).toBe(SCHOOL_ID);
    expect(getEntityId(null)).toBe("");
    expect(getEntityId({})).toBe("");
});

test("accepts only official HTTPS Wordwall embed URLs", () => {
    expect(isOfficialWordwallEmbedUrl(EMBED_URL)).toBe(true);
    expect(isOfficialWordwallEmbedUrl("https://www.wordwall.net/embed/abc")).toBe(true);
    expect(isOfficialWordwallEmbedUrl("http://wordwall.net/embed/1")).toBe(false);
    expect(isOfficialWordwallEmbedUrl("https://wordwall.net/resource/1")).toBe(false);
    expect(isOfficialWordwallEmbedUrl("https://wordwall.net.example.com/embed/1")).toBe(false);
    expect(isOfficialWordwallEmbedUrl("javascript:alert(1)")).toBe(false);
});

test("loads the teacher's own activities using the existing backend API", async () => {
    apiClient.get.mockResolvedValue({ data: [draftActivity] });
    await renderPage();

    expect(apiClient.get).toHaveBeenCalledWith(
        `/GameActivityList/${SCHOOL_ID}?teacherId=${TEACHER_ID}`
    );
    expect(document.body.textContent).toContain("Fractions Challenge");
    expect(document.body.textContent).toContain("Your activities");
    expect(document.body.textContent).toContain("draft");
});

test("creates a draft from form details and refreshes the activity list", async () => {
    await renderPage();

    await act(async () => {
        setTextField("title", "Fractions Challenge");
        setTextField("topic", "Fractions");
        setTextField("embedUrl", EMBED_URL);
    });

    await act(async () => {
        const form = container.querySelector("form");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await flushPromises();
        await flushPromises();
    });

    expect(apiClient.post).toHaveBeenCalledWith(
        "/GameActivityCreate",
        {
            teacherId: TEACHER_ID,
            title: "Fractions Challenge",
            description: "",
            topic: "Fractions",
            embedUrl: EMBED_URL,
        },
        { headers: { "Content-Type": "application/json" } }
    );
    expect(document.body.textContent).toContain("Activity saved as a draft");
});

test("previews a saved activity only when its Wordwall URL is valid", async () => {
    apiClient.get.mockResolvedValue({ data: [draftActivity] });
    await renderPage();

    await act(async () => {
        findButton("Preview").click();
    });

    const iframe = document.body.querySelector("iframe[title='Wordwall preview: Fractions Challenge']");
    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute("src")).toBe(EMBED_URL);
});

test("publishes a draft through the existing transition endpoint", async () => {
    apiClient.get.mockResolvedValue({ data: [draftActivity] });
    await renderPage();

    await act(async () => {
        findButton("Publish").click();
        await flushPromises();
        await flushPromises();
    });

    expect(apiClient.put).toHaveBeenCalledWith(
        `/GameActivityPublish/${ACTIVITY_ID}`,
        { teacherId: TEACHER_ID },
        { headers: { "Content-Type": "application/json" } }
    );
});

test("asks before archiving a published activity and sends the teacher id", async () => {
    apiClient.get.mockResolvedValue({
        data: [{ ...draftActivity, status: "published" }],
    });
    await renderPage();

    await act(async () => {
        findButton("Archive").click();
        await flushPromises();
        await flushPromises();
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(apiClient.put).toHaveBeenCalledWith(
        `/GameActivityArchive/${ACTIVITY_ID}`,
        { teacherId: TEACHER_ID },
        { headers: { "Content-Type": "application/json" } }
    );
});
