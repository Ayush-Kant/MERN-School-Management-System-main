import axios from "axios";

const API_BASE_URL = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");

// All feature requests use the signed HttpOnly session cookie. The backend
// remains responsible for deriving identity, role, and school scope.
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export default apiClient;
