const bedService = require("./bed.service");

const createBed = async (req, res, next) => {
    try {
        const { roomId } = req.params;

        const {
            tenantId,
            bedCode,
            position,
            priceOverride,
        } = req.body;

        if (!tenantId || !bedCode) {
            return res.status(400).json({
                success: false,
                message: "tenantId and bedCode are required",
            });
        }

        const bed = await bedService.createBed({
            tenantId,
            roomId,
            bedCode,
            position,
            priceOverride,
        });

        res.status(201).json({
            success: true,
            message: "Bed created successfully",
            data: bed,
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBed,
};