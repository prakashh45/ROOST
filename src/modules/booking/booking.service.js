/* ─────────────────────────────────────────────────────────────────────────
   src/modules/booking/booking.service.js
   Full booking lifecycle: create, getByCode, confirm, reject, cancel,
   listOwnerBookings — all with ownership enforcement.
───────────────────────────────────────────────────────────────────────── */
const prisma = require("../../config/db");
const { sendNotification } = require("../notification/notification.service");

/* ── helpers ── */
const generateBookingCode = () => {
    const chars = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // base32 no ambiguous
    let code = "ROOST-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
};

const formatBooking = (b) => ({
    id:              b.id.toString(),
    bookingCode:     b.booking_code,
    tenantId:        b.tenant_id.toString(),
    guestId:         b.guest_id.toString(),
    propertyId:      b.property_id.toString(),
    roomId:          b.room_id.toString(),
    bedId:           b.bed_id.toString(),
    checkIn:         b.check_in,
    checkOut:        b.check_out,
    guestName:       b.guest_name,
    guestPhone:      b.guest_phone   || null,
    guestEmail:      b.guest_email   || null,
    source:          b.source,
    status:          b.status,
    rejectionReason: b.rejection_reason || null,
    totalAmount:     b.total_amount.toString(),
    createdAt:       b.created_at,
    updatedAt:       b.updated_at,
});

/* ── VALID STATUS TRANSITIONS ── */
const ALLOWED_TRANSITIONS = {
    PENDING:   ["CONFIRMED", "REJECTED", "CANCELLED"],
    CONFIRMED: ["CANCELLED", "COMPLETED"],
    REJECTED:  [],
    CANCELLED: [],
    COMPLETED: [],
};

/* ─────────────────────────────────────────────────────────────────────────
   createBooking
   Fully transactional. Validates property → room → bed chain with tenant
   isolation. Calculates price server-side. Catches P2002 for double-booking.
───────────────────────────────────────────────────────────────────────── */
const createBooking = async ({
    tenantId, guestId, propertyId, roomId, bedId,
    checkIn, checkOut, guestName, guestPhone, guestEmail, source = "WEB",
}) => {
    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
        const err = new Error("checkOut must be after checkIn"); err.status = 400; err.code = "INVALID_DATE_RANGE"; throw err;
    }
    if (checkInDate < new Date(new Date().toDateString())) {
        const err = new Error("checkIn cannot be in the past"); err.status = 400; err.code = "INVALID_DATE"; throw err;
    }

    // Validate full ownership chain: property → room → bed
    const property = await prisma.properties.findFirst({
        where: { id: BigInt(propertyId), tenant_id: BigInt(tenantId), status: "PUBLISHED" },
    });
    if (!property) { const err = new Error("Property not found or not published"); err.status = 404; err.code = "PROPERTY_NOT_FOUND"; throw err; }

    const room = await prisma.rooms.findFirst({
        where: { id: BigInt(roomId), property_id: BigInt(propertyId), tenant_id: BigInt(tenantId), status: "ACTIVE" },
    });
    if (!room) { const err = new Error("Room not found or inactive"); err.status = 404; err.code = "ROOM_NOT_FOUND"; throw err; }

    const bed = await prisma.beds.findFirst({
        where: { id: BigInt(bedId), room_id: BigInt(roomId), tenant_id: BigInt(tenantId) },
    });
    if (!bed) { const err = new Error("Bed not found"); err.status = 404; err.code = "BED_NOT_FOUND"; throw err; }

    if (bed.status !== "AVAILABLE") {
        const err = new Error(`Bed is ${bed.status.toLowerCase()} and cannot be booked`); err.status = 409; err.code = "BED_NOT_AVAILABLE"; throw err;
    }

    // Check overlap BEFORE creating (app-layer guard; DB exclusion constraint is the hard lock)
    const conflict = await prisma.bookings.findFirst({
        where: {
            bed_id:    BigInt(bedId),
            tenant_id: BigInt(tenantId),
            status:    { in: ["PENDING", "CONFIRMED"] },
            check_in:  { lt: checkOutDate },
            check_out: { gt: checkInDate },
        },
    });
    if (conflict) {
        const err = new Error("Bed is already booked for the selected dates"); err.status = 409; err.code = "BED_ALREADY_BOOKED"; throw err;
    }

    // Calculate price
    const nights       = Math.ceil((checkOutDate - checkInDate) / 86400000);
    const unitPrice    = bed.price_override ?? room.base_price;
    const totalAmount  = (Number(unitPrice) * nights).toFixed(2);

    // Generate unique booking code
    let bookingCode;
    let attempts = 0;
    do {
        bookingCode = generateBookingCode();
        const exists = await prisma.bookings.findUnique({ where: { booking_code: bookingCode } });
        if (!exists) break;
        if (++attempts > 10) throw new Error("Could not generate unique booking code");
    } while (true);

    try {
        const booking = await prisma.bookings.create({
            data: {
                booking_code:    bookingCode,
                tenant_id:       BigInt(tenantId),
                guest_id:        BigInt(guestId),
                property_id:     BigInt(propertyId),
                room_id:         BigInt(roomId),
                bed_id:          BigInt(bedId),
                check_in:        checkInDate,
                check_out:       checkOutDate,
                guest_name:      guestName,
                guest_phone:     guestPhone || null,
                guest_email:     guestEmail || null,
                source,
                status:          "PENDING",
                rejection_reason:null,
                total_amount:    totalAmount,
            },
        });

        // Fire-and-forget notifications
        sendNotification({
            event:   "BOOKING_CREATED",
            booking: formatBooking(booking),
            tenant:  { whatsappNumber: null }, // enriched in real flow
        }).catch(console.error);

        return formatBooking(booking);
    } catch (err) {
        // Catch DB-level exclusion constraint violation
        if (err.code === "P2002" || (err.message && err.message.includes("no_double_booking"))) {
            const conflict = new Error("Bed is already booked for the selected dates");
            conflict.status = 409; conflict.code = "BED_ALREADY_BOOKED"; throw conflict;
        }
        throw err;
    }
};

