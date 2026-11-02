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
const { gameActivityCreate, gameActivityList, publishGameActivity, archiveGameActivity } = require('../controllers/game-activity-controller.js');
const { learningQuizCreate, learningQuizList, publishLearningQuiz, learningQuizSubmit } = require('../controllers/learning-quiz-controller.js');
const { getAuthSession, authLogout } = require('../controllers/auth-controller.js');
const { authenticateSession } = require('../middleware/authenticateSession.js');
const { authorizeRoles } = require('../middleware/authorizeRoles.js');

// Reusable route guards. Keep authentication before role checks.
const requireAdmin = [authenticateSession, authorizeRoles("Admin")];
const requireAdminOrTeacher = [authenticateSession, authorizeRoles("Admin", "Teacher")];
const requireSchoolMember = [authenticateSession, authorizeRoles("Admin", "Teacher", "Student")];
const requireTeacherOrStudent = [authenticateSession, authorizeRoles("Teacher", "Student")];
const requireTeacher = [authenticateSession, authorizeRoles("Teacher")];
const requireStudent = [authenticateSession, authorizeRoles("Student")];

// Admin account bootstrap and login remain public by design.
router.post('/AdminReg', adminRegister);
router.post('/AdminLogin', adminLogIn);
router.get("/Admin/:id", ...requireAdmin, getAdminDetail);
// router.delete("/Admin/:id", deleteAdmin)

// router.put("/Admin/:id", updateAdmin)

// Student

router.post('/StudentReg', ...requireAdmin, studentRegister);
router.post('/StudentLogin', studentLogIn);

router.get("/Students/:id", ...requireAdminOrTeacher, getStudents);
router.get("/Student/:id", ...requireSchoolMember, getStudentDetail);

router.delete("/Students/:id", ...requireAdmin, deleteStudents);
router.delete("/StudentsClass/:id", ...requireAdmin, deleteStudentsByClass);
router.delete("/Student/:id", ...requireAdmin, deleteStudent);

router.put("/Student/:id", ...requireAdmin, updateStudent);

router.put('/UpdateExamResult/:id', ...requireAdminOrTeacher, updateExamResult);

router.put('/StudentAttendance/:id', ...requireAdminOrTeacher, studentAttendance);

router.put('/RemoveAllStudentsSubAtten/:id', ...requireAdminOrTeacher, clearAllStudentsAttendanceBySubject);
router.put('/RemoveAllStudentsAtten/:id', ...requireAdmin, clearAllStudentsAttendance);

router.put('/RemoveStudentSubAtten/:id', ...requireAdminOrTeacher, removeStudentAttendanceBySubject);
router.put('/RemoveStudentAtten/:id', ...requireAdminOrTeacher, removeStudentAttendance);

// Teacher

router.post('/TeacherReg', ...requireAdmin, teacherRegister);
router.post('/TeacherLogin', teacherLogIn);

router.get("/Teachers/:id", ...requireAdmin, getTeachers);
router.get("/Teacher/:id", ...requireAdminOrTeacher, getTeacherDetail);

router.delete("/Teachers/:id", ...requireAdmin, deleteTeachers);
router.delete("/TeachersClass/:id", ...requireAdmin, deleteTeachersByClass);
router.delete("/Teacher/:id", ...requireAdmin, deleteTeacher);

router.put("/TeacherSubject", ...requireAdmin, updateTeacherSubject);

router.post('/TeacherAttendance/:id', ...requireAdmin, teacherAttendance);

// Notice

router.post('/NoticeCreate', ...requireAdmin, noticeCreate);

router.get('/NoticeList/:id', ...requireSchoolMember, noticeList);

router.delete("/Notices/:id", ...requireAdmin, deleteNotices);
router.delete("/Notice/:id", ...requireAdmin, deleteNotice);

router.put("/Notice/:id", ...requireAdmin, updateNotice);

// Complain

router.post('/ComplainCreate', ...requireStudent, complainCreate);

router.get('/ComplainList/:id', ...requireAdmin, complainList);

// Sclass

router.post('/SclassCreate', ...requireAdmin, sclassCreate);

router.get('/SclassList/:id', ...requireAdmin, sclassList);
router.get("/Sclass/:id", ...requireSchoolMember, getSclassDetail);

router.get("/Sclass/Students/:id", ...requireAdminOrTeacher, getSclassStudents);

router.delete("/Sclasses/:id", ...requireAdmin, deleteSclasses);
router.delete("/Sclass/:id", ...requireAdmin, deleteSclass);

// Subject

router.post('/SubjectCreate', ...requireAdmin, subjectCreate);

router.get('/AllSubjects/:id', ...requireAdmin, allSubjects);
router.get('/ClassSubjects/:id', ...requireSchoolMember, classSubjects);
router.get('/FreeSubjectList/:id', ...requireAdmin, freeSubjectList);
router.get("/Subject/:id", ...requireSchoolMember, getSubjectDetail);

router.delete("/Subject/:id", ...requireAdmin, deleteSubject);
router.delete("/Subjects/:id", ...requireAdmin, deleteSubjects);
router.delete("/SubjectsClass/:id", ...requireAdmin, deleteSubjectsByClass);

// Game Zone
router.post('/GameActivityCreate', ...requireTeacher, gameActivityCreate);
router.get('/GameActivityList/:id', ...requireTeacherOrStudent, gameActivityList);
router.put('/GameActivityPublish/:id', ...requireTeacher, publishGameActivity);
router.put('/GameActivityArchive/:id', ...requireTeacher, archiveGameActivity);

// Authentication session
router.get('/AuthSession', authenticateSession, getAuthSession);
router.post('/AuthLogout', authLogout);

// AI Learning Studio: first-party, server-graded quizzes
router.post('/LearningQuizCreate', ...requireTeacher, learningQuizCreate);
router.get('/LearningQuizList/:id', ...requireTeacherOrStudent, learningQuizList);
router.put('/LearningQuizPublish/:id', ...requireTeacher, publishLearningQuiz);
router.post('/LearningQuizSubmit/:id', ...requireStudent, learningQuizSubmit);

module.exports = router;
