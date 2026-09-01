/* ─────────────────────────────────────────────────────────────────────────
   src/middleware/auth.js
   JWT auth middleware — lightweight, no Google OAuth complexity yet.
   Decodes Bearer token and attaches req.user = { userId, email, role, tenantId }
───────────────────────────────────────────────────────────────────────── */
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const authenticate = async (req, res, next) => {
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

        const user = await prisma.users.findUnique({
            where: { id: BigInt(decoded.userId) },
            select: { id: true, email: true, role: true, tenant_id: true, status: true },
        });
        if (!user || user.status !== "ACTIVE") {
            const err = new Error("Account is inactive");
            err.status = 401;
            err.code = "ACCOUNT_INACTIVE";
            return next(err);
        }

        req.user = {
            userId: user.id.toString(),
            id: user.id.toString(),        // alias for convenience
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id ? user.tenant_id.toString() : null,
            tenant_id: user.tenant_id ? user.tenant_id.toString() : null,
        };

        next();
    } catch (error) {
        if (error.status) return next(error);
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
