const mongoose = require("mongoose");
const { validateWordwallEmbedUrl } = require("../utils/wordwallUrl");

const legacySourceSchema = new mongoose.Schema({
    sourceKey: {
        type: String,
        required: true,
        trim: true,
        maxlength: 180,
        immutable: true,
        match: /^chemamaze-cbse:(science|mathematics):class-[6-8]:chapter-[1-3]$/,
    },
    label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
        immutable: true,
    },
    repository: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        immutable: true,
    },
    revision: {
        type: String,
        required: true,
        match: /^[a-f\d]{40}$/i,
        immutable: true,
    },
    path: {
        type: String,
        required: true,
        trim: true,
        maxlength: 240,
        immutable: true,
    },
    grade: {
        type: Number,
        required: true,
        enum: [6, 7, 8],
        immutable: true,
    },
    chapter: {
        type: String,
        required: true,
        enum: ["Chapter 1", "Chapter 2", "Chapter 3"],
        immutable: true,
    },
}, { _id: false, id: false });

const gameActivitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
    },
    provider: {
        type: String,
        enum: ["wordwall"],
        default: "wordwall",
        immutable: true,
        index: true,
    },
    embedUrl: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator(value) {
                try {
                    validateWordwallEmbedUrl(value);
                    return true;
                } catch {
                    return false;
                }
            },
            message: "Enter an HTTPS Wordwall embed URL from the official Embed interface",
        },
    },
    originalUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: "",
    },
    legacySource: {
        type: legacySourceSchema,
        default: undefined,
        immutable: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
        required: true,
        index: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sclass",
        required: true,
        index: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
        required: true,
        index: true,
    },
    createdByTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teacher",
        required: true,
        index: true,
    },
    topic: {
        type: String,
        trim: true,
        maxlength: 160,
        default: "",
    },
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft",
        index: true,
    },
    publishedAt: {
        type: Date,
        default: null,
    },
    unpublishedAt: {
        type: Date,
        default: null,
    },
    archivedAt: {
        type: Date,
        default: null,
    },
    archiveReason: {
        type: String,
        default: null,
        validate: {
            validator(value) {
                return value === null || [
                    "manual",
                    "teacher_deleted",
                    "teacher_reassigned",
                    "class_deleted",
                    "subject_deleted",
                    "school_resources_deleted",
                ].includes(value);
            },
            message: "Unsupported GameActivity archive reason",
        },
    },
}, { timestamps: true });

// Student catalogue reads are scoped by school/class/subject/status and sorted newest first.
gameActivitySchema.index({ school: 1, class: 1, subject: 1, status: 1, createdAt: -1 });

// Teacher management reads additionally constrain the creator.
gameActivitySchema.index({
    createdByTeacher: 1,
    school: 1,
    class: 1,
    subject: 1,
    status: 1,
    createdAt: -1,
});

// Imported legacy records are uniquely identified within a school. The partial
// index leaves Teacher-created records (which have no legacySource) unchanged.
gameActivitySchema.index(
    { school: 1, "legacySource.sourceKey": 1 },
    {
        unique: true,
        partialFilterExpression: {
            "legacySource.sourceKey": { $type: "string" },
        },
    }
);

module.exports = mongoose.model("gameActivity", gameActivitySchema);
