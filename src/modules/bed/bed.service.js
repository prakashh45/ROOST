const prisma = require("../../config/db");

const createBed = async ({
    tenantId,
    roomId,
    bedCode,
    position,
    priceOverride,
}) => {

    // Check room
    const room = await prisma.rooms.findFirst({
        where: {
            id: BigInt(roomId),
            tenant_id: BigInt(tenantId),
        },
    });

    if (!room) {
        const error = new Error("Room not found");
        error.status = 404;
        error.code = "ROOM_NOT_FOUND";
        throw error;
    }

    // Check duplicate bed
    const existingBed = await prisma.beds.findFirst({
        where: {
            room_id: BigInt(roomId),
            bed_code: bedCode,
        },
    });

    if (existingBed) {
        const error = new Error("Bed code already exists in this room");
        error.status = 409;
        error.code = "BED_ALREADY_EXISTS";
        throw error;
    }

    const bed = await prisma.beds.create({
        data: {
            tenant_id: BigInt(tenantId),
            room_id: BigInt(roomId),
            bed_code: bedCode,
            position: position || null,
            price_override:
                priceOverride !== undefined && priceOverride !== null
                    ? priceOverride
                    : null,
            status: "AVAILABLE",
        },
    });

    return {
        id: bed.id.toString(),
        tenantId: bed.tenant_id.toString(),
        roomId: bed.room_id.toString(),
        bedCode: bed.bed_code,
        position: bed.position,
        priceOverride: bed.price_override
            ? bed.price_override.toString()
            : null,
        status: bed.status,
    };
};

module.exports = {
    createBed,
};