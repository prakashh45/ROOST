/* ─────────────────────────────────────────────────────────────────────────
   src/middleware/errorHandler.js
   Central error handler — never leaks internals in production
───────────────────────────────────────────────────────────────────────── */
const isProd = process.env.NODE_ENV === "production";

const errorHandler = (err, req, res, next) => {
    // Prisma unique-constraint / known-request errors
    if (err.code === "P2002") {
        return res.status(409).json({
            success: false,
            code: "DUPLICATE_ENTRY",
            message: "A record with that value already exists.",
        });
    }
    if (err.code === "P2025") {
        return res.status(404).json({
            success: false,
            code: "NOT_FOUND",
            message: "Record not found.",
        });
    }

    const status = err.status || 500;
    const code   = err.code   || "INTERNAL_ERROR";
    const message =
        status < 500 || !isProd
            ? err.message
            : "An unexpected error occurred. Please try again.";

    return res.status(status).json({
        success: false,
        code,
        message,
        ...(isProd ? {} : { stack: err.stack }),
    });
};

module.exports = errorHandler;
