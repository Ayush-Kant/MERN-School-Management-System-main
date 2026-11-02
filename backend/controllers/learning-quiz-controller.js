const { sendApiError } = require("../utils/apiResponse.js");

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const QUIZ_STATUSES = new Set(["draft", "published", "archived"]);
const MAX_QUESTIONS = 30;
const MAX_DURATION_MS = 3600000;

function isValidObjectId(value) {
    return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

function sameId(left, right) {
    if (left === undefined || left === null || right === undefined || right === null) {
        return false;
    }
    return String(left._id || left) === String(right._id || right);
}

function clientError(res, message) {
    return sendApiError(res, 400, message);
}

function getAuthenticatedActor(req, res, allowedRoles) {
    const actor = req && req.auth;
    if (
        !actor ||
        !isValidObjectId(actor.userId) ||
        !["Admin", "Teacher", "Student"].includes(actor.role)
    ) {
        sendApiError(res, 401, "Authentication required");
        return null;
    }

    if (!allowedRoles.includes(actor.role)) {
        sendApiError(res, 403, "You are not allowed to access this resource");
        return null;
    }

    return { userId: actor.userId, role: actor.role };
}

function rejectIdentityOverride(suppliedId, authenticatedId, res, fieldName) {
    if (suppliedId === undefined) return false;

    if (!isValidObjectId(suppliedId)) {
        clientError(res, `${fieldName} must be a valid id`);
        return true;
    }

    if (!sameId(suppliedId, authenticatedId)) {
        sendApiError(res, 403, `${fieldName} does not match the authenticated account`);
        return true;
    }

    return false;
}

function getQuestionId(question) {
    return String(question && (question._id || question.id || ""));
}

function getOptionId(option) {
    return String(option && (option.optionId || ""));
}

function validateQuestion(question, index) {
    const label = `Question ${index + 1}`;

    if (!question || typeof question !== "object" || Array.isArray(question)) {
        return `${label} must be an object`;
    }
    if (typeof question.prompt !== "string" || question.prompt.trim().length < 5 ||
        question.prompt.trim().length > 1000) {
        return `${label} must contain between 5 and 1000 characters`;
    }
    if (typeof question.concept !== "string" || !question.concept.trim() ||
        question.concept.trim().length > 120) {
        return `${label} must have a concept label of at most 120 characters`;
    }
    if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6) {
        return `${label} must have between 2 and 6 options`;
    }

    const optionIds = new Set();
    for (const option of question.options) {
        if (!option || typeof option.optionId !== "string" ||
            !option.optionId.trim() || option.optionId.trim().length > 32 ||
            typeof option.text !== "string" || !option.text.trim() ||
            option.text.trim().length > 500) {
            return `${label} contains an invalid option`;
        }
        const optionId = option.optionId.trim();
        if (optionIds.has(optionId)) {
            return `${label} contains duplicate option ids`;
        }
        optionIds.add(optionId);
    }

    if (typeof question.correctOptionId !== "string" ||
        !optionIds.has(question.correctOptionId.trim())) {
        return `${label} must identify one of its options as the correct answer`;
    }
    if (question.explanation !== undefined &&
        (typeof question.explanation !== "string" || question.explanation.length > 2000)) {
        return `${label} explanation must be a string of at most 2000 characters`;
    }

    return null;
}

function toStudentQuiz(quiz) {
    const source = quiz && typeof quiz.toObject === "function"
        ? quiz.toObject()
        : quiz;

    return {
        _id: source._id,
        title: source.title,
        description: source.description || "",
        topic: source.topic || "",
        school: source.school,
        class: source.class,
        subject: source.subject,
        createdByTeacher: source.createdByTeacher,
        version: source.version,
        status: source.status,
        publishedAt: source.publishedAt,
        createdAt: source.createdAt,
        questions: (source.questions || []).map((question) => ({
            _id: getQuestionId(question),
            prompt: question.prompt,
            concept: question.concept,
            options: (question.options || []).map((option) => ({
                optionId: option.optionId,
                text: option.text,
            })),
        })),
    };
}

/**
 * Models are injected for deterministic unit testing. Production wrappers use
 * the project's existing Mongoose models and Express controller conventions.
 */
