const Notice = require('../models/noticeSchema.js');

const noticeCreate = async (req, res) => {
    try {
        const notice = new Notice({
            ...req.body,
            school: req.body.adminID
        })
        const result = await notice.save()
        res.send(result)
    } catch (err) {
        res.status(500).json(err);
    }
};

const noticeList = async (req, res) => {
    try {
        let notices = await Notice.find({ school: req.params.id })
        if (notices.length > 0) {
            res.send(notices)
        } else {
            res.send({ message: "No notices found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

function createUpdateNoticeHandler({ NoticeModel = Notice } = {}) {
    return async function updateNotice(req, res) {
        const body = req.body;

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return res.status(400).json({ message: "A valid update object is required" });
        }

        const allowedFields = new Set(["title", "details", "date"]);
        const unsupportedFields = Object.keys(body).filter((field) => !allowedFields.has(field));

        if (unsupportedFields.length > 0) {
            return res.status(400).json({
                message: `Unsupported notice update field(s): ${unsupportedFields.join(", ")}`,
            });
        }

        const updates = {};
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(body, field)) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "At least one notice field is required" });
        }

        try {
            const result = await NoticeModel.findByIdAndUpdate(
                req.params.id,
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!result) {
                return res.status(404).json({ message: "Notice not found" });
            }

            return res.send(result);
        } catch (error) {
            if (error && (error.name === "ValidationError" || error.name === "CastError")) {
                return res.status(400).json({ message: "Invalid notice update data" });
            }
            return res.status(500).json({ message: "Unable to update notice" });
        }
    };
}

const updateNotice = createUpdateNoticeHandler();

const deleteNotice = async (req, res) => {
    try {
        const result = await Notice.findByIdAndDelete(req.params.id)
        res.send(result)
    } catch (error) {
        res.status(500).json(err);
    }
}

const deleteNotices = async (req, res) => {
    try {
        const result = await Notice.deleteMany({ school: req.params.id })
        if (result.deletedCount === 0) {
            res.send({ message: "No notices found to delete" })
        } else {
            res.send(result)
        }
    } catch (error) {
        res.status(500).json(err);
    }
}

module.exports = {
    noticeCreate,
    noticeList,
    updateNotice,
    deleteNotice,
    deleteNotices,
    createUpdateNoticeHandler,
};