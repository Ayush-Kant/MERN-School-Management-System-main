const { sameReference } = require("./gameActivityIntegrity");

const DEMO_SCHOOL = Object.freeze({
    name: "ChemAmaze Demo Administrator",
    email: "admin@chemamaze.demo",
    schoolName: "ChemAmaze Demo School",
});

const DEMO_CLASSES = Object.freeze([6, 7, 8]);

const DEMO_SUBJECTS = Object.freeze([
    { name: "Science", codePrefix: "SCI" },
    { name: "Mathematics", codePrefix: "MAT" },
]);

const DEMO_PASSWORDS = Object.freeze({
    admin: "password",
    teacher: "password",
    student: "password",
});

const LOCAL_MONGO_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const BLOCKED_DATABASE_NAMES = new Set([
    "admin",
    "config",
    "local",
    "test",
    "school_management_test",
]);

function isLocalMongoHost(hostname) {
    return LOCAL_MONGO_HOSTS.has(
        typeof hostname === "string" ? hostname.toLowerCase() : ""
    );
}

/**
 * Use the same local development database configured for the application.
 * Never allow this convenience seed to target a remote, system, test or
 * production database.
 */
function resolveDemoSeedTarget(mongoUrl, nodeEnv = "development") {
    if (nodeEnv !== "development") {
        throw new Error("The ChemAmaze demo seed is allowed only when NODE_ENV=development");
    }
    if (typeof mongoUrl !== "string" || mongoUrl.length === 0) {
        throw new Error("MONGO_URL is required; set it to the same local MongoDB URL used by the application");
    }

    let parsed;
    try {
        parsed = new URL(mongoUrl);
    } catch {
        throw new Error("MONGO_URL must be a valid MongoDB connection URL");
    }

    if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) {
        throw new Error("MONGO_URL must use mongodb:// or mongodb+srv://");
    }
    if (!isLocalMongoHost(parsed.hostname)) {
        throw new Error("The ChemAmaze demo seed is restricted to a local MongoDB host");
    }

    let databaseName;
    try {
        databaseName = decodeURIComponent(
            parsed.pathname.replace(/^\\/+/, "").split("/")[0] || ""
        );
    } catch {
        databaseName = "";
    }

    const normalizedName = databaseName.toLowerCase();
    if (
        !databaseName ||
        BLOCKED_DATABASE_NAMES.has(normalizedName) ||
        /(^|[-_])(prod|production)([-_]|$)/i.test(databaseName) ||
        normalizedName.endsWith("_test")
    ) {
        throw new Error("MONGO_URL must name an ordinary local development database, not a system, test or production database");
    }

    return {
        databaseName,
        hostname: parsed.hostname,
    };
}

function requireModel(model, name, methods) {
    if (!model || methods.some((method) => typeof model[method] !== "function")) {
        throw new TypeError(`ChemAmaze demo seed requires ${name} with ${methods.join(", ")}`);
    }
}

function requireHashFunction(hash, name) {
    if (typeof hash !== "function") {
        throw new TypeError(`ChemAmaze demo seed requires ${name}`);
    }
}

function sameId(left, right) {
    return sameReference(left, right);
}

async function ensureAdmin(AdminModel, hashAdminPassword, counts) {
    const [byEmail, bySchoolName] = await Promise.all([
        AdminModel.findOne({ email: DEMO_SCHOOL.email }),
        AdminModel.findOne({ schoolName: DEMO_SCHOOL.schoolName }),
    ]);

    if (byEmail && bySchoolName && !sameId(byEmail._id, bySchoolName._id)) {
        throw new Error("Demo Admin email and school name already belong to different records; refusing to merge them");
    }

    const existing = byEmail || bySchoolName;
    if (existing) {
        if (
            existing.email !== DEMO_SCHOOL.email ||
            existing.schoolName !== DEMO_SCHOOL.schoolName ||
            (existing.role && existing.role !== "Admin")
        ) {
            throw new Error("A conflicting account already uses the ChemAmaze demo Admin email or school name");
        }

        counts.reused.school += 1;
        return existing;
    }

    const password = await hashAdminPassword(DEMO_PASSWORDS.admin);
    const school = await AdminModel.create({
        ...DEMO_SCHOOL,
        password,
        role: "Admin",
    });
    counts.created.school += 1;
    return school;
}

async function ensureClass(SclassModel, school, grade, counts) {
    const sclassName = `Class ${grade}`;
    const existing = await SclassModel.findOne({ school: school._id, sclassName });

    if (existing) {
        if (!sameId(existing.school, school._id) || existing.sclassName !== sclassName) {
            throw new Error(`Conflicting demo class record found for ${sclassName}`);
        }
        counts.reused.classes += 1;
        return existing;
    }

    const schoolClass = await SclassModel.create({
        school: school._id,
        sclassName,
    });
    counts.created.classes += 1;
    return schoolClass;
}

async function ensureSubject(SubjectModel, school, schoolClass, grade, subjectConfig, counts) {
    const { name, codePrefix } = subjectConfig;
    const subCode = `${codePrefix}-G${grade}`;
    const existing = await SubjectModel.findOne({
        school: school._id,
        sclassName: schoolClass._id,
        subName: name,
    });

    if (existing) {
        if (
            !sameId(existing.school, school._id) ||
            !sameId(existing.sclassName, schoolClass._id) ||
            existing.subName !== name ||
            existing.subCode !== subCode
        ) {
            throw new Error(`Conflicting demo ${name} subject record found for Class ${grade}`);
        }
        counts.reused.subjects += 1;
        return existing;
    }

    const subject = await SubjectModel.create({
        school: school._id,
        sclassName: schoolClass._id,
        subName: name,
        subCode,
        sessions: "40",
    });
    counts.created.subjects += 1;
    return subject;
}

