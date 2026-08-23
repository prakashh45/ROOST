/* ─────────────────────────────────────────────────────────────────────────
   src/routes/index.js  — Master router
───────────────────────────────────────────────────────────────────────── */
const express = require("express");

const authRoutes     = require("../modules/auth/auth.routes");
const propertyRoutes = require("../modules/property/property.routes");
const roomRoutes     = require("../modules/room/room.routes");
const bedRoutes      = require("../modules/bed/bed.routes");
const bookingRoutes  = require("../modules/booking/booking.routes");

const router = express.Router();

router.use("/auth",       authRoutes);
router.use("/properties", propertyRoutes);
router.use("/rooms",      roomRoutes);   // PATCH /rooms/:roomId
router.use("/",           bedRoutes);    // GET|POST /rooms/:roomId/beds, PATCH /beds/:bedId
router.use("/bookings",   bookingRoutes);

module.exports = router;