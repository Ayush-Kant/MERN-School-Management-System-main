import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { useSelector } from "react-redux";
import StudentGameZone from "./StudentGameZone";

jest.mock("axios", () => ({
    get: jest.fn(),
}));

jest.mock("react-redux", () => ({
    useSelector: jest.fn(),
}));

const STUDENT_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const SCHOOL_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const CLASS_ID = "cccccccccccccccccccccccc";
const SUBJECT_ID = "dddddddddddddddddddddddd";
const ACTIVITY_ID = "111111111111111111111111";
const EMBED_URL = "https://wordwall.net/embed/123456";
const API_BASE_URL = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");

const CURRENT_USER = {
    _id: STUDENT_ID,
    role: "Student",
    school: { _id: SCHOOL_ID, schoolName: "Demo School" },
    sclassName: { _id: CLASS_ID, sclassName: "Class 8" },
};

const publishedActivity = {
    _id: ACTIVITY_ID,
    title: "Fractions Challenge",
    description: "Practise equivalent fractions",
    topic: "Fractions",
    embedUrl: EMBED_URL,
    status: "published",
    class: { sclassName: "Class 8" },
    subject: { _id: SUBJECT_ID, subName: "Mathematics" },
    createdByTeacher: { name: "Teacher One" },
};

let container;
let root;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

async function renderPage() {
    await act(async () => {
        root.render(<StudentGameZone />);
        await flushPromises();
        await flushPromises();
    });
}

function findButton(label) {
    return Array.from(document.body.querySelectorAll("button"))
        .find((button) => button.textContent.includes(label));
}

function setInput(name, value) {
    const input = container.querySelector(`input[name="${name}"]`);
    if (!input) throw new Error(`Could not find input named ${name}`);

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

    useSelector.mockImplementation((selector) => selector({
        user: { currentUser: CURRENT_USER },
    }));
    axios.get.mockResolvedValue({ data: [publishedActivity] });
});

afterEach(async () => {
    await act(async () => {
        root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
});

test("requests games using the student's school and class", async () => {
    await renderPage();

    expect(axios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/GameActivityList/${SCHOOL_ID}?classId=${CLASS_ID}`
    );
    expect(document.body.textContent).toContain("Fractions Challenge");
    expect(document.body.textContent).toContain("Mathematics");
});

test("renders only valid published activities, never drafts or archived games", async () => {
    axios.get.mockResolvedValue({
        data: [
            publishedActivity,
            { ...publishedActivity, _id: "222222222222222222222222", title: "Draft-only game", status: "draft" },
            { ...publishedActivity, _id: "333333333333333333333333", title: "Archived game", status: "archived" },
            { ...publishedActivity, _id: "444444444444444444444444", title: "Invalid embed", embedUrl: "https://evil.example/embed/1" },
        ],
    });

    await renderPage();

    expect(document.body.textContent).toContain("Fractions Challenge");
    expect(document.body.textContent).not.toContain("Draft-only game");
    expect(document.body.textContent).not.toContain("Archived game");
    expect(document.body.textContent).not.toContain("Invalid embed");
});

test("opens the selected Wordwall game in an embedded dialog", async () => {
    await renderPage();

    await act(async () => {
        findButton("Play game").click();
    });

    const iframe = document.body.querySelector("iframe[title='Wordwall game: Fractions Challenge']");
    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute("src")).toBe(EMBED_URL);
});

test("filters published activities by title and topic", async () => {
    axios.get.mockResolvedValue({
        data: [
            publishedActivity,
            {
                ...publishedActivity,
                _id: "222222222222222222222222",
                title: "Solar System Quiz",
                topic: "Space",
                subject: { _id: "eeeeeeeeeeeeeeeeeeeeeeee", subName: "Science" },
            },
        ],
    });

    await renderPage();

    await act(async () => {
        setInput("Search games or topics", "space");
    });

    expect(document.body.textContent).toContain("Solar System Quiz");
    expect(document.body.textContent).not.toContain("Fractions Challenge");
});

test("shows a useful empty state when no games have been published", async () => {
    axios.get.mockResolvedValue({ data: [] });

    await renderPage();

    expect(document.body.textContent).toContain("No games published yet");
});

test("shows a recoverable error when the API request fails", async () => {
    axios.get.mockRejectedValue(new Error("network unavailable"));

    await renderPage();

    expect(document.body.textContent).toContain("Could not load games right now");
});

test("refresh retries the published-game request", async () => {
    await renderPage();

    await act(async () => {
        findButton("Refresh").click();
        await flushPromises();
        await flushPromises();
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
});
