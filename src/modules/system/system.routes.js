const express = require("express"); const controller = require("./system.controller"); const validate = require("../../middleware/validate"); const { authenticate } = require("../../middleware/auth"); const { requirePermission } = require("../../common/rbac"); const { settingSchema, restoreSchema } = require("./system.validation");
const router = express.Router(); router.use(authenticate);
router.get("/access-control", controller.access); router.get("/settings", requirePermission("settings:read"), controller.settings); router.put("/settings", requirePermission("settings:write"), validate(settingSchema), controller.putSetting);
router.get("/camera", requirePermission("settings:read"), controller.camera); router.put("/camera", requirePermission("settings:write"), validate(settingSchema), controller.putCamera);
router.get("/backup", requirePermission("settings:read"), controller.backup); router.post("/restore", requirePermission("settings:write"), validate(restoreSchema), controller.restore);
router.get("/audit-logs", requirePermission("audit:read"), controller.auditLogs); module.exports = router;
