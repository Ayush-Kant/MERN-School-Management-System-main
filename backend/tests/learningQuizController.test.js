const test = require("node:test");
const assert = require("node:assert/strict");
const { createLearningQuizController } = require("../controllers/learning-quiz-controller");

const SCHOOL_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const TEACHER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const CLASS_ID = "cccccccccccccccccccccccc";
const SUBJECT_ID = "dddddddddddddddddddddddd";
const STUDENT_ID = "eeeeeeeeeeeeeeeeeeeeeeee";
const QUIZ_ID = "111111111111111111111111";
const ATTEMPT_ID = "222222222222222222222222";
const QUESTION_1 = "qstn11111111111111111111";
const QUESTION_2 = "qstn22222222222222222222";

const teacher = {
    _id: TEACHER_ID,
    school: SCHOOL_ID,
    teachSclass: CLASS_ID,
    teachSubject: SUBJECT_ID,
};
const schoolClass = { _id: CLASS_ID, school: SCHOOL_ID };
const subject = {
    _id: SUBJECT_ID,
    school: SCHOOL_ID,
    sclassName: CLASS_ID,
    teacher: TEACHER_ID,
};
const student = {
    _id: STUDENT_ID,
    school: SCHOOL_ID,
    sclassName: CLASS_ID,
};
const validQuestions = [
    {
        prompt: "Which number is even?",
        concept: "Number properties",
        options: [
            { optionId: "a", text: "8" },
            { optionId: "b", text: "9" },
            { optionId: "c", text: "11" },
        ],
        correctOptionId: "a",
        explanation: "Eight is divisible by two.",
    },
    {
        prompt: "What is 3 multiplied by 4?",
        concept: "Multiplication",
        options: [
            { optionId: "a", text: "7" },
            { optionId: "b", text: "12" },
        ],
        correctOptionId: "b",
        explanation: "Three groups of four make twelve.",
    },
];
const publishedQuiz = {
    _id: QUIZ_ID,
    title: "Number Skills",
    description: "Short formative check",
    topic: "Numbers",
    school: SCHOOL_ID,
    class: CLASS_ID,
    subject: SUBJECT_ID,
    createdByTeacher: TEACHER_ID,
    questions: [
        { _id: QUESTION_1, ...validQuestions[0] },
        { _id: QUESTION_2, ...validQuestions[1] },
    ],
    version: 1,
    status: "published",
};

function makeResponse() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

