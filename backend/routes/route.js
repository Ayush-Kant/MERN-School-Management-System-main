const router = require('express').Router();

// const { adminRegister, adminLogIn, deleteAdmin, getAdminDetail, updateAdmin } = require('../controllers/admin-controller.js');

const { adminRegister, adminLogIn, getAdminDetail} = require('../controllers/admin-controller.js');

const { sclassCreate, sclassList, deleteSclass, deleteSclasses, getSclassDetail, getSclassStudents } = require('../controllers/class-controller.js');
const { complainCreate, complainList } = require('../controllers/complain-controller.js');
const { noticeCreate, noticeList, deleteNotices, deleteNotice, updateNotice } = require('../controllers/notice-controller.js');
const {
    studentRegister,
    studentLogIn,
    getStudents,
    getStudentDetail,
    deleteStudents,
    deleteStudent,
    updateStudent,
    studentAttendance,
    deleteStudentsByClass,
    updateExamResult,
    clearAllStudentsAttendanceBySubject,
    clearAllStudentsAttendance,
    removeStudentAttendanceBySubject,
    removeStudentAttendance } = require('../controllers/student_controller.js');
const { subjectCreate, classSubjects, deleteSubjectsByClass, getSubjectDetail, deleteSubject, freeSubjectList, allSubjects, deleteSubjects } = require('../controllers/subject-controller.js');
const { teacherRegister, teacherLogIn, getTeachers, getTeacherDetail, deleteTeachers, deleteTeachersByClass, deleteTeacher, updateTeacherSubject, teacherAttendance } = require('../controllers/teacher-controller.js');
const { gameActivityCreate, gameActivityList, gameActivityUpdate, publishGameActivity, unpublishGameActivity, archiveGameActivity } = require('../controllers/game-activity-controller.js');
const { learningQuizCreate, learningQuizList, publishLearningQuiz, learningQuizSubmit } = require('../controllers/learning-quiz-controller.js');
const { getAuthSession, authLogout } = require('../controllers/auth-controller.js');
const { authenticateSession } = require('../middleware/authenticateSession.js');
const { authorizeRoles } = require('../middleware/authorizeRoles.js');
const { loadActorContext } = require('../middleware/loadActorContext.js');
const { authorizeSchoolScope } = require('../middleware/authorizeSchoolScope.js');
const { asyncHandler } = require("../utils/asyncHandler.js");

// Authentication -> persisted role -> database-backed actor context.
const requireAdmin = [authenticateSession, authorizeRoles("Admin"), loadActorContext];
const requireAdminOrTeacher = [
    authenticateSession,
    authorizeRoles("Admin", "Teacher"),
    loadActorContext,
];
const requireSchoolMember = [
    authenticateSession,
    authorizeRoles("Admin", "Teacher", "Student"),
    loadActorContext,
];
const requireTeacherOrStudent = [
    authenticateSession,
    authorizeRoles("Teacher", "Student"),
    loadActorContext,
];
const requireTeacher = [authenticateSession, authorizeRoles("Teacher"), loadActorContext];
const requireStudent = [authenticateSession, authorizeRoles("Student"), loadActorContext];

// Reusable tenant/resource ownership guards. Each is applied after the actor is loaded.
const ownAdminId = authorizeSchoolScope({ resource: "self", from: "params.id" });
const schoolParam = authorizeSchoolScope({ resource: "school", from: "params.id" });
const adminIdBody = authorizeSchoolScope({ resource: "school", from: "body.adminID" });
const schoolBody = authorizeSchoolScope({ resource: "school", from: "body.school" });
const classParam = authorizeSchoolScope({ resource: "class", from: "params.id" });
const studentParam = authorizeSchoolScope({ resource: "student", from: "params.id" });
const teacherParam = authorizeSchoolScope({ resource: "teacher", from: "params.id" });
const subjectParam = authorizeSchoolScope({ resource: "subject", from: "params.id" });
const noticeParam = authorizeSchoolScope({ resource: "notice", from: "params.id" });

