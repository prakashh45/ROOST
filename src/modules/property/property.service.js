/* ─────────────────────────────────────────────────────────────────────────
   src/modules/property/property.service.js
   Full property service: search, detail, create, update, publish, availability
───────────────────────────────────────────────────────────────────────── */
const prisma = require("../../config/db");

/* ── DTO mapper ── */
const formatProperty = (p) => ({
    id:          p.id.toString(),
    tenantId:    p.tenant_id.toString(),
    name:        p.name,
    slug:        p.slug,
    description: p.description || null,
    address:     p.address || null,
    city:        p.city || null,
    state:       p.state || null,
    postalCode:  p.postal_code || null,
    latitude:    p.latitude  ? p.latitude.toString()  : null,
    longitude:   p.longitude ? p.longitude.toString() : null,
    status:      p.status,
    createdAt:   p.created_at,
    updatedAt:   p.updated_at,
});

/* ── GET /properties ── */
const searchProperties = async ({ city, state, search, page = 1, limit = 20 }) => {
    const where = { status: "PUBLISHED" };

    if (city)   where.city  = { contains: city,   mode: "insensitive" };
    if (state)  where.state = { contains: state,  mode: "insensitive" };
    if (search) {
        where.OR = [
            { name:    { contains: search, mode: "insensitive" } },
            { city:    { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
        ];
    }

    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * pageSize;

    const [properties, total] = await Promise.all([
        prisma.properties.findMany({ where, skip, take: pageSize, orderBy: { created_at: "desc" } }),
        prisma.properties.count({ where }),
    ]);

    return {
        data:       properties.map(formatProperty),
        pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
};
const getMyProperties = async (tenantId) => {
    if (!tenantId) {
        const err = new Error("Owner tenant is not assigned");
        err.status = 400;
        err.code = "TENANT_REQUIRED";
        throw err;
    }

    const properties = await prisma.properties.findMany({
        where: {
            tenant_id: BigInt(tenantId),
        },
        orderBy: {
            created_at: "desc",
        },
    });

    return properties.map(formatProperty);
};
/* ── GET /properties/:slug ── */
const getPropertyBySlug = async (slug) => {
    const property = await prisma.properties.findFirst({
        where: { slug, status: "PUBLISHED" },
        include: {
            property_amenities: { include: { amenities: true } },
            rooms_rooms_property_idToproperties: {
                where: { status: "ACTIVE" },
                include: { beds_beds_room_idTorooms: true, room_amenities: { include: { amenities: true } } },
                orderBy: { room_number: "asc" },
            },
        },
    });

    if (!property) {
        const err = new Error("Property not found"); err.status = 404; err.code = "NOT_FOUND"; throw err;
    }

    return {
        ...formatProperty(property),
        amenities: property.property_amenities.map((pa) => ({
            id:   pa.amenities.id.toString(),
            name: pa.amenities.name,
            description: pa.amenities.description || null,
        })),
        rooms: property.rooms_rooms_property_idToproperties.map((r) => ({
            id:                 r.id.toString(),
            roomNumber:         r.room_number,
            floor:              r.floor,
            genderPolicy:       r.gender_policy,
            hasAc:              r.has_ac,
            hasAttachedBathroom:r.has_attached_bathroom,
            basePrice:          r.base_price.toString(),
            status:             r.status,
            amenities:          r.room_amenities.map((ra) => ({ id: ra.amenities.id.toString(), name: ra.amenities.name })),
            beds: r.beds_beds_room_idTorooms.map((b) => ({
                id:            b.id.toString(),
                bedCode:       b.bed_code,
                position:      b.position,
                priceOverride: b.price_override ? b.price_override.toString() : null,
                effectivePrice:(b.price_override ?? r.base_price).toString(),
                status:        b.status,
            })),
        })),
    };
};

/* ── GET /properties/:slug/availability ── */
const getPropertyAvailability = async (slug, checkIn, checkOut) => {
    if (!checkIn || !checkOut) {
        const err = new Error("checkIn and checkOut are required"); err.status = 400; err.code = "VALIDATION_ERROR"; throw err;
    }

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate) || isNaN(checkOutDate)) {
        const err = new Error("Invalid date format"); err.status = 400; err.code = "INVALID_DATE"; throw err;
    }
    if (checkInDate >= checkOutDate) {
        const err = new Error("checkOut must be after checkIn"); err.status = 400; err.code = "INVALID_DATE_RANGE"; throw err;
    }

    const property = await prisma.properties.findFirst({
        where: { slug, status: "PUBLISHED" },
    });
    if (!property) {
        const err = new Error("Property not found"); err.status = 404; err.code = "NOT_FOUND"; throw err;
    }

    const rooms = await prisma.rooms.findMany({
        where:   { property_id: property.id, tenant_id: property.tenant_id, status: "ACTIVE" },
        orderBy: { room_number: "asc" },
        include: { beds_beds_room_idTorooms: { orderBy: { bed_code: "asc" } } },
    });

    // Fetch all overlapping bookings for this property in ONE query (no N+1)
    const allBedIds = rooms.flatMap((r) => r.beds_beds_room_idTorooms.map((b) => b.id));

    const bookedBedIds = new Set();
    if (allBedIds.length > 0) {
        const overlapping = await prisma.bookings.findMany({
            where: {
                bed_id:   { in: allBedIds },
                status:   { in: ["PENDING", "CONFIRMED"] },
                check_in: { lt: checkOutDate },
                check_out:{ gt: checkInDate },
            },
            select: { bed_id: true },
        });
        overlapping.forEach((b) => bookedBedIds.add(b.bed_id.toString()));
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / 86400000);

    return {
        propertyId:   property.id.toString(),
        propertyName: property.name,
        checkIn,
        checkOut,
        nights,
        rooms: rooms.map((r) => ({
            id:                  r.id.toString(),
            roomNumber:          r.room_number,
            genderPolicy:        r.gender_policy,
            hasAc:               r.has_ac,
            hasAttachedBathroom: r.has_attached_bathroom,
            basePrice:           r.base_price.toString(),
            beds: r.beds_beds_room_idTorooms.map((b) => {
                const effectivePrice = b.price_override ?? r.base_price;
                const isBooked       = bookedBedIds.has(b.id.toString());
                const displayStatus  = isBooked ? "BOOKED"
                    : b.status !== "AVAILABLE" ? b.status
                    : "AVAILABLE";
                return {
                    id:            b.id.toString(),
                    bedCode:       b.bed_code,
                    position:      b.position,
                    effectivePrice:effectivePrice.toString(),
                    totalForStay:  (Number(effectivePrice) * nights).toFixed(2),
                    status:        displayStatus,
                    isBookable:    displayStatus === "AVAILABLE",
                };
            }),
        })),
    };
};

/* ── POST /properties ── */
const createProperty = async ({ tenantId, name, slug, description, address, city, state, postalCode, latitude, longitude }) => {
    const existing = await prisma.properties.findFirst({ where: { tenant_id: BigInt(tenantId), slug } });
    if (existing) {
        const err = new Error("Property slug already exists for this tenant"); err.status = 409; err.code = "SLUG_EXISTS"; throw err;
    }

    const property = await prisma.properties.create({
        data: {
            tenant_id:   BigInt(tenantId),
            name, slug, description,
            address, city, state,
            postal_code: postalCode || null,
            latitude:    latitude  || null,
            longitude:   longitude || null,
            status: "DRAFT",
        },
    });

    return formatProperty(property);
};

/* ── PATCH /properties/:propertyId ── */
const updateProperty = async (propertyId, tenantId, data) => {
    const existing = await prisma.properties.findFirst({ where: { id: BigInt(propertyId), tenant_id: BigInt(tenantId) } });
    if (!existing) { const err = new Error("Property not found"); err.status = 404; err.code = "NOT_FOUND"; throw err; }

    const property = await prisma.properties.update({
        where: { id: BigInt(propertyId) },
        data: {
            name:        data.name,
            description: data.description,
            address:     data.address,
            city:        data.city,
            state:       data.state,
            postal_code: data.postalCode,
            latitude:    data.latitude  || null,
            longitude:   data.longitude || null,
            updated_at:  new Date(),
        },
    });
    return formatProperty(property);
};

/* ── PATCH /properties/:propertyId/status ── */
/* ── DELETE /properties/:propertyId ── */
const deleteProperty = async (propertyId, tenantId) => {
    const existing = await prisma.properties.findFirst({
        where: {
            id: BigInt(propertyId),
            tenant_id: BigInt(tenantId),
        },
    });

    if (!existing) {
        const err = new Error("Property not found");
        err.status = 404;
        err.code = "NOT_FOUND";
        throw err;
    }

    await prisma.properties.delete({
        where: {
            id: BigInt(propertyId),
        },
    });

    return {
        id: existing.id.toString(),
        tenantId: existing.tenant_id.toString(),
    };
};


module.exports = {
    searchProperties,
    getMyProperties,
    getPropertyBySlug,
    getPropertyAvailability,
    createProperty,
    updateProperty,
    updatePropertyStatus,
    deleteProperty,
};