#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const catalog = require("../seeds/chemamaze-cbse-games.json");
const {
    EXPECTED_SUBJECTS,
    EXPECTED_GRADES,
    validateLegacyGameCatalog,
} = require("../services/learning/legacyGameCatalog");
const {
    DEVELOPMENT_DATABASE_NAME,
    APPLY_CONFIRMATION,
    validateDevelopmentImportTarget,
    prepareLegacyGameImport,
    applyLegacyGameImport,
} = require("../services/learning/legacyGameImporter");

function parseArguments(args) {
    const modes = ["--validate-only", "--dry-run", "--apply"];
    const selectedModes = modes.filter((mode) => args.includes(mode));
    if (selectedModes.length !== 1) {
        throw new Error("Choose exactly one mode: --validate-only, --dry-run, or --apply");
    }

    const targetsIndex = args.indexOf("--targets");
    let targetsPath = path.resolve(__dirname, "../seeds/chemamaze-targets.local.json");
    if (targetsIndex !== -1) {
        if (!args[targetsIndex + 1] || args[targetsIndex + 1].startsWith("--")) {
            throw new Error("--targets must be followed by a JSON file path");
        }
        targetsPath = path.resolve(process.cwd(), args[targetsIndex + 1]);
    }

    const acceptedArguments = new Set([
        selectedModes[0],
        ...(targetsIndex === -1 ? [] : ["--targets", args[targetsIndex + 1]]),
    ]);
    const unknown = args.filter((argument) => !acceptedArguments.has(argument));
    if (unknown.length) {
        throw new Error("Unknown argument: " + unknown[0]);
    }

    return {
        mode: selectedModes[0],
        targetsPath,
    };
}

function getDatabaseName(mongoUrl) {
    if (typeof mongoUrl !== "string" || !mongoUrl.trim()) {
        throw new Error("MONGO_URL is required for a database dry-run/import");
    }

    let parsed;
    try {
        parsed = new URL(mongoUrl);
    } catch {
        throw new Error("MONGO_URL must be a valid MongoDB connection URL");
    }

    const databaseName = decodeURIComponent(
        parsed.pathname.replace(/^\/+/, "").split("/")[0] || ""
    );
    return databaseName;
}

function getGroupCounts(records) {
    const counts = {};
    for (const grade of EXPECTED_GRADES) {
        for (const subject of EXPECTED_SUBJECTS) {
            counts[grade + "|" + subject] = 0;
        }
    }
    records.forEach((record) => {
        const key = record.grade + "|" + record.subject;
        counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
}

function printSummary(summary) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}

async function run() {
    const options = parseArguments(process.argv.slice(2));
    const validatedCatalog = validateLegacyGameCatalog(catalog);

    // Prevent Mongoose from creating schema indexes as a side effect of
    // connecting/querying during validate-only and dry-run modes.
    mongoose.set("autoIndex", false);

    if (options.mode === "--validate-only") {
        printSummary({
            mode: "validate-only",
            source: validatedCatalog.source.repository,
            sourceRevision: validatedCatalog.source.revision,
            records: validatedCatalog.records.length,
            groups: getGroupCounts(validatedCatalog.records),
            result: "catalog-valid",
        });
        return;
    }

    const databaseName = getDatabaseName(process.env.MONGO_URL);
    const isApply = options.mode === "--apply";
    validateDevelopmentImportTarget({
        nodeEnv: process.env.NODE_ENV,
        databaseName,
        apply: isApply,
        confirmation: process.env.CHEMAMAZE_SEED_CONFIRM,
    });

    const targetText = await fs.readFile(options.targetsPath, "utf8");
    let targets;
    try {
        targets = JSON.parse(targetText);
    } catch {
        throw new Error("The target mapping file is not valid JSON");
    }

    await mongoose.connect(process.env.MONGO_URL);
    if (mongoose.connection.name !== DEVELOPMENT_DATABASE_NAME) {
        throw new Error("Connected MongoDB database does not match the required development database");
    }

    const AdminModel = require("../models/adminSchema.js");
    const SclassModel = require("../models/sclassSchema.js");
    const SubjectModel = require("../models/subjectSchema.js");
    const TeacherModel = require("../models/teacherSchema.js");
    const GameActivityModel = require("../models/gameActivitySchema.js");

    // Apply mode explicitly creates the schema indexes before the first
    // insert. Dry-run does not create indexes or write documents.
    if (isApply) {
        await GameActivityModel.createIndexes();
    }

    const plan = await prepareLegacyGameImport({
        catalog: validatedCatalog,
        schoolId: targets.schoolId,
        assignments: targets.assignments,
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
            mode: options.mode.slice(2),
            records: plan.total,
            wouldInsert: plan.toInsert.length,
            unchanged: plan.alreadyPresent.length,
            conflicts: plan.conflicts,
            result: "blocked-no-writes",
        });
        process.exitCode = 1;
        return;
    }

    if (options.mode === "--dry-run") {
        printSummary({
            mode: "dry-run",
            targetDatabase: mongoose.connection.name,
            source: plan.source.repository,
            sourceRevision: plan.source.revision,
            records: plan.total,
            wouldInsert: plan.toInsert.length,
            unchanged: plan.alreadyPresent.length,
            conflicts: 0,
            defaultStatus: "draft",
            groups: getGroupCounts(validatedCatalog.records),
            result: "ready-to-import",
        });
        return;
    }

    const result = await applyLegacyGameImport(plan, GameActivityModel);
    printSummary({
        mode: "apply",
        targetDatabase: mongoose.connection.name,
        source: plan.source.repository,
        sourceRevision: plan.source.revision,
        records: plan.total,
        inserted: result.inserted,
        unchanged: result.unchanged,
        failures: result.failures,
        defaultStatus: "draft",
        result: result.failures.length === 0 ? "import-complete" : "import-incomplete",
    });

    if (result.failures.length > 0) {
        process.exitCode = 1;
    }
}

run()
    .catch((error) => {
        process.stderr.write("ChemAmaze import stopped: " +
            (error && typeof error.message === "string" ? error.message : "Unknown error") + "\n");
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
