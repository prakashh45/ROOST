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