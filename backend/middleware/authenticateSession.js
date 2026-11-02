const {
    getSessionConfig,
    verifySessionToken,
    readSessionCookie,
} = require("../utils/authSession.js");

function createAuthenticateSession(dependencies = {}) {
    const getConfig = dependencies.getConfig || getSessionConfig;
    const verifyToken = dependencies.verifyToken || verifySessionToken;

    return function authenticateSession(req, res, next) {
        let config;

        try {
            config = getConfig();
        } catch (error) {
            return res.status(503).json({
                message: "Authentication is not configured on this server",
            });
        }

        const token = readSessionCookie(req);
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        try {
            req.auth = verifyToken(token, { config });
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Session is invalid or expired" });
        }
    };
}

const authenticateSession = createAuthenticateSession();

module.exports = {
    authenticateSession,
    createAuthenticateSession,
};
