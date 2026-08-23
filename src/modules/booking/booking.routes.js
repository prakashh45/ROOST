const express = require("express");

const bookingController = require("./booking.controller");

const router = express.Router();

router.post(
    "/",
    bookingController.createBooking
);

router.get(
    "/test",
    (req, res) => {
        res.status(200).json({
            message: "Booking route is working"
        });
    }
);

router.patch(
    "/:code/cancel",
    bookingController.cancelBooking
);

router.get(
    "/:code",
    bookingController.getBookingByCode
);

module.exports = router;