const studentRegistrationClass = authorizeSchoolScope({
    resource: "class",
    from: "body.sclassName",
});
const subjectCreationClass = authorizeSchoolScope({
    resource: "class",
    from: "body.sclassName",
});
const teacherRegistrationClass = authorizeSchoolScope({
    resource: "class",
    from: "body.teachSclass",
    as: "teacherRegistrationClass",
});
const teacherRegistrationSubject = authorizeSchoolScope({
    resource: "subject",
    from: "body.teachSubject",
    as: "teacherRegistrationSubject",
    belongsTo: {
        field: "sclassName",
        resource: "teacherRegistrationClass",
        resourceField: "_id",
    },
});
const teacherAssignmentTeacher = authorizeSchoolScope({
    resource: "teacher",
    from: "body.teacherId",
    as: "teacherAssignmentTeacher",
});
const teacherAssignmentSubject = authorizeSchoolScope({
    resource: "subject",
    from: "body.teachSubject",
    as: "teacherAssignmentSubject",
    belongsTo: {
        field: "sclassName",
        resource: "teacherAssignmentTeacher",
        resourceField: "teachSclass",
    },
});
const studentUpdateClass = authorizeSchoolScope({
    resource: "class",
    from: "body.sclassName",
    optional: true,
});
const targetStudent = authorizeSchoolScope({
    resource: "student",
    from: "params.id",
    as: "targetStudent",
});
const targetStudentSubject = authorizeSchoolScope({
    resource: "subject",
    from: "body.subName",
    as: "targetStudentSubject",
    belongsTo: {
        field: "sclassName",
        resource: "targetStudent",
        resourceField: "sclassName",
    },
});
const targetStudentSubId = authorizeSchoolScope({
    resource: "subject",
    from: "body.subId",
    as: "targetStudentSubId",
    belongsTo: {
        field: "sclassName",
        resource: "targetStudent",
        resourceField: "sclassName",
    },
});
const optionalStudentSchool = authorizeSchoolScope({
    resource: "school",
    from: "body.school",
    optional: true,
});

// Admin account bootstrap and login remain public by design.
router.post('/AdminReg', adminRegister);
router.post('/AdminLogin', adminLogIn);
router.get("/Admin/:id", ...requireAdmin, ownAdminId, getAdminDetail);
// router.delete("/Admin/:id", deleteAdmin)

// router.put("/Admin/:id", updateAdmin)

// Student

router.post('/StudentReg', ...requireAdmin, adminIdBody, studentRegistrationClass, studentRegister);
router.post('/StudentLogin', studentLogIn);

router.get("/Students/:id", ...requireAdmin, schoolParam, getStudents);
router.get("/Student/:id", ...requireSchoolMember, studentParam, getStudentDetail);

router.delete("/Students/:id", ...requireAdmin, schoolParam, deleteStudents);
router.delete("/StudentsClass/:id", ...requireAdmin, classParam, deleteStudentsByClass);
router.delete("/Student/:id", ...requireAdmin, studentParam, deleteStudent);

router.put("/Student/:id", ...requireAdmin, studentParam, studentUpdateClass, updateStudent);

router.put('/UpdateExamResult/:id', ...requireAdminOrTeacher, targetStudent, targetStudentSubject, updateExamResult);

router.put('/StudentAttendance/:id', ...requireAdminOrTeacher, targetStudent, targetStudentSubject, studentAttendance);

router.put('/RemoveAllStudentsSubAtten/:id', ...requireAdminOrTeacher, subjectParam, clearAllStudentsAttendanceBySubject);
router.put('/RemoveAllStudentsAtten/:id', ...requireAdmin, schoolParam, clearAllStudentsAttendance);

router.put('/RemoveStudentSubAtten/:id', ...requireAdminOrTeacher, targetStudent, targetStudentSubId, removeStudentAttendanceBySubject);
router.put('/RemoveStudentAtten/:id', ...requireAdminOrTeacher, studentParam, removeStudentAttendance);

// Teacher

router.post('/TeacherReg', ...requireAdmin, schoolBody, teacherRegistrationClass, teacherRegistrationSubject, teacherRegister);
router.post('/TeacherLogin', teacherLogIn);

