const bcrypt = require('bcrypt');
const {
    getSessionConfig,
    createSessionToken,
    setSessionCookie,
} = require("../utils/authSession.js");
const Teacher = require('../models/teacherSchema.js');
const Subject = require('../models/subjectSchema.js');
const GameActivity = require('../models/gameActivitySchema.js');
const {
    createGameActivityLifecycle,
    sameReference,
} = require('../services/learning/gameActivityIntegrity.js');

const gameActivityLifecycle = createGameActivityLifecycle({
    GameActivityModel: GameActivity,
});

const teacherRegister = async (req, res) => {
    const { name, email, password, school, teachSubject, teachSclass } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const teacher = new Teacher({ name, email, password: hashedPass, role: "Teacher", school, teachSubject, teachSclass });

        const existingTeacherByEmail = await Teacher.findOne({ email });

        if (existingTeacherByEmail) {
            res.send({ message: 'Email already exists' });
        }
        else {
            let result = await teacher.save();
            await Subject.findByIdAndUpdate(teachSubject, { teacher: teacher._id });
            result.password = undefined;
            res.send(result);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const teacherLogIn = async (req, res) => {
    try {
        let teacher = await Teacher.findOne({ email: req.body.email });
        if (teacher) {
            const validated = await bcrypt.compare(req.body.password, teacher.password);
            if (validated) {
                const sessionConfig = getSessionConfig();
                teacher = await teacher.populate("teachSubject", "subName sessions")
                teacher = await teacher.populate("school", "schoolName")
                teacher = await teacher.populate("teachSclass", "sclassName")
                const sessionToken = createSessionToken(
                    { userId: String(teacher._id), role: "Teacher" },
                    { config: sessionConfig }
                );
                setSessionCookie(res, sessionToken, sessionConfig);

                teacher.password = undefined;
                res.send(teacher);
            } else {
                res.send({ message: "Invalid password" });
            }
        } else {
            res.send({ message: "Teacher not found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getTeachers = async (req, res) => {
    try {
        let teachers = await Teacher.find({ school: req.params.id })
            .populate("teachSubject", "subName")
            .populate("teachSclass", "sclassName");
        if (teachers.length > 0) {
            let modifiedTeachers = teachers.map((teacher) => {
                return { ...teacher._doc, password: undefined };
            });
            res.send(modifiedTeachers);
        } else {
            res.send({ message: "No teachers found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getTeacherDetail = async (req, res) => {
    try {
        let teacher = await Teacher.findById(req.params.id)
            .populate("teachSubject", "subName sessions")
            .populate("school", "schoolName")
            .populate("teachSclass", "sclassName")
        if (teacher) {
            teacher.password = undefined;
            res.send(teacher);
        }
        else {
            res.send({ message: "No teacher found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const updateTeacherSubject = async (req, res) => {
    const { teacherId, teachSubject } = req.body;
    try {
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        const nextSubject = await Subject.findById(teachSubject);
        if (!nextSubject) {
            return res.status(404).json({ message: "Subject not found" });
        }

        if (
            !sameReference(nextSubject.school, teacher.school) ||
            !sameReference(nextSubject.sclassName, teacher.teachSclass)
        ) {
            return res.status(400).json({
                message: "The assigned subject must belong to the teacher's current school and class",
            });
        }

        if (nextSubject.teacher && !sameReference(nextSubject.teacher, teacher._id)) {
            return res.status(409).json({
                message: "The assigned subject is linked to a different teacher",
            });
        }

        const previousSubjectId = teacher.teachSubject;
        const assignmentChanged = !sameReference(previousSubjectId, nextSubject._id);

        if (assignmentChanged) {
            // Old activities no longer match the Teacher's persisted assignment.
            await gameActivityLifecycle.archiveForTeacherReassignment(teacher._id, {
                schoolId: teacher.school,
                classId: teacher.teachSclass,
                subjectId: nextSubject._id,
            });
        }

        const updatedTeacher = await Teacher.findByIdAndUpdate(
            teacherId,
            { teachSubject: nextSubject._id },
            { new: true, runValidators: true }
        );
        if (!updatedTeacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        if (assignmentChanged && previousSubjectId) {
            await Subject.updateOne(
                { _id: previousSubjectId, teacher: teacher._id },
                { $unset: { teacher: "" } }
            );
        }

        await Subject.updateOne(
            { _id: nextSubject._id },
            { $set: { teacher: updatedTeacher._id } }
        );

        res.send(updatedTeacher);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const teacherToDelete = await Teacher.findById(req.params.id);
        if (!teacherToDelete) {
            return res.send({ message: "Teacher not found" });
        }

        await gameActivityLifecycle.archiveByTeacher(teacherToDelete._id);

        const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!deletedTeacher) {
            return res.send({ message: "Teacher not found" });
        }

        await Subject.updateOne(
            { teacher: deletedTeacher._id },
            { $unset: { teacher: "" } }
        );

        res.send(deletedTeacher);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeachers = async (req, res) => {
    try {
        const teachersToDelete = await Teacher.find({ school: req.params.id }).select("_id");
        if (teachersToDelete.length === 0) {
            return res.send({ message: "No teachers found to delete" });
        }

        const teacherIds = teachersToDelete.map((teacher) => teacher._id);
        await gameActivityLifecycle.archiveByTeachers(teacherIds);

        const deletionResult = await Teacher.deleteMany({ school: req.params.id });
        const deletedCount = deletionResult.deletedCount || 0;

        if (deletedCount === 0) {
            return res.send({ message: "No teachers found to delete" });
        }

        await Subject.updateMany(
            { teacher: { $in: teacherIds } },
            { $unset: { teacher: "" } }
        );

        res.send(deletionResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeachersByClass = async (req, res) => {
    try {
        const teachersToDelete = await Teacher.find({ teachSclass: req.params.id }).select("_id");
        if (teachersToDelete.length === 0) {
            return res.send({ message: "No teachers found to delete" });
        }

        const teacherIds = teachersToDelete.map((teacher) => teacher._id);
        await gameActivityLifecycle.archiveByTeachers(teacherIds);

        const deletionResult = await Teacher.deleteMany({ teachSclass: req.params.id });
        const deletedCount = deletionResult.deletedCount || 0;

        if (deletedCount === 0) {
            return res.send({ message: "No teachers found to delete" });
        }

        await Subject.updateMany(
            { teacher: { $in: teacherIds } },
            { $unset: { teacher: "" } }
        );

        res.send(deletionResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

const teacherAttendance = async (req, res) => {
    const { status, date } = req.body;

    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.send({ message: 'Teacher not found' });
        }

        const existingAttendance = teacher.attendance.find(
            (a) =>
                a.date.toDateString() === new Date(date).toDateString()
        );

        if (existingAttendance) {
            existingAttendance.status = status;
        } else {
            teacher.attendance.push({ date, status });
        }

        const result = await teacher.save();
        return res.send(result);
    } catch (error) {
        res.status(500).json(error)
    }
};

module.exports = {
    teacherRegister,
    teacherLogIn,
    getTeachers,
    getTeacherDetail,
    updateTeacherSubject,
    deleteTeacher,
    deleteTeachers,
    deleteTeachersByClass,
    teacherAttendance
};