import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import SideBar from "./SideBar";

let container;
let root;

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => {
        root.unmount();
    });
    container.remove();
});

test("renders the Learning & Games Admin navigation link and marks it active", async () => {
    await act(async () => {
        root.render(
            <MemoryRouter initialEntries={["/Admin/learning-games"]}>
                <SideBar />
            </MemoryRouter>
        );
    });

    const link = Array.from(container.querySelectorAll("a"))
        .find((item) => item.textContent.includes("Learning & Games"));

    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/Admin/learning-games");
    expect(link.className).toContain("active");
});
