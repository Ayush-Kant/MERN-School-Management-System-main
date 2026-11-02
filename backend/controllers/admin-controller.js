const { hashAdminPassword, verifyAdminPassword } = require("../utils/adminPassword.js");
const {
    getSessionConfig,
    createSessionToken,
    setSessionCookie,
} = require("../utils/authSession.js");
const Admin = require('../models/adminSchema.js');
const Sclass = require('../models/sclassSchema.js');
const Student = require('../models/studentSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Subject = require('../models/subjectSchema.js');
const Notice = require('../models/noticeSchema.js');
const Complain = require('../models/complainSchema.js');

// const adminRegister = async (req, res) => {
//     try {
//         const salt = await bcrypt.genSalt(10);
//         const hashedPass = await bcrypt.hash(req.body.password, salt);

//         const admin = new Admin({
//             ...req.body,
//             password: hashedPass
//         });

//         const existingAdminByEmail = await Admin.findOne({ email: req.body.email });
//         const existingSchool = await Admin.findOne({ schoolName: req.body.schoolName });

//         if (existingAdminByEmail) {
//             res.send({ message: 'Email already exists' });
//         }
//         else if (existingSchool) {
//             res.send({ message: 'School name already exists' });
//         }
//         else {
//             let result = await admin.save();
//             result.password = undefined;
//             res.send(result);
//         }
//     } catch (err) {
//         res.status(500).json(err);
//     }
// };

// const adminLogIn = async (req, res) => {
//     if (req.body.email && req.body.password) {
//         let admin = await Admin.findOne({ email: req.body.email });
//         if (admin) {
//             const validated = await bcrypt.compare(req.body.password, admin.password);
//             if (validated) {
//                 admin.password = undefined;
//                 res.send(admin);
//             } else {
//                 res.send({ message: "Invalid password" });
//             }
//         } else {
//             res.send({ message: "User not found" });
//         }
//     } else {
//         res.send({ message: "Email and password are required" });
//     }
// };

const adminRegister = async (req, res) => {
    try {
        const sessionConfig = getSessionConfig();
        const body = req.body || {};
        const { password } = body;

        if (typeof password !== "string" || password.length === 0) {
            return res.status(400).json({ message: "Password is required" });
        }

        const existingAdminByEmail = await Admin.findOne({ email: body.email });
        const existingSchool = await Admin.findOne({ schoolName: body.schoolName });

        if (existingAdminByEmail) {
            return res.send({ message: 'Email already exists' });
        }
        else if (existingSchool) {
            return res.send({ message: 'School name already exists' });
        }
        else {
            const hashedPassword = await hashAdminPassword(password);
            const admin = new Admin({
                ...body,
                password: hashedPassword,
            });

            const result = await admin.save();
            const sessionToken = createSessionToken(
                { userId: String(result._id), role: "Admin" },
                { config: sessionConfig }
            );
            setSessionCookie(res, sessionToken, sessionConfig);

            result.password = undefined;
            return res.send(result);
        }
    } catch (err) {
        return res.status(500).json(err);
    }
};

const adminLogIn = async (req, res) => {
    try {
        const sessionConfig = getSessionConfig();
        const body = req.body || {};

        if (!body.email || typeof body.password !== "string" || body.password.length === 0) {
            return res.send({ message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email: body.email });
        if (!admin) {
            return res.send({ message: "User not found" });
        }

        const verification = await verifyAdminPassword(body.password, admin.password);
        if (!verification.valid) {
            return res.send({ message: "Invalid password" });
        }

        // Existing plaintext Admin passwords are upgraded after a successful login.
        // This preserves access for legacy accounts without keeping plaintext after login.
        if (verification.needsRehash) {
            admin.password = await hashAdminPassword(body.password);
            await admin.save();
        }

        const sessionToken = createSessionToken(
            { userId: String(admin._id), role: "Admin" },
            { config: sessionConfig }
        );
        setSessionCookie(res, sessionToken, sessionConfig);

        admin.password = undefined;
        return res.send(admin);
    } catch (err) {
        return res.status(500).json(err);
    }
};

const getAdminDetail = async (req, res) => {
    try {
        let admin = await Admin.findById(req.params.id);
        if (admin) {
            admin.password = undefined;
            res.send(admin);
        }
        else {
            res.send({ message: "No admin found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

// const deleteAdmin = async (req, res) => {
//     try {
//         const result = await Admin.findByIdAndDelete(req.params.id)

//         await Sclass.deleteMany({ school: req.params.id });
//         await Student.deleteMany({ school: req.params.id });
//         await Teacher.deleteMany({ school: req.params.id });
//         await Subject.deleteMany({ school: req.params.id });
//         await Notice.deleteMany({ school: req.params.id });
//         await Complain.deleteMany({ school: req.params.id });

//         res.send(result)
//     } catch (error) {
//         res.status(500).json(err);
//     }
// }

// const updateAdmin = async (req, res) => {
//     try {
//         if (req.body.password) {
//             const salt = await bcrypt.genSalt(10)
//             res.body.password = await bcrypt.hash(res.body.password, salt)
//         }
//         let result = await Admin.findByIdAndUpdate(req.params.id,
//             { $set: req.body },
//             { new: true })

//         result.password = undefined;
//         res.send(result)
//     } catch (error) {
//         res.status(500).json(err);
//     }
// }

// module.exports = { adminRegister, adminLogIn, getAdminDetail, deleteAdmin, updateAdmin };

module.exports = { adminRegister, adminLogIn, getAdminDetail };
