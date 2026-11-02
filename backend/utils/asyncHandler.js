/**
 * Express 4 does not automatically forward rejected promises from async
 * route handlers. This wrapper forwards both synchronous throws and
 * asynchronous rejections to the application error middleware.
 */
function asyncHandler(handler) {
    if (typeof handler !== "function") {
        throw new TypeError("asyncHandler requires a route handler function");
    }

    const wrapped = function wrappedAsyncHandler(req, res, next) {
        return Promise.resolve()
            .then(() => handler(req, res, next))
            .catch(next);
    };

    Object.defineProperty(wrapped, "isAsyncHandler", {
        value: true,
        enumerable: true,
    });

    return wrapped;
}

module.exports = { asyncHandler };
