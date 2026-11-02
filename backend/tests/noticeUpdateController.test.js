const test = require("node:test");
const assert = require("node:assert/strict");
const { createUpdateNoticeHandler } = require("../controllers/notice-controller.js");

const NOTICE_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

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
        send(body) {
            this.body = body;
            return this;
        },
    };
}

function makeNoticeModel(result = { _id: NOTICE_ID }) {
    const calls = [];
    return {
        calls,
        async findByIdAndUpdate(...args) {
            calls.push(args);
            return result ? { ...result } : null;
        },
    };
}

async function invoke(handler, body, NoticeModel) {
    const req = { params: { id: NOTICE_ID }, body };
    const res = makeResponse();
    await handler(req, res);
    return { req, res };
}

test("updates only notice content fields and enables schema validators", async () => {
    const NoticeModel = makeNoticeModel({ _id: NOTICE_ID, title: "Updated" });
    const handler = createUpdateNoticeHandler({ NoticeModel });
    const { res } = await invoke(handler, {
        title: "Updated",
        details: "Updated details",
        date: "2026-11-02",
    }, NoticeModel);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(NoticeModel.calls[0], [
        NOTICE_ID,
        {
            $set: {
                title: "Updated",
                details: "Updated details",
                date: "2026-11-02",
            },
        },
        { new: true, runValidators: true },
    ]);
});

test("rejects school ownership changes and other unknown fields", async () => {
    const NoticeModel = makeNoticeModel();
    const handler = createUpdateNoticeHandler({ NoticeModel });
    const { res } = await invoke(handler, {
        title: "Attempted move",
        school: "bbbbbbbbbbbbbbbbbbbbbbbb",
    }, NoticeModel);

    assert.equal(res.statusCode, 400);
    assert.equal(NoticeModel.calls.length, 0);
});

test("rejects malformed and empty update payloads", async () => {
    const NoticeModel = makeNoticeModel();
    const handler = createUpdateNoticeHandler({ NoticeModel });

    const malformed = await invoke(handler, null, NoticeModel);
    const empty = await invoke(handler, {}, NoticeModel);

    assert.equal(malformed.res.statusCode, 400);
    assert.equal(empty.res.statusCode, 400);
    assert.equal(NoticeModel.calls.length, 0);
});

test("returns not found when the target notice does not exist", async () => {
    const NoticeModel = makeNoticeModel(null);
    const handler = createUpdateNoticeHandler({ NoticeModel });
    const { res } = await invoke(handler, { title: "Updated" }, NoticeModel);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: "Notice not found" });
});
