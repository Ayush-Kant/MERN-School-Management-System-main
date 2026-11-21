#!/usr/bin/env node

const path = require("node:path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const catalog = require("../seeds/chemamaze-cbse-games.json");
const { hashAdminPassword } = require("../utils/adminPassword.js");
const {
    ensureChemAmazeDemoData,
    DEMO_PASSWORDS,
    isLocalMongoHost,
    resolveDemoSeedTarget,
} = require("../services/learning/chemamazeDemoSeed.js");
const {
    prepareLegacyGameImport,
    applyLegacyGameImport,
} = require("../services/learning/legacyGameImporter.js");

function printSummary(summary) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}

async function run() {
    // Use the same local MongoDB database configured for the application.
    const mongoUrl = process.env.MONGO_URL;
    const nodeEnv = process.env.NODE_ENV || "development";
    const target = resolveDemoSeedTarget(mongoUrl, nodeEnv);

    mongoose.set("autoIndex", false);
    await mongoose.connect(mongoUrl);

    if (mongoose.connection.name !== target.databaseName) {
        throw new Error("Connected MongoDB database does not match MONGO_URL");
    }
    if (!isLocalMongoHost(mongoose.connection.host)) {
        throw new Error("ChemAmaze demo seed is restricted to a local MongoDB host");
    }

    const AdminModel = require("../models/adminSchema.js");
    const SclassModel = require("../models/sclassSchema.js");
    const SubjectModel = require("../models/subjectSchema.js");
    const TeacherModel = require("../models/teacherSchema.js");
    const StudentModel = require("../models/studentSchema.js");
    const GameActivityModel = require("../models/gameActivitySchema.js");

    const demoData = await ensureChemAmazeDemoData({
        models: {
            AdminModel,
            SclassModel,
            SubjectModel,
            TeacherModel,
            StudentModel,
        },
        hashAdminPassword,
        hashPassword: (password) => bcrypt.hash(password, 10),
    });

    // Only the explicit seed command creates the GameActivity indexes.
    await GameActivityModel.createIndexes();

    const plan = await prepareLegacyGameImport({
        catalog,
        schoolId: String(demoData.school._id),
        assignments: demoData.assignments,
        models: {
            AdminModel,
            SclassModel,
            SubjectModel,
            TeacherModel,
            GameActivityModel,
        },
    });

    if (plan.conflicts.length > 0) {
        printSummary({
            mode: "development-demo-seed",
            targetDatabase: mongoose.connection.name,
            schoolName: demoData.school.schoolName,
            demoData: demoData.counts,
            games: {
                total: plan.total,
                wouldInsert: plan.toInsert.length,
                unchanged: plan.alreadyPresent.length,
                conflicts: plan.conflicts,
            },
            result: "blocked-no-game-writes",
        });
        process.exitCode = 1;
        return;
    }

    const imported = await applyLegacyGameImport(plan, GameActivityModel);

    printSummary({
        mode: "development-demo-seed",
        targetDatabase: mongoose.connection.name,
        schoolName: demoData.school.schoolName,
        demoData: demoData.counts,
        games: {
            total: plan.total,
            inserted: imported.inserted,
            unchanged: imported.unchanged,
            failures: imported.failures,
        },
        expectedTotalRecords: 37,
        result: imported.failures.length === 0 ? "seed-complete" : "seed-incomplete",
        demoLogins: {
            admin: {
                email: "admin@demo.com",
                password: DEMO_PASSWORDS.admin,
            },
            teachers: {
                password: DEMO_PASSWORDS.teacher,
                emails: Object.keys(demoData.assignments).map((key) => {
                    const [gradeText, subjectName] = key.split("|");
                    const prefix = subjectName === "Mathematics" ? "math" : "sci";
                    return `${prefix}${gradeText}@demo.com`;
                }),
            },
            students: {
                password: DEMO_PASSWORDS.student,
                accounts: Object.entries(demoData.students).map(([grade, student]) => ({
                    grade: Number(grade),
                    name: student.name,
                    rollNum: student.rollNum,
                })),
            },
        },
    });

    if (imported.failures.length > 0) {
        process.exitCode = 1;
    }
}

run()
    .catch((error) => {
        process.stderr.write(
            "ChemAmaze demo seed stopped: " +
            (error && typeof error.message === "string" ? error.message : "Unknown error") +
            "\n"
        );
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
