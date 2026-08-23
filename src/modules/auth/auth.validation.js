/* ─────────────────────────────────────────────────────────────────────────
   src/modules/auth/auth.validation.js
   Zod schemas for auth endpoints
───────────────────────────────────────────────────────────────────────── */
const { z } = require("zod");

const registerSchema = z.object({
    name:     z.string().min(2).max(255),
    email:    z.string().email(),
    phone:    z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number").optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role:     z.enum(["GUEST", "OWNER", "STAFF"]).default("GUEST"),
    tenantId: z.union([z.string(), z.number()]).optional(),
});

const loginSchema = z.object({
    email:    z.string().email(),
    password: z.string().min(1),
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(6),
});

module.exports = { registerSchema, loginSchema, changePasswordSchema };