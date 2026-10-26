const mongoose = require("mongoose");

const quizOptionSchema = new mongoose.Schema({
    optionId: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 32,
    },
    text: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 500,
    },
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
    prompt: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 1000,
    },
    concept: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 120,
    },
    options: {
        type: [quizOptionSchema],
        required: true,
        validate: {
            validator(options) {
                return Array.isArray(options) && options.length >= 2 && options.length <= 6;
            },
            message: "Each question must have between 2 and 6 options",
        },
    },
    correctOptionId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 32,
    },
    explanation: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: "",
    },
}, { timestamps: false });

const learningQuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 160,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1200,
        default: "",
    },
    topic: {
        type: String,
        trim: true,
        maxlength: 160,
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
    questions: {
        type: [quizQuestionSchema],
        required: true,
        validate: {
            validator(questions) {
                return Array.isArray(questions) && questions.length >= 1 && questions.length <= 30;
            },
            message: "A quiz must contain between 1 and 30 questions",
        },
    },
    version: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
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
}, { timestamps: true });

learningQuizSchema.index({ school: 1, class: 1, subject: 1, status: 1 });
learningQuizSchema.index({ createdByTeacher: 1, updatedAt: -1 });

module.exports = mongoose.model("learningQuiz", learningQuizSchema);
