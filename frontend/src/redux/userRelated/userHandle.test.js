import axios from "axios";
import {
    restoreSession,
    loginUser,
    registerUser,
    logoutUser,
} from "./userHandle";

jest.mock("axios", () => ({
    get: jest.fn(),
    post: jest.fn(),
}));

const API_BASE_URL = process.env.REACT_APP_BASE_URL || "";
const ADMIN_PROFILE = {
    _id: "0123456789abcdef01234567",
    role: "Admin",
    name: "Demo Admin",
};

beforeEach(() => {
    jest.clearAllMocks();
});

test("restores the current user from the server session cookie", async () => {
    axios.get.mockResolvedValue({ data: ADMIN_PROFILE });
    const dispatch = jest.fn();

    await restoreSession()(dispatch);

    expect(axios.get).toHaveBeenCalledWith(
        `${API_BASE_URL}/AuthSession`,
        { withCredentials: true }
    );
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
        "user/sessionRestoreRequest",
        "user/sessionRestoreSuccess",
    ]);
    expect(dispatch.mock.calls[1][0].payload).toEqual(ADMIN_PROFILE);
});

test("clears the restored user state when the server session is invalid", async () => {
    axios.get.mockRejectedValue(new Error("Unauthorized"));
    const dispatch = jest.fn();

    await restoreSession()(dispatch);

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
        "user/sessionRestoreRequest",
        "user/sessionRestoreFailed",
    ]);
});

test("sends login requests with credentials enabled for the HttpOnly cookie", async () => {
    axios.post.mockResolvedValue({ data: ADMIN_PROFILE });
    const dispatch = jest.fn();
    const fields = { email: "admin@example.com", password: "test-password" };

    await loginUser(fields, "Admin")(dispatch);

    expect(axios.post).toHaveBeenCalledWith(
        `${API_BASE_URL}/AdminLogin`,
        fields,
        {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        }
    );
    expect(dispatch.mock.calls[1][0].type).toBe("user/authSuccess");
});

test("sends Admin registration requests with credentials enabled", async () => {
    axios.post.mockResolvedValue({
        data: { ...ADMIN_PROFILE, schoolName: "Demo School" },
    });
    const dispatch = jest.fn();
    const fields = {
        name: "Demo Admin",
        email: "admin@example.com",
        password: "test-password",
        schoolName: "Demo School",
        role: "Admin",
    };

    await registerUser(fields, "Admin")(dispatch);

    expect(axios.post).toHaveBeenCalledWith(
        `${API_BASE_URL}/AdminReg`,
        fields,
        {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        }
    );
    expect(dispatch.mock.calls[1][0].type).toBe("user/authSuccess");
});

test("clears local authentication state and requests server cookie logout", async () => {
    axios.post.mockResolvedValue({ status: 204 });
    const dispatch = jest.fn();

    await logoutUser()(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe("user/authLogout");
    expect(axios.post).toHaveBeenCalledWith(
        `${API_BASE_URL}/AuthLogout`,
        {},
        { withCredentials: true }
    );
});

test("still clears local authentication state when the logout request fails", async () => {
    axios.post.mockRejectedValue(new Error("Network unavailable"));
    const dispatch = jest.fn();

    await logoutUser()(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe("user/authLogout");
});
