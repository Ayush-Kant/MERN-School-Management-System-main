const mongoose = require("mongoose");

const learningAttemptResponseSchema = new mongoose.Schema({
    questionId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 64,
    },
    concept: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    selectedOptionId: {
        type: String,
        trim: true,
        maxlength: 32,
        default: null,
    },
    isCorrect: {
        type: Boolean,
        required: true,
    },
    answeredAt: {
        type: Date,
        required: true,
    },
}, { _id: false });

const learningAttemptSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "student",
        required: true,
        index: true,
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
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "learningQuiz",
        required: true,
        index: true,
    },
    quizVersion: {
        type: Number,
        required: true,
        min: 1,
    },
    idempotencyKey: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        maxlength: 128,
    },
    attemptNumber: {
        type: Number,
        required: true,
        min: 1,
    },
    responses: {
        type: [learningAttemptResponseSchema],
        required: true,
        validate: {
            validator(responses) {
                return Array.isArray(responses) && responses.length >= 1 && responses.length <= 30;
            },
            message: "An attempt must contain between 1 and 30 question responses",
        },
    },
    score: {
        type: Number,
        required: true,
        min: 0,
    },
    totalQuestions: {
        type: Number,
        required: true,
        min: 1,
        max: 30,
    },
    accuracyPercent: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    durationMs: {
        type: Number,
        min: 0,
        max: 3600000,
        default: null,
    },
    submittedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
}, { timestamps: true });

learningAttemptSchema.index(
    { student: 1, quiz: 1, idempotencyKey: 1 },
    { unique: true }
);
learningAttemptSchema.index({ school: 1, class: 1, subject: 1, submittedAt: -1 });

module.exports = mongoose.model("learningAttempt", learningAttemptSchema);