function makeHarness(overrides = {}) {
    const calls = {
        quizCreateData: null,
        quizListFilter: null,
        quizFindOneAndUpdateFilter: null,
        quizFindOneAndUpdateData: null,
        quizFindOneFilter: null,
        attemptFindOneFilter: null,
        attemptCountFilter: null,
        attemptCreateData: null,
        populatePaths: [],
    };

    class FakeLearningQuiz {
        constructor(data) {
            calls.quizCreateData = data;
        }

        async save() {
            if (overrides.quizSaveError) throw overrides.quizSaveError;
            return { _id: QUIZ_ID, ...calls.quizCreateData };
        }

        static async findById(id) {
            calls.quizLookedUp = id;
            return Object.hasOwn(overrides, "quiz") ? overrides.quiz : publishedQuiz;
        }

        static find(filter) {
            calls.quizListFilter = filter;
            return {
                populate(path) {
                    calls.populatePaths.push(path);
                    return this;
                },
                sort(specification) {
                    calls.sort = specification;
                    return this;
                },
                async exec() {
                    if (overrides.quizListError) throw overrides.quizListError;
                    return overrides.quizRecords || [];
                },
            };
        }

        static async findOneAndUpdate(filter, update, options) {
            calls.quizFindOneAndUpdateFilter = filter;
            calls.quizFindOneAndUpdateData = { update, options };
            if (overrides.publishError) throw overrides.publishError;
            return overrides.publishedQuizResult || null;
        }

        static async findOne(filter) {
            calls.quizFindOneFilter = filter;
            return Object.hasOwn(overrides, "ownedQuiz") ? overrides.ownedQuiz : null;
        }
    }

    class FakeLearningAttempt {
        constructor(data) {
            calls.attemptCreateData = data;
        }

        async save() {
            if (overrides.attemptSaveError) throw overrides.attemptSaveError;
            return { _id: ATTEMPT_ID, ...calls.attemptCreateData };
        }

        static async findOne(filter) {
            calls.attemptFindOneFilter = filter;
            return Object.hasOwn(overrides, "existingAttempt") ? overrides.existingAttempt : null;
        }

        static async countDocuments(filter) {
            calls.attemptCountFilter = filter;
            return overrides.priorAttemptCount || 0;
        }
    }

    const controller = createLearningQuizController({
        LearningQuizModel: FakeLearningQuiz,
        LearningAttemptModel: FakeLearningAttempt,
        TeacherModel: {
            async findById() {
                return Object.hasOwn(overrides, "teacher") ? overrides.teacher : teacher;
            },
        },
        StudentModel: {
            async findById() {
                return Object.hasOwn(overrides, "student") ? overrides.student : student;
            },
        },
        SclassModel: {
            async findById() {
                return Object.hasOwn(overrides, "schoolClass") ? overrides.schoolClass : schoolClass;
            },
        },
        SubjectModel: {
            async findById() {
                return Object.hasOwn(overrides, "subject") ? overrides.subject : subject;
            },
        },
    });

    return { controller, calls };
}

function createRequest(overrides = {}) {
    return {
        body: {
            teacherId: TEACHER_ID,
            title: "Number Skills",
            description: "A short quiz",
            topic: "Numbers",
            questions: validQuestions,
            ...overrides,
        },
    };
}

test("creates quizzes as drafts and derives school, class, and subject from teacher assignment", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.learningQuizCreate(createRequest({ status: "published" }), res);

    assert.equal(res.statusCode, 201);
    assert.equal(calls.quizCreateData.status, "draft");
    assert.equal(calls.quizCreateData.version, 1);
    assert.equal(calls.quizCreateData.school, SCHOOL_ID);
    assert.equal(calls.quizCreateData.class, CLASS_ID);
    assert.equal(calls.quizCreateData.subject, SUBJECT_ID);
    assert.equal(calls.quizCreateData.createdByTeacher, TEACHER_ID);
    assert.equal(calls.quizCreateData.questions.length, 2);
});

test("rejects malformed teacher ids and invalid question counts before database access", async () => {
    const invalidCases = [
        { teacherId: "not-an-id" },
        { questions: [] },
        { questions: Array.from({ length: 31 }, () => validQuestions[0]) },
    ];

    for (const body of invalidCases) {
        const { controller, calls } = makeHarness();
        const res = makeResponse();
        await controller.learningQuizCreate(createRequest(body), res);
        assert.equal(res.statusCode, 400);
        assert.equal(calls.quizCreateData, null);
    }
});

test("rejects invalid options and an answer key not included in the question options", async () => {
    const invalidQuestions = [
        [{ ...validQuestions[0], options: [{ optionId: "a", text: "Only one" }] }],
        [{ ...validQuestions[0], correctOptionId: "missing" }],
        [{ ...validQuestions[0], options: [
            { optionId: "same", text: "Choice 1" },
            { optionId: "same", text: "Choice 2" },
        ], correctOptionId: "same" }],
    ];

    for (const questions of invalidQuestions) {
        const { controller, calls } = makeHarness();
        const res = makeResponse();
        await controller.learningQuizCreate(createRequest({ questions }), res);
        assert.equal(res.statusCode, 400);
        assert.equal(calls.quizCreateData, null);
    }
});

