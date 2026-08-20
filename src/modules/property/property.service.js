const prisma = require("../../config/db");

const getPropertyBySlug = async (slug) => {
    const property = await prisma.properties.findFirst({
        where: {
            slug: slug,
            status: "PUBLISHED",
        },
    });

    if (!property) {
        const error = new Error("Property not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    return property;
};

const getPropertyAvailability = async (slug, checkIn, checkOut) => {

    const property = await prisma.properties.findFirst({
        where: {
            slug: slug,
            status: "PUBLISHED",
        },
    });

    if (!property) {
        const error = new Error("Property not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    const rooms = await prisma.rooms.findMany({
        where: {
            property_id: property.id,
            tenant_id: property.tenant_id,
            status: "ACTIVE",
        },
        orderBy: {
            room_number: "asc",
        },
    });

    const availability = [];

    for (const room of rooms) {

        const beds = await prisma.beds.findMany({
            where: {
                room_id: room.id,
                tenant_id: property.tenant_id,
            },
            orderBy: {
                bed_code: "asc",
            },
        });

        const roomBeds = [];

        for (const bed of beds) {

            const overlappingBooking =
                await prisma.bookings.findFirst({
                    where: {
                        bed_id: bed.id,
                        tenant_id: property.tenant_id,

                        status: {
                            in: [
                                "PENDING",
                                "CONFIRMED",
                            ],
                        },

                        check_in: {
                            lt: new Date(checkOut),
                        },

                        check_out: {
                            gt: new Date(checkIn),
                        },
                    },
                });

            let status = bed.status;

            if (overlappingBooking) {
                status = "BOOKED";
            }

            roomBeds.push({
                id: bed.id.toString(),
                bedCode: bed.bed_code,
                position: bed.position,

                price: bed.price_override
                    ? bed.price_override.toString()
                    : room.base_price.toString(),

                status: status,
            });
        }

        availability.push({
            id: room.id.toString(),
            roomNumber: room.room_number,
            genderType: room.gender_policy,
            hasAc: room.has_ac,
            hasAttachedBathroom: room.has_attached_bathroom,
            basePrice: room.base_price.toString(),
            beds: roomBeds,
        });
    }

    return {
        rooms: availability,
    };
};

module.exports = {
    getPropertyBySlug,
    getPropertyAvailability,
};