const Subject = require('../models/subjectSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Student = require('../models/studentSchema.js');
const GameActivity = require('../models/gameActivitySchema.js');
const { createGameActivityLifecycle } = require('../services/learning/gameActivityIntegrity.js');

const gameActivityLifecycle = createGameActivityLifecycle({
    GameActivityModel: GameActivity,
});

const subjectCreate = async (req, res) => {
    try {
        const subjects = req.body.subjects.map((subject) => ({
            subName: subject.subName,
            subCode: subject.subCode,
            sessions: subject.sessions,
        }));

        const existingSubjectBySubCode = await Subject.findOne({
            'subjects.subCode': subjects[0].subCode,
            school: req.body.adminID,
        });

        if (existingSubjectBySubCode) {
            res.send({ message: 'Sorry this subcode must be unique as it already exists' });
        } else {
            const newSubjects = subjects.map((subject) => ({
                ...subject,
                sclassName: req.body.sclassName,
                school: req.body.adminID,
            }));

            const result = await Subject.insertMany(newSubjects);
            res.send(result);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const allSubjects = async (req, res) => {
    try {
        let subjects = await Subject.find({ school: req.params.id })
            .populate("sclassName", "sclassName")
        if (subjects.length > 0) {
            res.send(subjects)
        } else {
            res.send({ message: "No subjects found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const classSubjects = async (req, res) => {
    try {
        let subjects = await Subject.find({ sclassName: req.params.id })
        if (subjects.length > 0) {
            res.send(subjects)
        } else {
            res.send({ message: "No subjects found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const freeSubjectList = async (req, res) => {
    try {
        let subjects = await Subject.find({ sclassName: req.params.id, teacher: { $exists: false } });
        if (subjects.length > 0) {
            res.send(subjects);
        } else {
            res.send({ message: "No subjects found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getSubjectDetail = async (req, res) => {
    try {
        let subject = await Subject.findById(req.params.id);
        if (subject) {
            subject = await subject.populate("sclassName", "sclassName")
            subject = await subject.populate("teacher", "name")
            res.send(subject);
        }
        else {
            res.send({ message: "No subject found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const deleteSubject = async (req, res) => {
    try {
        const existingSubject = await Subject.findById(req.params.id);
        if (!existingSubject) {
            return res.send({ message: "Subject not found" });
        }

        // Preserve the learning record while its source subject is removed.
        await gameActivityLifecycle.archiveBySubject(existingSubject._id);

        const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
        if (!deletedSubject) {
            return res.send({ message: "Subject not found" });
        }

        // Clear the deleted subject assignment from its teacher.
        await Teacher.updateMany(
            { teachSubject: deletedSubject._id },
            { $unset: { teachSubject: "" } }
        );

        // Remove the objects containing the deleted subject from students' examResult array
        await Student.updateMany(
            {},
            { $pull: { examResult: { subName: deletedSubject._id } } }
        );

        // Remove the objects containing the deleted subject from students' attendance array
        await Student.updateMany(
            {},
            { $pull: { attendance: { subName: deletedSubject._id } } }
        );

        res.send(deletedSubject);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteSubjects = async (req, res) => {
    try {
        // All subjects in this school are being removed, so none of its games remain eligible.
        await gameActivityLifecycle.archiveBySchool(req.params.id);

        const subjectsToDelete = await Subject.find({ school: req.params.id }).select("_id");
        const deletedSubjects = await Subject.deleteMany({ school: req.params.id });
        const deletedSubjectIds = subjectsToDelete.map((subject) => subject._id);

        if (deletedSubjectIds.length > 0) {
            await Teacher.updateMany(
                { teachSubject: { $in: deletedSubjectIds } },
                { $unset: { teachSubject: "" } }
            );
        }

        // Set examResult and attendance to null in all students
        await Student.updateMany(
            {},
            { $set: { examResult: null, attendance: null } }
        );

        res.send(deletedSubjects);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteSubjectsByClass = async (req, res) => {
    try {
        // The class is being cleared of subjects; archive games before their subject references disappear.
        await gameActivityLifecycle.archiveByClass(req.params.id);

        const subjectsToDelete = await Subject.find({ sclassName: req.params.id }).select("_id");
        const deletedSubjects = await Subject.deleteMany({ sclassName: req.params.id });
        const deletedSubjectIds = subjectsToDelete.map((subject) => subject._id);

        if (deletedSubjectIds.length > 0) {
            await Teacher.updateMany(
                { teachSubject: { $in: deletedSubjectIds } },
                { $unset: { teachSubject: "" } }
            );
        }

        // Set examResult and attendance to null in all students
        await Student.updateMany(
            {},
            { $set: { examResult: null, attendance: null } }
        );

        res.send(deletedSubjects);
    } catch (error) {
        res.status(500).json(error);
    }
};


module.exports = { subjectCreate, freeSubjectList, classSubjects, getSubjectDetail, deleteSubjectsByClass, deleteSubjects, deleteSubject, allSubjects };