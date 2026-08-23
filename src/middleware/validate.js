/* ─────────────────────────────────────────────────────────────────────────
   src/middleware/validate.js
   Zod validation middleware — returns 400 with structured error details
───────────────────────────────────────────────────────────────────────── */
const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            code:    "VALIDATION_ERROR",
            message: "Validation failed",
            details: error.errors?.map((e) => ({
                field:   e.path.join("."),
                message: e.message,
            })),
        });
    }
};

module.exports = validate;
