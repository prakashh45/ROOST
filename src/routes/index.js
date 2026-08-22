const express = require("express");

const propertyRoutes = require("../modules/property/property.routes");
const bookingRoutes = require("../modules/booking/booking.routes");
const authRoutes = require("../modules/auth/auth.routes");
const roomRoutes = require("../modules/room/room.routes");
const bedRoutes = require("../modules/bed/bed.routes");

const router = express.Router();

router.use("/properties", propertyRoutes);

router.use("/bookings", bookingRoutes);

router.use("/auth", authRoutes);

router.use("/rooms", bedRoutes);

module.exports = router;