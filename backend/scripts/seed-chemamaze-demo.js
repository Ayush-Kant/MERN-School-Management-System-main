#!/usr/bin/env node

const path = require("node:path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const catalog = require("../seeds/chemamaze-cbse-games.json");
const { hashAdminPassword } = require("../utils/adminPassword.js");
const { ensureChemAmazeDemoData } = require("../services/learning/chemamazeDemoSeed.js");
const {
    DEVELOPMENT_DATABASE_NAME,
    isLocalMongoHost,
    validateDevelopmentImportTarget,
    prepareLegacyGameImport,
    applyLegacyGameImport,
} = require("../services/learning/legacyGameImporter.js");

const DEFAULT_DEMO_MONGO_URL =
    "mongodb://127.0.0.1:27017/school_management_dev";

function getDatabaseTarget(mongoUrl) {
    let parsed;
    try {
        parsed = new URL(mongoUrl);
    } catch {
        throw new Error("CHEMAMAZE_DEMO_MONGO_URL must be a valid MongoDB connection URL");
    }

    if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) {
        throw new Error("ChemAmaze demo seed accepts only mongodb:// or mongodb+srv:// URLs");
    }

    const databaseName = decodeURIComponent(
        parsed.pathname.replace(/^\/+/, "").split("/")[0] || ""
    );

    return {
        databaseName,
        hostname: parsed.hostname,
    };
}

function printSummary(summary) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}

async function run() {
    // This is deliberately separate from MONGO_URL so the demo command can
    // never silently seed the database used by the normal backend server.
    const mongoUrl =
        process.env.CHEMAMAZE_DEMO_MONGO_URL || DEFAULT_DEMO_MONGO_URL;
    const target = getDatabaseTarget(mongoUrl);
    const nodeEnv = process.env.NODE_ENV || "development";

    // Running this explicitly named command is the write authorization. Keep
    // all environment/database/host guards; only the older manual apply path
    // continues to require the separate CHEMAMAZE_SEED_CONFIRM token.
    validateDevelopmentImportTarget({
        nodeEnv,
        databaseName: target.databaseName,
        hostname: target.hostname,
        allowRemote: false,
        apply: false,
    });

    mongoose.set("autoIndex", false);
    await mongoose.connect(mongoUrl);

    if (mongoose.connection.name !== DEVELOPMENT_DATABASE_NAME) {
        throw new Error(
            "Connected MongoDB database does not match the required development database"
        );
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
            admin: "admin@chemamaze.demo",
            teacherPassword: "DemoTeacher@12345",
            studentPassword: "DemoStudent@12345",
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
