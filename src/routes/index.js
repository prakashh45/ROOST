const express = require("express");

const propertyRoutes = require("../modules/property/property.routes");
const bookingRoutes = require("../modules/booking/booking.routes");

const router = express.Router();

router.use("/properties", propertyRoutes);
router.use("/bookings", bookingRoutes);

module.exports = router;