router.get("/Teachers/:id", ...requireAdmin, schoolParam, getTeachers);
router.get("/Teacher/:id", ...requireAdminOrTeacher, teacherParam, getTeacherDetail);

router.delete("/Teachers/:id", ...requireAdmin, schoolParam, deleteTeachers);
router.delete("/TeachersClass/:id", ...requireAdmin, classParam, deleteTeachersByClass);
router.delete("/Teacher/:id", ...requireAdmin, teacherParam, deleteTeacher);

router.put("/TeacherSubject", ...requireAdmin, teacherAssignmentTeacher, teacherAssignmentSubject, updateTeacherSubject);

router.post('/TeacherAttendance/:id', ...requireAdmin, teacherParam, teacherAttendance);

// Notice

router.post('/NoticeCreate', ...requireAdmin, adminIdBody, noticeCreate);

router.get('/NoticeList/:id', ...requireSchoolMember, schoolParam, noticeList);

router.delete("/Notices/:id", ...requireAdmin, schoolParam, deleteNotices);
router.delete("/Notice/:id", ...requireAdmin, noticeParam, deleteNotice);

router.put("/Notice/:id", ...requireAdmin, noticeParam, updateNotice);

// Complain

router.post('/ComplainCreate', ...requireStudent, optionalStudentSchool, authorizeSchoolScope({
    resource: "self",
    from: "body.user",
}), complainCreate);

router.get('/ComplainList/:id', ...requireAdmin, schoolParam, complainList);

// Sclass

router.post('/SclassCreate', ...requireAdmin, adminIdBody, sclassCreate);

router.get('/SclassList/:id', ...requireAdmin, schoolParam, sclassList);
router.get("/Sclass/:id", ...requireSchoolMember, classParam, getSclassDetail);

router.get("/Sclass/Students/:id", ...requireAdminOrTeacher, classParam, getSclassStudents);

router.delete("/Sclasses/:id", ...requireAdmin, schoolParam, deleteSclasses);
router.delete("/Sclass/:id", ...requireAdmin, classParam, deleteSclass);

// Subject

router.post('/SubjectCreate', ...requireAdmin, adminIdBody, subjectCreationClass, subjectCreate);

router.get('/AllSubjects/:id', ...requireAdmin, schoolParam, allSubjects);
router.get('/ClassSubjects/:id', ...requireSchoolMember, classParam, classSubjects);
router.get('/FreeSubjectList/:id', ...requireAdmin, classParam, freeSubjectList);
router.get("/Subject/:id", ...requireSchoolMember, subjectParam, getSubjectDetail);

router.delete("/Subject/:id", ...requireAdmin, subjectParam, deleteSubject);
router.delete("/Subjects/:id", ...requireAdmin, schoolParam, deleteSubjects);
router.delete("/SubjectsClass/:id", ...requireAdmin, classParam, deleteSubjectsByClass);

// Game Zone
router.post('/GameActivityCreate', ...requireTeacher, asyncHandler(gameActivityCreate));
router.get('/GameActivityList/:id', ...requireTeacherOrStudent, asyncHandler(gameActivityList));
router.put('/GameActivityUpdate/:id', ...requireTeacher, asyncHandler(gameActivityUpdate));
router.put('/GameActivityPublish/:id', ...requireTeacher, asyncHandler(publishGameActivity));
router.put('/GameActivityUnpublish/:id', ...requireTeacher, asyncHandler(unpublishGameActivity));
router.put('/GameActivityArchive/:id', ...requireTeacher, asyncHandler(archiveGameActivity));

// Authentication session
router.get('/AuthSession', authenticateSession, getAuthSession);
router.post('/AuthLogout', authLogout);

// AI Learning Studio: first-party, server-graded quizzes
router.post('/LearningQuizCreate', ...requireTeacher, asyncHandler(learningQuizCreate));
router.get('/LearningQuizList/:id', ...requireTeacherOrStudent, asyncHandler(learningQuizList));
router.put('/LearningQuizPublish/:id', ...requireTeacher, asyncHandler(publishLearningQuiz));
router.post('/LearningQuizSubmit/:id', ...requireStudent, asyncHandler(learningQuizSubmit));

module.exports = router;
