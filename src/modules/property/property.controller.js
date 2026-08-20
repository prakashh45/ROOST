const propertyService = require("./property.service");

const getPropertyBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const property =
            await propertyService.getPropertyBySlug(slug);

        res.status(200).json({
            data: property,
        });
    } catch (error) {
        next(error);
    }
};

const getPropertyAvailability = async (req, res) => {
    try {
        const { slug } = req.params;
        const { checkIn, checkOut } = req.query;

        console.log("Availability request:", {
            slug,
            checkIn,
            checkOut,
        });

        const availability =
            await propertyService.getPropertyAvailability(
                slug,
                checkIn,
                checkOut
            );

        res.status(200).json({
            data: availability,
        });
    } catch (error) {
        console.error("AVAILABILITY ERROR:");
        console.error(error);

        res.status(500).json({
            message: error.message,
            error: error.code,
        });
    }
};

module.exports = {
    getPropertyBySlug,
    getPropertyAvailability,
};