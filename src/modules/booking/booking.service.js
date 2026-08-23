const prisma = require("../../config/db");

const createBooking = async ({
    tenantId,
    guestId,
    propertyId,
    roomId,
    bedId,
    checkIn,
    checkOut,
    guestName,
    guestPhone,
    guestEmail,
    source = "WEB",
}) => {

    // 1. Validate required fields
    if (
        !tenantId ||
        !guestId ||
        !propertyId ||
        !roomId ||
        !bedId ||
        !checkIn ||
        !checkOut ||
        !guestName
    ) {
        const error = new Error(
            "tenantId, guestId, propertyId, roomId, bedId, checkIn, checkOut and guestName are required"
        );

        error.status = 400;
        error.code = "VALIDATION_ERROR";

        throw error;
    }

    // 2. Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
        Number.isNaN(checkInDate.getTime()) ||
        Number.isNaN(checkOutDate.getTime())
    ) {
        const error = new Error("Invalid check-in or check-out date");

        error.status = 400;
        error.code = "INVALID_DATE";

        throw error;
    }

    if (checkInDate >= checkOutDate) {
        const error = new Error(
            "Check-out date must be after check-in date"
        );

        error.status = 400;
        error.code = "INVALID_DATE_RANGE";

        throw error;
    }

    // 3. Validate property
    const property = await prisma.properties.findFirst({
        where: {
            id: BigInt(propertyId),
            tenant_id: BigInt(tenantId),
            status: "PUBLISHED",
        },
    });

    if (!property) {
        const error = new Error("Property not found");

        error.status = 404;
        error.code = "PROPERTY_NOT_FOUND";

        throw error;
    }

    // 4. Validate room
    const room = await prisma.rooms.findFirst({
        where: {
            id: BigInt(roomId),
            property_id: BigInt(propertyId),
            tenant_id: BigInt(tenantId),
            status: "ACTIVE",
        },
    });

    if (!room) {
        const error = new Error("Room not found");

        error.status = 404;
        error.code = "ROOM_NOT_FOUND";

        throw error;
    }

    // 5. Validate bed
    const bed = await prisma.beds.findFirst({
        where: {
            id: BigInt(bedId),
            room_id: BigInt(roomId),
            tenant_id: BigInt(tenantId),
        },
    });

    if (!bed) {
        const error = new Error("Bed not found");

        error.status = 404;
        error.code = "BED_NOT_FOUND";

        throw error;
    }

    // 6. Check whether bed is physically available
    if (bed.status !== "AVAILABLE") {
        const error = new Error("Bed is not available");

        error.status = 409;
        error.code = "BED_NOT_AVAILABLE";

        throw error;
    }

    // 7. Check overlapping booking
    const overlappingBooking = await prisma.bookings.findFirst({
        where: {
            bed_id: BigInt(bedId),
            tenant_id: BigInt(tenantId),

            status: {
                in: [
                    "PENDING",
                    "CONFIRMED",
                ],
            },

            check_in: {
                lt: checkOutDate,
            },

            check_out: {
                gt: checkInDate,
            },
        },
    });

    if (overlappingBooking) {
        const error = new Error(
            "Bed is already booked for the selected dates"
        );

        error.status = 409;
        error.code = "BED_ALREADY_BOOKED";

        throw error;
    }

    // 8. Calculate number of nights
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const nights = Math.ceil(
        (checkOutDate - checkInDate) /
        millisecondsPerDay
    );

    // 9. Determine price
    const price = bed.price_override ?? room.base_price;

    const totalAmount =
        Number(price) * nights;

    // 10. Generate booking code
    const bookingCode =
        `ROOST-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;

    // 11. Create booking
    const booking = await prisma.bookings.create({
        data: {
            booking_code: bookingCode,

            tenant_id: BigInt(tenantId),
            guest_id: BigInt(guestId),

            property_id: BigInt(propertyId),
            room_id: BigInt(roomId),
            bed_id: BigInt(bedId),

            check_in: checkInDate,
            check_out: checkOutDate,

            guest_name: guestName,
            guest_phone: guestPhone || null,
            guest_email: guestEmail || null,

            source,
            status: "PENDING",

            rejection_reason: null,

            total_amount: totalAmount.toFixed(2),
        },
    });

    // 12. Return clean response
    return {
        id: booking.id.toString(),

        bookingCode: booking.booking_code,

        tenantId: booking.tenant_id.toString(),
        guestId: booking.guest_id.toString(),

        propertyId: booking.property_id.toString(),
        roomId: booking.room_id.toString(),
        bedId: booking.bed_id.toString(),

        checkIn: booking.check_in,
        checkOut: booking.check_out,

        guestName: booking.guest_name,
        guestPhone: booking.guest_phone,
        guestEmail: booking.guest_email,

        source: booking.source,
        status: booking.status,

        rejectionReason: booking.rejection_reason,

        totalAmount: booking.total_amount.toString(),

        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
    };
};


const getBookingByCode = async (code) => {

    const booking = await prisma.bookings.findUnique({
        where: {
            booking_code: code,
        },
    });

    if (!booking) {
        const error = new Error("Booking not found");

        error.status = 404;
        error.code = "NOT_FOUND";

        throw error;
    }

    return {
        id: booking.id.toString(),

        bookingCode: booking.booking_code,

        tenantId: booking.tenant_id.toString(),
        guestId: booking.guest_id.toString(),

        propertyId: booking.property_id.toString(),
        roomId: booking.room_id.toString(),
        bedId: booking.bed_id.toString(),

        checkIn: booking.check_in,
        checkOut: booking.check_out,

        guestName: booking.guest_name,
        guestPhone: booking.guest_phone,
        guestEmail: booking.guest_email,

        source: booking.source,
        status: booking.status,

        rejectionReason: booking.rejection_reason,

        totalAmount: booking.total_amount.toString(),

        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
    };
};

const cancelBooking = async (code, reason) => {

    const booking = await prisma.bookings.findUnique({
        where: {
            booking_code: code,
        },
    });

    if (!booking) {
        const error = new Error("Booking not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    if (
        booking.status === "CANCELLED"
    ) {
        const error = new Error(
            "Booking is already cancelled"
        );

        error.status = 409;
        error.code = "ALREADY_CANCELLED";

        throw error;
    }

    if (
        booking.status !== "PENDING" &&
        booking.status !== "CONFIRMED"
    ) {
        const error = new Error(
            "Booking cannot be cancelled"
        );

        error.status = 409;
        error.code = "INVALID_BOOKING_STATUS";

        throw error;
    }

    const updatedBooking =
        await prisma.bookings.update({
            where: {
                booking_code: code,
            },

            data: {
                status: "CANCELLED",
                rejection_reason: reason || null,
            },
        });

    return {
        id: updatedBooking.id.toString(),

        bookingCode:
            updatedBooking.booking_code,

        status:
            updatedBooking.status,

        rejectionReason:
            updatedBooking.rejection_reason,

        updatedAt:
            updatedBooking.updated_at,
    };
};

module.exports = {
    createBooking,
    getBookingByCode,
    cancelBooking,
};