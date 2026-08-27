/* ─────────────────────────────────────────────────────────────────────────
   src/modules/auth/auth.routes.js
───────────────────────────────────────────────────────────────────────── */

const express = require("express");
const controller = require("./auth.controller");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");

const {
    registerSchema,
    loginSchema,
    adminRegisterSchema,
    adminLoginSchema,
    changePasswordSchema,
} = require("./auth.validation");

router.post("/register",         validate(registerSchema),       controller.register);
router.post("/login",            validate(loginSchema),          controller.login);
router.get( "/me",               authenticate,                   controller.getProfile);
router.post("/change-password",  authenticate, validate(changePasswordSchema), controller.changePassword);
router.post(
    "/admin/register",
    validate(adminRegisterSchema),
    controller.adminRegister
);

router.post(
    "/admin/login",
    validate(adminLoginSchema),
    controller.adminLogin
);

module.exports = router;