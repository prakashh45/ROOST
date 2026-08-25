/* ─────────────────────────────────────────────────────────────────────────
   src/modules/bed/bed.service.js
───────────────────────────────────────────────────────────────────────── */
const prisma = require("../../config/db");

const formatBed = (b) => ({
    id:            b.id.toString(),
    tenantId:      b.tenant_id.toString(),
    roomId:        b.room_id.toString(),
    bedCode:       b.bed_code,
    position:      b.position || null,
    priceOverride: b.price_override ? b.price_override.toString() : null,
    status:        b.status,
    createdAt:     b.created_at,
    updatedAt:     b.updated_at,
});

const createBed = async ({ tenantId, roomId, bedCode, position, priceOverride }) => {
    const room = await prisma.rooms.findFirst({
        where: { id: BigInt(roomId), tenant_id: BigInt(tenantId) },
    });
    if (!room) {
        const err = new Error("Room not found or unauthorized"); err.status = 404; err.code = "NOT_FOUND"; throw err;
    }

    const existing = await prisma.beds.findFirst({ where: { room_id: BigInt(roomId), bed_code: bedCode } });
    if (existing) {
        const err = new Error("Bed code already exists in this room"); err.status = 409; err.code = "BED_CODE_EXISTS"; throw err;
    }

    const bed = await prisma.beds.create({
        data: {
            tenant_id:      BigInt(tenantId),
            room_id:        BigInt(roomId),
            bed_code:       bedCode,
            position:       position || null,
            price_override: priceOverride != null ? priceOverride : null,
            status:         "AVAILABLE",
        },
    });

    return formatBed(bed);
};

const getBedsByRoom = async (roomId, tenantId) => {
    const beds = await prisma.beds.findMany({
        where:   { room_id: BigInt(roomId), tenant_id: BigInt(tenantId) },
        orderBy: { bed_code: "asc" },
    });
    return beds.map(formatBed);
};

const updateBed = async (req, res, next) => {
    try {
        const { bedId } = req.params;
        const { tenantId, ...rest } = req.body;

        console.log("========== UPDATE BED ==========");
        console.log("bedId:", bedId);
        console.log("tenantId:", tenantId);
        console.log("body:", req.body);
        console.log("rest:", rest);

        const bed = await svc.updateBed(bedId, tenantId, rest);

        console.log("UPDATED BED:", bed);

        res.status(200).json({
            success: true,
            message: "Bed updated",
            data: bed,
        });
    } catch (err) {
        console.error("========== UPDATE BED ERROR ==========");
        console.error(err);
        console.error("message:", err.message);
        console.error("code:", err.code);
        console.error("meta:", err.meta);

        next(err);
    }
};

module.exports = { createBed, getBedsByRoom, updateBed };