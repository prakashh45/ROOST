/* ─────────────────────────────────────────────────────────────────────────
   src/modules/auth/auth.routes.js

   POST /api/v1/auth/register
   POST /api/v1/auth/login

   GET  /api/v1/auth/me
   POST /api/v1/auth/change-password

   POST /api/v1/auth/admin/login
───────────────────────────────────────────────────────────────────────── */

const express = require("express");
const controller = require("./auth.controller");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");

const {
    registerSchema,
    loginSchema,
    adminLoginSchema,
    changePasswordSchema,
    updateProfileSchema,
    forgotPasswordSchema,
} = require("./auth.validation");

const router = express.Router();

/* ─────────────────────────────────────────────────────────────────────────
   GENERAL AUTH
───────────────────────────────────────────────────────────────────────── */

/* Register Guest / Owner / Staff */
router.post(
    "/register",
    validate(registerSchema),
    controller.register
);

/* Login Guest / Owner / Staff */
router.post(
    "/login",
    validate(loginSchema),
    controller.login
);

/* Forgot Password */
router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    controller.forgotPassword
);

/* ─────────────────────────────────────────────────────────────────────────
   PROTECTED AUTH
───────────────────────────────────────────────────────────────────────── */

/* Current logged-in user */
router.get(
    "/me",
    authenticate,
    controller.getProfile
);

/* Update Profile */
router.patch(
    "/me",
    authenticate,
    validate(updateProfileSchema),
    controller.updateProfile
);

/* Change password */
router.post(
    "/change-password",
    authenticate,
    validate(changePasswordSchema),
    controller.changePassword
);

/* ─────────────────────────────────────────────────────────────────────────
   ADMIN AUTH
───────────────────────────────────────────────────────────────────────── */

/* Admin Login */
router.post(
    "/admin/login",
    validate(adminLoginSchema),
    controller.adminLogin
);

/* ───────────────────────────────────────────────────────────────────────── */

module.exports = router;
