/* ─────────────────────────────────────────────────────────────────────────
   src/modules/booking/booking.controller.js
───────────────────────────────────────────────────────────────────────── */
const svc = require("./booking.service");

const createBooking = async (req, res, next) => {
    try {
        const data = await svc.createBooking(req.body);
        res.status(201).json({ success: true, message: "Booking created. Awaiting owner confirmation.", data });
    } catch (err) { next(err); }
};

const getBookingByCode = async (req, res, next) => {
    try {
        const data = await svc.getBookingByCode(req.params.code);
        res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
};

const confirmBooking = async (req, res, next) => {
    try {
        // tenantId comes from JWT (once auth is fully wired) or body for now
        const tenantId = req.user?.tenantId || req.body.tenantId;
        if (!tenantId) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "tenantId required" });
        const data = await svc.confirmBooking(req.params.code, tenantId);
        res.status(200).json({ success: true, message: "Booking confirmed", data });
    } catch (err) { next(err); }
};

const rejectBooking = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId || req.body.tenantId;
        const { reason } = req.body;
        if (!tenantId) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "tenantId required" });
        const data = await svc.rejectBooking(req.params.code, tenantId, reason);
        res.status(200).json({ success: true, message: "Booking rejected", data });
    } catch (err) { next(err); }
};

const cancelBooking = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const data = await svc.cancelBooking(req.params.code, reason);
        res.status(200).json({ success: true, message: "Booking cancelled", data });
    } catch (err) { next(err); }
};

const listOwnerBookings = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId || req.query.tenantId;
        if (!tenantId) return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "tenantId required" });
        const result = await svc.listOwnerBookings({ tenantId, ...req.query });
        res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
};

module.exports = { createBooking, getBookingByCode, confirmBooking, rejectBooking, cancelBooking, listOwnerBookings };