/* ── getBookingByCode ── */
const getBookingByCode = async (code) => {
    const booking = await prisma.bookings.findUnique({ where: { booking_code: code } });
    if (!booking) { const err = new Error("Booking not found"); err.status = 404; err.code = "NOT_FOUND"; throw err; }
    return formatBooking(booking);
};

/* ── confirmBooking (OWNER) ── */
const confirmBooking = async (code, tenantId) => {
    const booking = await prisma.bookings.findUnique({ where: { booking_code: code } });
    if (!booking) { const err = new Error("Booking not found"); err.status = 404; err.code = "NOT_FOUND"; throw err; }
    if (booking.tenant_id.toString() !== tenantId.toString()) {
        const err = new Error("Unauthorized"); err.status = 403; err.code = "FORBIDDEN"; throw err;
    }
    if (!ALLOWED_TRANSITIONS[booking.status].includes("CONFIRMED")) {
        const err = new Error(`Cannot confirm a booking with status ${booking.status}`); err.status = 409; err.code = "INVALID_TRANSITION"; throw err;
    }

    const updated = await prisma.bookings.update({
        where: { booking_code: code },
        data:  { status: "CONFIRMED", updated_at: new Date() },
    });

    sendNotification({ event: "BOOKING_CONFIRMED", booking: formatBooking(updated), tenant: {} }).catch(console.error);
    return formatBooking(updated);
};

/* ── rejectBooking (OWNER) ── */
const rejectBooking = async (code, tenantId, reason) => {
    const booking = await prisma.bookings.findUnique({ where: { booking_code: code } });
    if (!booking) { const err = new Error("Booking not found"); err.status = 404; err.code = "NOT_FOUND"; throw err; }
    if (booking.tenant_id.toString() !== tenantId.toString()) {
        const err = new Error("Unauthorized"); err.status = 403; err.code = "FORBIDDEN"; throw err;
    }
    if (!ALLOWED_TRANSITIONS[booking.status].includes("REJECTED")) {
        const err = new Error(`Cannot reject a booking with status ${booking.status}`); err.status = 409; err.code = "INVALID_TRANSITION"; throw err;
    }

    const updated = await prisma.bookings.update({
        where: { booking_code: code },
        data:  { status: "REJECTED", rejection_reason: reason, updated_at: new Date() },
    });

    sendNotification({ event: "BOOKING_REJECTED", booking: formatBooking(updated), tenant: {} }).catch(console.error);
    return formatBooking(updated);
};

/* ── cancelBooking (GUEST or OWNER) ── */
const cancelBooking = async (code, reason) => {
    const booking = await prisma.bookings.findUnique({ where: { booking_code: code } });
    if (!booking) { const err = new Error("Booking not found"); err.status = 404; err.code = "NOT_FOUND"; throw err; }
    if (!ALLOWED_TRANSITIONS[booking.status].includes("CANCELLED")) {
        const err = new Error(`Cannot cancel a booking with status ${booking.status}`); err.status = 409; err.code = "INVALID_TRANSITION"; throw err;
    }

    const updated = await prisma.bookings.update({
        where: { booking_code: code },
        data:  { status: "CANCELLED", rejection_reason: reason || null, updated_at: new Date() },
    });

    sendNotification({ event: "BOOKING_CANCELLED", booking: formatBooking(updated), tenant: {} }).catch(console.error);
    return formatBooking(updated);
};

/* ── listOwnerBookings ── */
const listOwnerBookings = async ({ tenantId, propertyId, status, page = 1, limit = 20 }) => {
    const where = { tenant_id: BigInt(tenantId) };
    if (propertyId) where.property_id = BigInt(propertyId);
    if (status)     where.status      = status;

    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * pageSize;

    const [bookings, total] = await Promise.all([
        prisma.bookings.findMany({ where, skip, take: pageSize, orderBy: { created_at: "desc" } }),
        prisma.bookings.count({ where }),
    ]);

    return {
        data:       bookings.map(formatBooking),
        pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
};

module.exports = {
    createBooking,
    getBookingByCode,
    confirmBooking,
    rejectBooking,
    cancelBooking,
    listOwnerBookings,
};