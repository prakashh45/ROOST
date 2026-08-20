const validateCreateBooking = (body) => {
    const { bedId, checkIn, checkOut } = body;

    if (!bedId || !checkIn || !checkOut) {
        const error = new Error(
            "bedId, checkIn and checkOut are required"
        );

        error.status = 400;
        error.code = "VALIDATION_ERROR";

        throw error;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
        const error = new Error(
            "checkIn must be before checkOut"
        );

        error.status = 400;
        error.code = "VALIDATION_ERROR";

        throw error;
    }
};

module.exports = {
    validateCreateBooking,
};