/* ─────────────────────────────────────────────────────────────────────────
   src/modules/auth/auth.routes.js
   POST /api/v1/auth/register
   POST /api/v1/auth/login
   GET  /api/v1/auth/me          (protected)
   POST /api/v1/auth/change-password (protected)
───────────────────────────────────────────────────────────────────────── */
const {
    registerSchema,
    loginSchema,
    adminRegisterSchema,
    adminLoginSchema,
    changePasswordSchema,
} = require("./auth.validation");

const router = express.Router();

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