const roomService = require("./room.service");

const createRoom = async (req, res, next) => {
    try {
        const {
            tenantId,
            roomNumber,
            floor,
            genderPolicy,
            hasAc,
            hasAttachedBathroom,
            basePrice,
        } = req.body;

        const { propertyId } = req.params;

        if (!tenantId || !roomNumber || basePrice === undefined) {
            return res.status(400).json({
                success: false,
                message: "tenantId, roomNumber and basePrice are required",
            });
        }

        const room = await roomService.createRoom({
            tenantId,
            propertyId,
            roomNumber,
            floor,
            genderPolicy,
            hasAc,
            hasAttachedBathroom,
            basePrice,
        });

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            data: room,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRoom,
};