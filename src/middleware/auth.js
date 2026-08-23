/* ─────────────────────────────────────────────────────────────────────────
   src/middleware/auth.js
   JWT auth middleware — lightweight, no Google OAuth complexity yet.
   Decodes Bearer token and attaches req.user = { userId, email, role, tenantId }
───────────────────────────────────────────────────────────────────────── */
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            const err = new Error("Authorization token required");
            err.status = 401;
            err.code   = "UNAUTHORIZED";
            return next(err);
        }

        const token   = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            userId:   decoded.userId,
            email:    decoded.email,
            role:     decoded.role,
            tenantId: decoded.tenantId || null,
        };

        next();
    } catch (error) {
        const err    = new Error("Invalid or expired token");
        err.status   = 401;
        err.code     = "TOKEN_INVALID";
        next(err);
    }
};

/* Role guard factory — use: requireRole("OWNER", "STAFF") */
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        const err  = new Error("Unauthorized");
        err.status = 401;
        err.code   = "UNAUTHORIZED";
        return next(err);
    }
    if (!roles.includes(req.user.role)) {
        const err  = new Error(
            `Access denied. Required role: ${roles.join(" or ")}`
        );
        err.status = 403;
        err.code   = "FORBIDDEN";
        return next(err);
    }
    next();
};

module.exports = { authenticate, requireRole };
