import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { useSelector } from "react-redux";
import TeacherSideBar from "./TeacherSideBar";

jest.mock("react-redux", () => ({
    useSelector: jest.fn(),
}));

let container;
let root;

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    useSelector.mockImplementation((selector) => selector({
        user: {
            currentUser: {
                teachSclass: { sclassName: "Class 8" },
            },
        },
    }));
});

afterEach(async () => {
    await act(async () => {
        root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
});

test("renders the My Games Teacher navigation link", async () => {
    await act(async () => {
        root.render(
            <MemoryRouter initialEntries={["/Teacher/my-games"]}>
                <TeacherSideBar />
            </MemoryRouter>
        );
    });

    const link = Array.from(container.querySelectorAll("a"))
        .find((item) => item.textContent.includes("My Games"));

    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/Teacher/my-games");
});
