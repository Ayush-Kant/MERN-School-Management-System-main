const Admin = require("../models/adminSchema.js");
const Student = require("../models/studentSchema.js");
const Teacher = require("../models/teacherSchema.js");
const { clearSessionCookie } = require("../utils/authSession.js");

const getAuthSession = async (req, res) => {
    try {
        if (!req.auth) {
            return res.status(401).json({ message: "Authentication required" });
        }

        let userQuery;
        switch (req.auth.role) {
            case "Admin":
                userQuery = Admin.findById(req.auth.userId).select("-password");
                break;
            case "Teacher":
                userQuery = Teacher.findById(req.auth.userId)
                    .select("-password")
                    .populate("teachSubject", "subName sessions")
                    .populate("school", "schoolName")
                    .populate("teachSclass", "sclassName");
                break;
            case "Student":
                userQuery = Student.findById(req.auth.userId)
                    .select("-password")
                    .populate("school", "schoolName")
                    .populate("sclassName", "sclassName");
                break;
            default:
                return res.status(403).json({ message: "Unsupported session role" });
        }

        const user = await userQuery;
        if (!user || user.role !== req.auth.role) {
            clearSessionCookie(res);
            return res.status(401).json({ message: "The account for this session no longer exists" });
        }

        const profile = user.toObject();
        delete profile.password;

        if (req.auth.role === "Student") {
            delete profile.examResult;
            delete profile.attendance;
        }

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
