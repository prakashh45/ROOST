/* ─────────────────────────────────────────────────────────────────────────
   src/modules/booking/booking.routes.js
   POST  /api/v1/bookings                     — Guest: create booking
   GET   /api/v1/bookings                     — Owner: list bookings
   GET   /api/v1/bookings/:code               — Guest/Owner: get booking
   PATCH /api/v1/bookings/:code/confirm       — Owner: confirm
   PATCH /api/v1/bookings/:code/reject        — Owner: reject (with reason)
   PATCH /api/v1/bookings/:code/cancel        — Guest/Owner: cancel
───────────────────────────────────────────────────────────────────────── */
const express  = require("express");
const ctrl     = require("./booking.controller");
const validate = require("../../middleware/validate");
const { authenticate, requireRole } = require("../../middleware/auth");
const { createBookingSchema, rejectBookingSchema, cancelBookingSchema } = require("./booking.validation");

const router = express.Router();

/* Guest routes */
router.post("/",                         validate(createBookingSchema),  ctrl.createBooking);
router.get( "/:code",                                                    ctrl.getBookingByCode);
router.patch("/:code/cancel",            validate(cancelBookingSchema),  ctrl.cancelBooking);

/* Owner routes */
router.get( "/",                         authenticate, requireRole("OWNER","STAFF","PLATFORM_ADMIN"), ctrl.listOwnerBookings);
router.patch("/:code/confirm",           authenticate, requireRole("OWNER","STAFF"),                  ctrl.confirmBooking);
router.patch("/:code/reject",            authenticate, requireRole("OWNER","STAFF"), validate(rejectBookingSchema), ctrl.rejectBooking);

module.exports = router;