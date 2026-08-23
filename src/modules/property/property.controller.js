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
const createProperty = async (req, res, next) => {
    try {
        const {
            tenantId,
            name,
            slug,
            description,
            address,
            city,
            state,
            postalCode,
            latitude,
            longitude,
        } = req.body;

        if (!tenantId || !name || !slug) {
            return res.status(400).json({
                success: false,
                message: "tenantId, name and slug are required",
            });
        }

        const property = await propertyService.createProperty({
            tenantId,
            name,
            slug,
            description,
            address,
            city,
            state,
            postalCode,
            latitude,
            longitude,
        });

        res.status(201).json({
            success: true,
            message: "Property created successfully",
            data: property,
        });
    } catch (error) {
        next(error);
    }
};

const searchProperties = async (req, res, next) => {
    try {
        const { city, state, search } = req.query;

        const properties =
            await propertyService.searchProperties({
                city,
                state,
                search,
            });

        res.status(200).json({
            data: properties,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPropertyBySlug,
    getPropertyAvailability,
    createProperty,
    searchProperties,
};