function createLearningQuizController({
    LearningQuizModel,
    LearningAttemptModel,
    TeacherModel,
    StudentModel,
    SclassModel,
    SubjectModel,
}) {
    const learningQuizCreate = async (req, res) => {
        const actor = getAuthenticatedActor(req, res, ["Teacher"]);
        if (!actor) return;

        const body = req.body || {};
        if (rejectIdentityOverride(body.teacherId, actor.userId, res, "teacherId")) return;

        const {
            title,
            description = "",
            topic = "",
            questions,
        } = body;
        const teacherId = actor.userId;

        if (!isValidObjectId(teacherId)) {
            return sendApiError(res, 401, "Authentication required");
        }
        if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 160) {
            return clientError(res, "Title must contain between 3 and 160 characters");
        }
        if (typeof description !== "string" || description.trim().length > 1200) {
            return clientError(res, "Description must be a string of at most 1200 characters");
        }
        if (typeof topic !== "string" || topic.trim().length > 160) {
            return clientError(res, "Topic must be a string of at most 160 characters");
        }
        if (!Array.isArray(questions) || questions.length < 1 || questions.length > MAX_QUESTIONS) {
            return clientError(res, `A quiz must contain between 1 and ${MAX_QUESTIONS} questions`);
        }

        const questionIds = new Set();
        for (let index = 0; index < questions.length; index += 1) {
            const validationMessage = validateQuestion(questions[index], index);
            if (validationMessage) return clientError(res, validationMessage);
            const normalizedQuestion = questions[index];
            // Clients can supply option ids, but not persistent question ids.
            if (normalizedQuestion._id || normalizedQuestion.id) {
                return clientError(res, `Question ${index + 1} must not contain a question id`);
            }
            const promptKey = normalizedQuestion.prompt.trim().toLowerCase();
            if (questionIds.has(promptKey)) {
                return clientError(res, "Question prompts must be unique within a quiz");
            }
            questionIds.add(promptKey);
        }

        try {
            const teacher = await TeacherModel.findById(teacherId);
            if (!teacher) return sendApiError(res, 404, "Teacher not found");

            if (!teacher.school || !teacher.teachSclass || !teacher.teachSubject) {
                return clientError(res, "The teacher must be assigned to a school, class, and subject before creating a quiz");
            }

            const [schoolClass, subject] = await Promise.all([
                SclassModel.findById(teacher.teachSclass),
                SubjectModel.findById(teacher.teachSubject),
            ]);

            if (!schoolClass || !subject) {
                return clientError(res, "The teacher's assigned class or subject could not be found");
            }

            const assignmentsMatch =
                sameId(schoolClass.school, teacher.school) &&
                sameId(subject.school, teacher.school) &&
                sameId(subject.sclassName, teacher.teachSclass);

            if (!assignmentsMatch) {
                return clientError(res, "The teacher's class and subject must belong to the same school and class");
            }

            if (subject.teacher && !sameId(subject.teacher, teacher._id)) {
                return sendApiError(res, 409, "The assigned subject is linked to a different teacher");
            }

            const quiz = new LearningQuizModel({
                title: title.trim(),
                description: description.trim(),
                topic: topic.trim(),
                school: teacher.school,
                class: teacher.teachSclass,
                subject: teacher.teachSubject,
                createdByTeacher: teacher._id || teacherId,
                questions: questions.map((question) => ({
                    prompt: question.prompt.trim(),
                    concept: question.concept.trim(),
                    options: question.options.map((option) => ({
                        optionId: option.optionId.trim(),
                        text: option.text.trim(),
                    })),
                    correctOptionId: question.correctOptionId.trim(),
                    explanation: (question.explanation || "").trim(),
                })),
                version: 1,
                status: "draft",
            });

            return res.status(201).json(await quiz.save());
        } catch (error) {
            if (error && (error.name === "ValidationError" || error.name === "CastError")) {
                return clientError(res, "Request data failed validation");
            }
            return sendApiError(res, 500, "Unable to create learning quiz");
        }
    };

    const learningQuizList = async (req, res) => {
        const actor = getAuthenticatedActor(req, res, ["Teacher", "Student"]);
        if (!actor) return;

        const schoolId = req.params && req.params.id;
        const queryParams = (req && req.query) || {};
        const { classId, subjectId, teacherId, status } = queryParams;

        if (!isValidObjectId(schoolId)) return clientError(res, "A valid school id is required");
        if (classId !== undefined && !isValidObjectId(classId)) return clientError(res, "classId must be a valid id");
        if (subjectId !== undefined && !isValidObjectId(subjectId)) return clientError(res, "subjectId must be a valid id");
        if (teacherId !== undefined && !isValidObjectId(teacherId)) return clientError(res, "teacherId must be a valid id");
        if (status !== undefined && !QUIZ_STATUSES.has(status)) {
            return clientError(res, "status must be draft, published, or archived");
        }

        try {
            let filter;
            let teacherView = false;

            if (actor.role === "Teacher") {
                if (rejectIdentityOverride(teacherId, actor.userId, res, "teacherId")) return;

                const teacher = await TeacherModel.findById(actor.userId);
                if (!teacher || !teacher.school || !teacher.teachSclass || !teacher.teachSubject) {
                    return sendApiError(res, 404, "Teacher not found or not assigned to a class and subject");
                }
                if (!sameId(teacher.school, schoolId)) {
                    return sendApiError(res, 404, "Learning quizzes not found for this school");
                }
                if (classId !== undefined && !sameId(classId, teacher.teachSclass)) {
                    return sendApiError(res, 403, "You cannot list quizzes outside your assigned class");
                }
                if (subjectId !== undefined && !sameId(subjectId, teacher.teachSubject)) {
                    return sendApiError(res, 403, "You cannot list quizzes outside your assigned subject");
                }

                const [schoolClass, subject] = await Promise.all([
                    SclassModel.findById(teacher.teachSclass),
                    SubjectModel.findById(teacher.teachSubject),
                ]);
                if (
                    !schoolClass ||
                    !subject ||
                    !sameId(schoolClass.school, teacher.school) ||
                    !sameId(subject.school, teacher.school) ||
                    !sameId(subject.sclassName, teacher.teachSclass) ||
                    (subject.teacher && !sameId(subject.teacher, actor.userId))
                ) {
                    return sendApiError(res, 403, "Your current class and subject assignments are not valid");
                }

                filter = {
                    school: teacher.school,
                    class: teacher.teachSclass,
                    subject: teacher.teachSubject,
                    createdByTeacher: actor.userId,
                };
                if (status) filter.status = status;
                teacherView = true;
            } else {
                if (teacherId !== undefined) {
                    return sendApiError(res, 403, "Student requests cannot use a teacher identity");
                }
                if (!classId) {
                    return clientError(res, "classId is required when listing student quizzes");
                }
                if (status !== undefined && status !== "published") {
                    return sendApiError(res, 403, "Students can only list published quizzes");
                }

                const student = await StudentModel.findById(actor.userId);
                if (!student || !student.school || !student.sclassName) {
                    return sendApiError(res, 404, "Student not found or not assigned to a class");
                }
                if (!sameId(student.school, schoolId)) {
                    return sendApiError(res, 404, "Learning quizzes not found for this school");
                }
                if (!sameId(classId, student.sclassName)) {
                    return sendApiError(res, 403, "You cannot list quizzes outside your assigned class");
                }

                const schoolClass = await SclassModel.findById(student.sclassName);
                if (!schoolClass || !sameId(schoolClass.school, student.school)) {
                    return sendApiError(res, 404, "Student class not found in this school");
                }

                filter = {
                    school: student.school,
                    class: student.sclassName,
                    status: "published",
                };

                if (subjectId !== undefined) {
                    const subject = await SubjectModel.findById(subjectId);
                    if (
                        !subject ||
                        !sameId(subject.school, student.school) ||
                        !sameId(subject.sclassName, student.sclassName)
                    ) {
                        return sendApiError(res, 404, "Subject not found in the student's class");
                    }
                    filter.subject = subject._id || subjectId;
                }
            }

            const quizzes = await LearningQuizModel.find(filter)
                .populate("class", "sclassName")
                .populate("subject", "subName subCode")
                .populate("createdByTeacher", "name")
                .sort({ createdAt: -1 })
                .exec();

            return res.status(200).json(teacherView ? quizzes : quizzes.map(toStudentQuiz));
        } catch (error) {
            return sendApiError(res, 500, "Unable to list learning quizzes");
        }
    };

    const publishLearningQuiz = async (req, res) => {
        const actor = getAuthenticatedActor(req, res, ["Teacher"]);
        if (!actor) return;

        const quizId = req.params && req.params.id;
        const body = req.body || {};

        if (!isValidObjectId(quizId)) return clientError(res, "A valid quiz id is required");
        if (rejectIdentityOverride(body.teacherId, actor.userId, res, "teacherId")) return;

        try {
            const teacher = await TeacherModel.findById(actor.userId);
            if (!teacher || !teacher.school || !teacher.teachSclass || !teacher.teachSubject) {
                return sendApiError(res, 404, "Teacher not found or not assigned to a class and subject");
            }

            const [schoolClass, subject] = await Promise.all([
                SclassModel.findById(teacher.teachSclass),
                SubjectModel.findById(teacher.teachSubject),
            ]);
            if (
                !schoolClass ||
                !subject ||
                !sameId(schoolClass.school, teacher.school) ||
                !sameId(subject.school, teacher.school) ||
                !sameId(subject.sclassName, teacher.teachSclass) ||
                (subject.teacher && !sameId(subject.teacher, actor.userId))
            ) {
                return sendApiError(res, 403, "Your current class and subject assignments are not valid");
            }

            const quizScope = {
                _id: quizId,
                createdByTeacher: actor.userId,
                school: teacher.school,
                class: teacher.teachSclass,
                subject: teacher.teachSubject,
            };
            const publishedQuiz = await LearningQuizModel.findOneAndUpdate(
                { ...quizScope, status: "draft" },
                { $set: { status: "published", publishedAt: new Date() } },
                { new: true, runValidators: true }
            );
            if (publishedQuiz) return res.status(200).json(publishedQuiz);

            const ownedQuiz = await LearningQuizModel.findOne(quizScope);
            if (!ownedQuiz) return sendApiError(res, 404, "Quiz not found for this teacher");
            return sendApiError(res, 409, "Only draft quizzes can be published");
        } catch (error) {
            if (error && (error.name === "ValidationError" || error.name === "CastError")) {
                return clientError(res, "Request data failed validation");
            }
            return sendApiError(res, 500, "Unable to publish learning quiz");
        }
    };

    const learningQuizSubmit = async (req, res) => {
        const actor = getAuthenticatedActor(req, res, ["Student"]);
        if (!actor) return;

        const quizId = req.params && req.params.id;
        const body = req.body || {};
        const { studentId: suppliedStudentId, idempotencyKey, answers, durationMs } = body;
        const studentId = actor.userId;

        if (!isValidObjectId(quizId)) return clientError(res, "A valid quiz id is required");
        if (rejectIdentityOverride(suppliedStudentId, studentId, res, "studentId")) return;
        if (typeof idempotencyKey !== "string" || idempotencyKey.trim().length < 8 ||
            idempotencyKey.trim().length > 128) {
            return clientError(res, "idempotencyKey must contain between 8 and 128 characters");
        }
        if (!Array.isArray(answers) || answers.length > MAX_QUESTIONS) {
            return clientError(res, `answers must be an array with at most ${MAX_QUESTIONS} entries`);
        }
        if (durationMs !== undefined && (!Number.isInteger(durationMs) ||
            durationMs < 0 || durationMs > MAX_DURATION_MS)) {
            return clientError(res, "durationMs must be an integer between 0 and 3600000");
        }

        const seenQuestions = new Set();
        for (const answer of answers) {
            if (!answer || typeof answer.questionId !== "string" || !answer.questionId.trim()) {
                return clientError(res, "Each answer must include a questionId");
            }
            if (seenQuestions.has(answer.questionId)) {
                return clientError(res, "Duplicate answers for the same question are not allowed");
            }
            seenQuestions.add(answer.questionId);
            if (answer.selectedOptionId !== undefined && answer.selectedOptionId !== null &&
                typeof answer.selectedOptionId !== "string") {
                return clientError(res, "selectedOptionId must be a string or null");
            }
        }

        try {
            const quiz = await LearningQuizModel.findById(quizId);
            if (!quiz) return sendApiError(res, 404, "Quiz not found");

            const student = await StudentModel.findById(studentId);
            if (
                !student ||
                !sameId(student.school, quiz.school) ||
                !sameId(student.sclassName, quiz.class)
            ) {
                return sendApiError(res, 404, "Quiz not found for this student");
            }

            const [schoolClass, subject] = await Promise.all([
                SclassModel.findById(student.sclassName),
                SubjectModel.findById(quiz.subject),
            ]);
            if (
                !schoolClass ||
                !sameId(schoolClass.school, student.school) ||
                !subject ||
                !sameId(subject.school, student.school) ||
                !sameId(subject.sclassName, student.sclassName)
            ) {
                return sendApiError(res, 404, "Quiz not found for this student");
            }

            const attemptScope = {
                student: student._id || studentId,
                quiz: quiz._id || quizId,
                idempotencyKey: idempotencyKey.trim(),
            };
            const existingAttempt = await LearningAttemptModel.findOne(attemptScope);
            if (existingAttempt) {
                return res.status(200).json({ attempt: existingAttempt, replayed: true });
            }

            if (quiz.status !== "published") {
                return sendApiError(res, 404, "Quiz not found");
            }

            const questionById = new Map((quiz.questions || []).map((question) => [
                getQuestionId(question),
                question,
            ]));

            for (const answer of answers) {
                const question = questionById.get(answer.questionId);
                if (!question) return clientError(res, "An answer refers to a question outside this quiz");
                const selectedOptionId = answer.selectedOptionId == null ? "" : answer.selectedOptionId.trim();
                if (selectedOptionId &&
                    !(question.options || []).some((option) => getOptionId(option) === selectedOptionId)) {
                    return clientError(res, "An answer refers to an option outside its question");
                }
            }

            if (!Array.isArray(quiz.questions) || quiz.questions.length < 1 || quiz.questions.length > MAX_QUESTIONS) {
                return sendApiError(res, 409, "This quiz is not in a valid state for submission");
            }

            const answersByQuestion = new Map(answers.map((answer) => [
                answer.questionId,
                answer.selectedOptionId == null ? "" : answer.selectedOptionId.trim(),
            ]));
            const answeredAt = new Date();
            let score = 0;

            const responses = quiz.questions.map((question) => {
                const questionId = getQuestionId(question);
                const selectedOptionId = answersByQuestion.get(questionId) || "";
                const isCorrect = selectedOptionId !== "" &&
                    selectedOptionId === String(question.correctOptionId);
                if (isCorrect) score += 1;

                return {
                    questionId,
                    concept: String(question.concept || "Uncategorized").trim().slice(0, 120),
                    selectedOptionId: selectedOptionId || null,
                    isCorrect,
                    answeredAt,
                };
            });

            const attemptNumber = await LearningAttemptModel.countDocuments({
                student: student._id || studentId,
                quiz: quiz._id || quizId,
            }) + 1;
            const totalQuestions = responses.length;
            const attempt = new LearningAttemptModel({
                ...attemptScope,
                school: student.school,
                class: student.sclassName,
                subject: quiz.subject,
                quizVersion: quiz.version || 1,
                attemptNumber,
                responses,
                score,
                totalQuestions,
                accuracyPercent: Math.round((score / totalQuestions) * 10000) / 100,
                durationMs: durationMs === undefined ? null : durationMs,
                submittedAt: answeredAt,
            });

            const savedAttempt = await attempt.save();
            return res.status(201).json({
                attempt: savedAttempt,
                replayed: false,
                feedback: responses.map((response) => {
                    const question = questionById.get(response.questionId);
                    return {
                        questionId: response.questionId,
                        isCorrect: response.isCorrect,
                        correctOptionId: String(question.correctOptionId),
                        explanation: question.explanation || "",
                    };
                }),
            });
        } catch (error) {
            if (error && error.code === 11000) {
                try {
                    const existingAttempt = await LearningAttemptModel.findOne({
                        student: studentId,
                        quiz: quizId,
                        idempotencyKey: idempotencyKey.trim(),
                    });
                    if (existingAttempt) return res.status(200).json({ attempt: existingAttempt, replayed: true });
                } catch {
                    // Fall through to the generic response if the duplicate cannot be recovered.
                }
            }
            if (error && (error.name === "ValidationError" || error.name === "CastError")) {
                return clientError(res, "Request data failed validation");
            }
            return sendApiError(res, 500, "Unable to record learning attempt");
        }
    };

    return { learningQuizCreate, learningQuizList, publishLearningQuiz, learningQuizSubmit };
}

let defaultController;

function getDefaultController() {
    if (!defaultController) {
        defaultController = createLearningQuizController({
            LearningQuizModel: require("../models/learningQuizSchema.js"),
            LearningAttemptModel: require("../models/learningAttemptSchema.js"),
            TeacherModel: require("../models/teacherSchema.js"),
            StudentModel: require("../models/studentSchema.js"),
            SclassModel: require("../models/sclassSchema.js"),
            SubjectModel: require("../models/subjectSchema.js"),
        });
    }
    return defaultController;
}

const learningQuizCreate = (req, res) => getDefaultController().learningQuizCreate(req, res);
const learningQuizList = (req, res) => getDefaultController().learningQuizList(req, res);
const publishLearningQuiz = (req, res) => getDefaultController().publishLearningQuiz(req, res);
const learningQuizSubmit = (req, res) => getDefaultController().learningQuizSubmit(req, res);

module.exports = {
    learningQuizCreate,
    learningQuizList,
    publishLearningQuiz,
    learningQuizSubmit,
    createLearningQuizController,
};
