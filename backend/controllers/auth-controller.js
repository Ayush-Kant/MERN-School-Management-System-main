const Admin = require("../models/adminSchema.js");
const { clearSessionCookie } = require("../utils/authSession.js");

const getAuthSession = async (req, res) => {
    try {
        if (!req.auth || req.auth.role !== "Admin") {
            return res.status(403).json({ message: "This session role is not available yet" });
        }

        const admin = await Admin.findById(req.auth.userId).select("-password");
        if (!admin) {
            clearSessionCookie(res);
            return res.status(401).json({ message: "The account for this session no longer exists" });
        }

        const profile = admin.toObject();
        delete profile.password;

        return res.status(200).json(profile);
    } catch (error) {
        return res.status(500).json({ message: "Could not load the authenticated session" });
    }
};

const authLogout = (req, res) => {
    clearSessionCookie(res);
    return res.status(204).end();
};

module.exports = {
    getAuthSession,
    authLogout,
};
