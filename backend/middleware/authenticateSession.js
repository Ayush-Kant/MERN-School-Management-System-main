const { sendApiError } = require("../utils/apiResponse.js");
const {
    getSessionConfig,
    verifySessionToken,
    readSessionCookie,
    clearSessionCookie,
} = require("../utils/authSession.js");

function createAuthenticateSession(dependencies = {}) {
    const getConfig = dependencies.getConfig || getSessionConfig;
    const verifyToken = dependencies.verifyToken || verifySessionToken;

    return function authenticateSession(req, res, next) {
        let config;

        try {
            config = getConfig();
        } catch (error) {
            return sendApiError(res, 503, "Authentication is not configured on this server");
        }

        const token = readSessionCookie(req);
        if (!token) {
            return sendApiError(res, 401, "Authentication required");
        }

        try {
            req.auth = verifyToken(token, { config });
            return next();
        } catch (error) {
            clearSessionCookie(res);
            return sendApiError(res, 401, "Session is invalid or expired");
        }
    };
}

const authenticateSession = createAuthenticateSession();

module.exports = {
    authenticateSession,
    createAuthenticateSession,
};