test("rejects a teacher whose subject and class do not share the same school", async () => {
    const { controller, calls } = makeHarness({
        subject: { ...subject, school: "ffffffffffffffffffffffff" },
    });
    const res = makeResponse();

    await controller.learningQuizCreate(createRequest(), res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /same school and class/);
    assert.equal(calls.quizCreateData, null);
});

test("student quiz listings contain no answer keys or teacher explanations", async () => {
    const { controller, calls } = makeHarness({ quizRecords: [publishedQuiz] });
    const res = makeResponse();

    await controller.learningQuizList({
        params: { id: SCHOOL_ID },
        query: { classId: CLASS_ID, subjectId: SUBJECT_ID },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls.quizListFilter, {
        school: SCHOOL_ID,
        class: CLASS_ID,
        subject: SUBJECT_ID,
        status: "published",
    });
    assert.equal(res.body[0].questions[0].prompt, validQuestions[0].prompt);
    assert.equal(res.body[0].questions[0].options.length, 3);
    assert.equal("correctOptionId" in res.body[0].questions[0], false);
    assert.equal("explanation" in res.body[0].questions[0], false);
});

test("requires class scope and does not allow students to list draft quizzes", async () => {
    const cases = [
        { params: { id: SCHOOL_ID }, query: {}, expected: 400 },
        { params: { id: SCHOOL_ID }, query: { classId: CLASS_ID, status: "draft" }, expected: 403 },
    ];

    for (const request of cases) {
        const { controller } = makeHarness();
        const res = makeResponse();
        await controller.learningQuizList(request, res);
        assert.equal(res.statusCode, request.expected);
    }
});

test("teacher listing is scoped to the requesting teacher and can include drafts", async () => {
    const { controller, calls } = makeHarness({ quizRecords: [{ ...publishedQuiz, status: "draft" }] });
    const res = makeResponse();

    await controller.learningQuizList({
        params: { id: SCHOOL_ID },
        query: { teacherId: TEACHER_ID, status: "draft" },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls.quizListFilter, {
        school: SCHOOL_ID,
        createdByTeacher: TEACHER_ID,
        status: "draft",
    });
    assert.equal("correctOptionId" in res.body[0].questions[0], true);
});

test("publishes only the teacher's draft quiz", async () => {
    const { controller, calls } = makeHarness({
        publishedQuizResult: { _id: QUIZ_ID, status: "published" },
    });
    const res = makeResponse();

    await controller.publishLearningQuiz({
        params: { id: QUIZ_ID },
        body: { teacherId: TEACHER_ID },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls.quizFindOneAndUpdateFilter, {
        _id: QUIZ_ID,
        createdByTeacher: TEACHER_ID,
        status: "draft",
    });
    assert.equal(calls.quizFindOneAndUpdateData.update.$set.status, "published");
    assert.ok(calls.quizFindOneAndUpdateData.update.$set.publishedAt instanceof Date);
});

test("grades every question on the server and stores concept-level response events", async () => {
    const { controller, calls } = makeHarness();
    const res = makeResponse();

    await controller.learningQuizSubmit({
        params: { id: QUIZ_ID },
        body: {
            studentId: STUDENT_ID,
            idempotencyKey: "attempt-key-0001",
            durationMs: 45000,
            answers: [
                { questionId: QUESTION_1, selectedOptionId: "a" },
                { questionId: QUESTION_2, selectedOptionId: "a" },
            ],
        },
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.attempt.score, 1);
    assert.equal(res.body.attempt.totalQuestions, 2);
    assert.equal(res.body.attempt.accuracyPercent, 50);
    assert.equal(res.body.attempt.attemptNumber, 1);
    assert.equal(res.body.attempt.quizVersion, 1);
    assert.equal(res.body.attempt.durationMs, 45000);
    assert.equal(res.body.attempt.responses[0].isCorrect, true);
    assert.equal(res.body.attempt.responses[1].isCorrect, false);
    assert.equal(res.body.feedback[0].correctOptionId, "a");
    assert.equal(res.body.feedback[1].correctOptionId, "b");
    assert.deepEqual(calls.attemptCountFilter, { student: STUDENT_ID, quiz: QUIZ_ID });
    assert.equal(calls.attemptCreateData.school, SCHOOL_ID);
    assert.equal(calls.attemptCreateData.class, CLASS_ID);
    assert.equal(calls.attemptCreateData.responses.length, 2);
});

test("records unanswered questions as incorrect instead of trusting client scores", async () => {
    const { controller } = makeHarness();
    const res = makeResponse();

    await controller.learningQuizSubmit({
        params: { id: QUIZ_ID },
        body: {
            studentId: STUDENT_ID,
            idempotencyKey: "attempt-key-0002",
            answers: [{ questionId: QUESTION_1, selectedOptionId: "a" }],
        },
    }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.attempt.score, 1);
    assert.equal(res.body.attempt.responses[1].selectedOptionId, null);
    assert.equal(res.body.attempt.responses[1].isCorrect, false);
});

test("does not record attempts for an unpublished quiz or a student outside its class", async () => {
    const cases = [
        { quiz: { ...publishedQuiz, status: "draft" }, student, expected: 404 },
        { quiz: publishedQuiz, student: { ...student, sclassName: "ffffffffffffffffffffffff" }, expected: 404 },
    ];

    for (const item of cases) {
        const { controller, calls } = makeHarness(item);
        const res = makeResponse();
        await controller.learningQuizSubmit({
            params: { id: QUIZ_ID },
            body: { studentId: STUDENT_ID, idempotencyKey: "attempt-key-0003", answers: [] },
        }, res);

        assert.equal(res.statusCode, item.expected);
        assert.equal(calls.attemptCreateData, null);
    }
});

test("rejects malformed and duplicate answer events or out-of-question options", async () => {
    const cases = [
        { idempotencyKey: "short", answers: [] },
        { idempotencyKey: "attempt-key-0004", answers: [
            { questionId: QUESTION_1, selectedOptionId: "a" },
            { questionId: QUESTION_1, selectedOptionId: "b" },
        ] },
        { idempotencyKey: "attempt-key-0005", answers: [
            { questionId: QUESTION_1, selectedOptionId: "not-an-option" },
        ] },
        { idempotencyKey: "attempt-key-0006", durationMs: -1, answers: [] },
    ];

    for (const body of cases) {
        const { controller, calls } = makeHarness();
        const res = makeResponse();
        await controller.learningQuizSubmit({
            params: { id: QUIZ_ID },
            body: { studentId: STUDENT_ID, ...body },
        }, res);

        assert.equal(res.statusCode, 400);
        assert.equal(calls.attemptCreateData, null);
    }
});

test("retries with the same idempotency key return the original attempt without saving again", async () => {
    const previous = { _id: ATTEMPT_ID, score: 2, accuracyPercent: 100 };
    const { controller, calls } = makeHarness({ existingAttempt: previous });
    const res = makeResponse();

    await controller.learningQuizSubmit({
        params: { id: QUIZ_ID },
        body: {
            studentId: STUDENT_ID,
            idempotencyKey: "attempt-key-retry",
            answers: [],
        },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.replayed, true);
    assert.deepEqual(res.body.attempt, previous);
    assert.equal(calls.attemptCreateData, null);
    assert.equal(calls.attemptCountFilter, null);
});

test("rejects answer attempts for unknown quiz or student", async () => {
    const cases = [
        { quiz: null, student, expected: 404 },
        { quiz: publishedQuiz, student: null, expected: 404 },
    ];

    for (const item of cases) {
        const { controller, calls } = makeHarness(item);
        const res = makeResponse();
        await controller.learningQuizSubmit({
            params: { id: QUIZ_ID },
            body: { studentId: STUDENT_ID, idempotencyKey: "attempt-key-0007", answers: [] },
        }, res);
        assert.equal(res.statusCode, item.expected);
        assert.equal(calls.attemptCreateData, null);
    }
});
