/* ─────────────────────────────────────────────────────────────────────────
   src/modules/property/property.routes.js
   GET    /api/v1/properties
   GET    /api/v1/properties/:slug
   GET    /api/v1/properties/:slug/availability
   POST   /api/v1/properties                        (OWNER only)
   PATCH  /api/v1/properties/:propertyId            (OWNER only)
   PATCH  /api/v1/properties/:propertyId/status     (OWNER only)
   POST   /api/v1/properties/:propertyId/rooms      (OWNER only)
   GET    /api/v1/properties/:propertyId/rooms      (OWNER — list own rooms)
───────────────────────────────────────────────────────────────────────── */
const express      = require("express");
const ctrl         = require("./property.controller");
const roomCtrl     = require("../room/room.controller");
const validate     = require("../../middleware/validate");
const { authenticate, requireRole } = require("../../middleware/auth");
const { createPropertySchema, updatePropertySchema, updatePropertyStatusSchema } = require("./property.validation");
const { createRoomSchema } = require("../room/room.validation");

const router = express.Router();

/* ── Public (no auth) ── */
router.get("/",                         ctrl.searchProperties);
router.get("/:slug/availability",       ctrl.getPropertyAvailability);
router.get("/:slug",                    ctrl.getPropertyBySlug);

/* ── Owner protected ── */
router.post("/",                        authenticate, requireRole("OWNER","STAFF","PLATFORM_ADMIN"), validate(createPropertySchema), ctrl.createProperty);
router.patch("/:propertyId",            authenticate, requireRole("OWNER","STAFF"), validate(updatePropertySchema), ctrl.updateProperty);
router.patch("/:propertyId/status",     authenticate, requireRole("OWNER","STAFF","PLATFORM_ADMIN"), validate(updatePropertyStatusSchema), ctrl.updatePropertyStatus);

/* Rooms nested under property */
router.get( "/:propertyId/rooms",       authenticate, requireRole("OWNER","STAFF"), roomCtrl.getRoomsByProperty);
router.post("/:propertyId/rooms",       authenticate, requireRole("OWNER","STAFF"), validate(createRoomSchema), roomCtrl.createRoom);

module.exports = router;