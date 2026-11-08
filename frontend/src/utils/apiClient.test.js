jest.mock("axios", () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
    },
}));

test("shared API client sends the HttpOnly session cookie with every request", () => {
    jest.isolateModules(() => {
        const axios = require("axios").default;
        const mockedApiClient = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
        };

        // react-scripts resets mock implementations before each test.
        // Restore this factory before importing the module that creates the client.
        axios.create.mockReturnValue(mockedApiClient);

        const apiClient = require("./apiClient").default;
        const expectedBaseUrl = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");

        expect(axios.create).toHaveBeenCalledWith({
            baseURL: expectedBaseUrl,
            withCredentials: true,
        });
        expect(apiClient).toBe(mockedApiClient);
    });
});
