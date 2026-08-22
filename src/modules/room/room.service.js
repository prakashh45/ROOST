const prisma = require("../../config/db");

const createRoom = async ({
    tenantId,
    propertyId,
    roomNumber,
    floor,
    genderPolicy,
    hasAc,
    hasAttachedBathroom,
    basePrice,
}) => {

    // Check property exists
    const property = await prisma.properties.findFirst({
        where: {
            id: BigInt(propertyId),
            tenant_id: BigInt(tenantId),
        },
    });

    if (!property) {
        const error = new Error("Property not found");
        error.status = 404;
        error.code = "PROPERTY_NOT_FOUND";
        throw error;
    }

    // Check duplicate room number
    const existingRoom = await prisma.rooms.findFirst({
        where: {
            property_id: BigInt(propertyId),
            room_number: roomNumber,
        },
    });

    if (existingRoom) {
        const error = new Error(
            "Room with this room number already exists"
        );
        error.status = 409;
        error.code = "ROOM_ALREADY_EXISTS";
        throw error;
    }

    const room = await prisma.rooms.create({
        data: {
            tenant_id: BigInt(tenantId),
            property_id: BigInt(propertyId),
            room_number: roomNumber,
            floor: floor ?? null,
            gender_policy: genderPolicy ?? "MIXED",
            has_ac: hasAc ?? false,
            has_attached_bathroom: hasAttachedBathroom ?? false,
            base_price: basePrice,
            status: "ACTIVE",
        },
    });

    return {
        id: room.id.toString(),
        tenantId: room.tenant_id.toString(),
        propertyId: room.property_id.toString(),
        roomNumber: room.room_number,
        floor: room.floor,
        genderPolicy: room.gender_policy,
        hasAc: room.has_ac,
        hasAttachedBathroom: room.has_attached_bathroom,
        basePrice: room.base_price.toString(),
        status: room.status,
    };
};

module.exports = {
    createRoom,
};