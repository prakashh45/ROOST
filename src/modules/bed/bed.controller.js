/* ─────────────────────────────────────────────────────────────────────────
   src/modules/bed/bed.controller.js
───────────────────────────────────────────────────────────────────────── */
const svc = require("./bed.service");

const createBed = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const bed = await svc.createBed({ roomId, ...req.body });
        res.status(201).json({ success: true, message: "Bed created", data: bed });
    } catch (err) { next(err); }
};

const getBedsByRoom = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const tenantId   = req.query.tenantId || req.body.tenantId;
        if (!tenantId) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "tenantId required" });
        const beds = await svc.getBedsByRoom(roomId, tenantId);
        res.status(200).json({ success: true, data: beds });
    } catch (err) { next(err); }
};

const updateBed = async (req, res, next) => {
    try {
        const { bedId } = req.params;
        const { tenantId, ...rest } = req.body;

        const bed = await svc.updateBed(
            bedId,
            tenantId,
            rest
        );

        res.status(200).json({
            success: true,
            message: "Bed updated",
            data: bed,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { createBed, getBedsByRoom, updateBed };