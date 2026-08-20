const bookingService = require("./booking.service");

const createBooking = async (req, res, next) => {
    try {
        const booking = await bookingService.createBooking(req.body);

        res.status(201).json({
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

const getBookingByCode = async (req, res, next) => {
    try {
        console.log("BOOKING CODE RECEIVED:", req.params.code);

        const booking = await bookingService.getBookingByCode(
            req.params.code
        );

        res.status(200).json({
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBooking,
    getBookingByCode,
};