/* ─────────────────────────────────────────────────────────────────────────
   src/modules/auth/auth.validation.js
   Zod schemas for auth endpoints
───────────────────────────────────────────────────────────────────────── */

const { z } = require("zod");

/* ── Public Register ── */
const registerSchema = z.object({
    name: z.string().min(2).max(255),

    email: z.string().email(),

    phone: z
        .string()
        .regex(
            /^[6-9]\d{9}$/,
            "Must be a valid 10-digit Indian mobile number"
        )
        .optional(),

    password: z.string().min(6, "Password must be at least 6 characters"),

    role: z
        .enum(["GUEST", "OWNER", "STAFF"])
        .default("GUEST"),

    tenantId: z.union([z.string(), z.number()]).optional(),
});

/* ── Public Login ── */
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

/* ── Admin Register ── */
/* Role is NOT accepted from frontend.
   Backend will force PLATFORM_ADMIN. */
const adminRegisterSchema = z.object({
    name: z.string().min(2).max(255),

    email: z.string().email(),

    phone: z
        .string()
        .regex(
            /^[6-9]\d{9}$/,
            "Must be a valid 10-digit Indian mobile number"
        )
        .optional(),

    password: z.string().min(6, "Password must be at least 6 characters"),
});

/* ── Admin Login ── */
const adminLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

/* ── Change Password ── */
const changePasswordSchema = z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(6),
});

module.exports = {
    registerSchema,
    loginSchema,
    adminRegisterSchema,
    adminLoginSchema,
    changePasswordSchema,
};