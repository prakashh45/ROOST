/* ─────────────────────────────────────────────────────────────────────────
   src/modules/property/property.controller.js
───────────────────────────────────────────────────────────────────────── */
const svc = require("./property.service");

const searchProperties = async (req, res, next) => {
    try {
        const result = await svc.searchProperties(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
};

const getPropertyBySlug = async (req, res, next) => {
    try {
        const data = await svc.getPropertyBySlug(req.params.slug);
        res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
};

const getPropertyAvailability = async (req, res, next) => {
    try {
        const { slug }               = req.params;
        const { checkIn, checkOut }  = req.query;
        const data = await svc.getPropertyAvailability(slug, checkIn, checkOut);
        res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
};

const createProperty = async (req, res, next) => {
    try {
        const data = await svc.createProperty(req.body);
        res.status(201).json({ success: true, message: "Property created", data });
    } catch (err) { next(err); }
};

const updateProperty = async (req, res, next) => {
    try {
        const { tenantId, ...rest } = req.body;
        const data = await svc.updateProperty(req.params.propertyId, tenantId, rest);
        res.status(200).json({ success: true, message: "Property updated", data });
    } catch (err) { next(err); }
};

const getMyProperties = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;

        const data = await svc.getMyProperties(tenantId);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        next(err);
    }
};

const updatePropertyStatus = async (req, res, next) => {
    try {
        const { tenantId, status } = req.body;
        const data = await svc.updatePropertyStatus(req.params.propertyId, tenantId, status);
        res.status(200).json({ success: true, message: "Status updated", data });
    } catch (err) { next(err); }
};

module.exports = {
    searchProperties,
    getPropertyBySlug,
    getPropertyAvailability,
    createProperty,
    updateProperty,
    updatePropertyStatus,
    getMyProperties,
};