/* ─────────────────────────────────────────────────────────────────────────
   src/modules/auth/auth.routes.js
   POST /api/v1/auth/register
   POST /api/v1/auth/login
   GET  /api/v1/auth/me          (protected)
   POST /api/v1/auth/change-password (protected)
───────────────────────────────────────────────────────────────────────── */
const express    = require("express");
const controller = require("./auth.controller");
const validate   = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { registerSchema, loginSchema, changePasswordSchema } = require("./auth.validation");

const router = express.Router();

router.post("/register",         validate(registerSchema),       controller.register);
router.post("/login",            validate(loginSchema),          controller.login);
router.get( "/me",               authenticate,                   controller.getProfile);
router.post("/change-password",  authenticate, validate(changePasswordSchema), controller.changePassword);

module.exports = router;