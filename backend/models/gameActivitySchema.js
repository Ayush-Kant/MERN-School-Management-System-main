const mongoose = require("mongoose");
const { validateWordwallEmbedUrl } = require("../utils/wordwallUrl");

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

module.exports = mongoose.model("gameActivity", gameActivitySchema);
