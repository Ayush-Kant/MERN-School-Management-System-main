import axios from "axios";
import apiClient from "./apiClient";

jest.mock("axios", () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => ({
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
        })),
    },
}));

test("shared API client sends the HttpOnly session cookie with every request", () => {
    const expectedBaseUrl = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");

    expect(axios.create).toHaveBeenCalledWith({
        baseURL: expectedBaseUrl,
        withCredentials: true,
    });
    expect(apiClient).toBe(axios.create.mock.results[0].value);
});
