export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Đã có lỗi xảy ra"
    err.statusCode = err.statusCode || 500

    if (err.code === 11000) {
        err.message = `Trùng lặp ${Object.keys(err.keyValue)}`
        err.statusCode = 400
    }

    if (err.name === "CastError") {
        err.message = "ID không hợp lệ!"
        err.statusCode = 400
    }

    res.status(err.statusCode).json({ success: false, message: err.message })
}

export const asyncError = (passedFunc) => (req, res, next) => {
    Promise.resolve(passedFunc(req, res, next)).catch(next)
}