async function ensureTeacher(
    TeacherModel,
    SubjectModel,
    school,
    schoolClass,
    subject,
    grade,
    subjectName,
    hashPassword,
    counts
) {
    const emailPrefix = subjectName === "Mathematics" ? "math" : "sci";
    const email = `${emailPrefix}${grade}@demo.com`;
    const existing = await TeacherModel.findOne({ email });

    // Do not attach a newly-created demo Teacher to a subject already owned
    // by another persisted Teacher.
    if (subject.teacher && (!existing || !sameId(subject.teacher, existing._id))) {
        throw new Error(`Class ${grade} ${subjectName} is already assigned to a different Teacher`);
    }

    let teacher = existing;
    if (teacher) {
        if (
            !sameId(teacher.school, school._id) ||
            !sameId(teacher.teachSclass, schoolClass._id) ||
            !sameId(teacher.teachSubject, subject._id) ||
            (teacher.role && teacher.role !== "Teacher")
        ) {
            throw new Error(`Conflicting demo Teacher assignment found for ${grade}|${subjectName}`);
        }
        counts.reused.teachers += 1;
    } else {
        const password = await hashPassword(DEMO_PASSWORDS.teacher);
        teacher = await TeacherModel.create({
            name: `${subjectName === "Mathematics" ? "Math" : "Science"} Teacher ${grade}`,
            email,
            password,
            role: "Teacher",
            school: school._id,
            teachSclass: schoolClass._id,
            teachSubject: subject._id,
        });
        counts.created.teachers += 1;
    }

    if (!subject.teacher) {
        const updateResult = await SubjectModel.updateOne(
            {
                _id: subject._id,
                $or: [{ teacher: null }, { teacher: { $exists: false } }],
            },
            { $set: { teacher: teacher._id } }
        );

        if (updateResult.matchedCount === 0) {
            const latestSubject = await SubjectModel.findById(subject._id);
            if (!latestSubject || !sameId(latestSubject.teacher, teacher._id)) {
                throw new Error(`Could not safely link the demo Teacher to ${grade}| ${subjectName}`);
            }
        }
    }

    return teacher;
}

async function ensureStudent(StudentModel, school, schoolClass, grade, hashPassword, counts) {
    const rollNum = grade * 100 + 1;
    const name = `Student ${grade}`;
    const existing = await StudentModel.findOne({
        school: school._id,
        sclassName: schoolClass._id,
        rollNum,
    });

    if (existing) {
        if (
            !sameId(existing.school, school._id) ||
            !sameId(existing.sclassName, schoolClass._id) ||
            existing.rollNum !== rollNum ||
            existing.name !== name ||
            (existing.role && existing.role !== "Student")
        ) {
            throw new Error(`Conflicting demo Student record found for Class ${grade}, roll number ${rollNum}`);
        }
        counts.reused.students += 1;
        return existing;
    }

    const password = await hashPassword(DEMO_PASSWORDS.student);
    const student = await StudentModel.create({
        name,
        rollNum,
        password,
        role: "Student",
        school: school._id,
        sclassName: schoolClass._id,
    });
    counts.created.students += 1;
    return student;
}

/**
 * Create/reuse a fictional school structure for local ChemAmaze testing.
 * Existing records are never renamed, re-assigned or password-reset.
 */
async function ensureChemAmazeDemoData({
    models,
    hashAdminPassword,
    hashPassword,
} = {}) {
    requireHashFunction(hashAdminPassword, "hashAdminPassword");
    requireHashFunction(hashPassword, "hashPassword");

    const {
        AdminModel,
        SclassModel,
        SubjectModel,
        TeacherModel,
        StudentModel,
    } = models || {};

    requireModel(AdminModel, "AdminModel", ["findOne", "create"]);
    requireModel(SclassModel, "SclassModel", ["findOne", "create"]);
    requireModel(SubjectModel, "SubjectModel", ["findOne", "create", "updateOne", "findById"]);
    requireModel(TeacherModel, "TeacherModel", ["findOne", "create"]);
    requireModel(StudentModel, "StudentModel", ["findOne", "create"]);

    const counts = {
        created: { school: 0, classes: 0, subjects: 0, teachers: 0, students: 0 },
        reused: { school: 0, classes: 0, subjects: 0, teachers: 0, students: 0 },
    };

    const school = await ensureAdmin(AdminModel, hashAdminPassword, counts);
    const classes = {};
    const students = {};
    const assignments = {};

    for (const grade of DEMO_CLASSES) {
        const schoolClass = await ensureClass(SclassModel, school, grade, counts);
        classes[grade] = schoolClass;

        for (const subjectConfig of DEMO_SUBJECTS) {
            const subject = await ensureSubject(
                SubjectModel,
                school,
                schoolClass,
                grade,
                subjectConfig,
                counts
            );
            const teacher = await ensureTeacher(
                TeacherModel,
                SubjectModel,
                school,
                schoolClass,
                subject,
                grade,
                subjectConfig.name,
                hashPassword,
                counts
            );

            assignments[`${grade}|${subjectConfig.name}`] = {
                grade,
                classId: String(schoolClass._id),
                className: schoolClass.sclassName,
                subjectId: String(subject._id),
                teacherId: String(teacher._id),
            };
        }

        students[grade] = await ensureStudent(
            StudentModel,
            school,
            schoolClass,
            grade,
            hashPassword,
            counts
        );
    }

    return {
        school,
        classes,
        students,
        assignments,
        counts,
    };
}

module.exports = {
    DEMO_SCHOOL,
    DEMO_CLASSES,
    DEMO_SUBJECTS,
    DEMO_PASSWORDS,
    isLocalMongoHost,
    resolveDemoSeedTarget,
    ensureChemAmazeDemoData,
};
