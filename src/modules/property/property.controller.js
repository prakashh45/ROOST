/* ─────────────────────────────────────────────────────────────────────────
   src/modules/property/property.controller.js
───────────────────────────────────────────────────────────────────────── */

const svc = require("./property.service");

const searchProperties = async (req, res, next) => {
    try {
        const result = await svc.searchProperties(req.query);
        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (err) {
        next(err);
    }
};

const getPropertyBySlug = async (req, res, next) => {
    try {
        const data = await svc.getPropertyBySlug(req.params.slug);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        next(err);
    }
};

const getPropertyAvailability = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { checkIn, checkOut } = req.query;

        const data = await svc.getPropertyAvailability(
            slug,
            checkIn,
            checkOut
        );

        res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        next(err);
    }
};


/* ─────────────────────────────────────────────────────────────────────────
   CREATE PROPERTY
───────────────────────────────────────────────────────────────────────── */

const createProperty = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            const err = new Error(
                "User is not associated with a tenant"
            );

            err.status = 400;
            err.code = "TENANT_REQUIRED";

            throw err;
        }

        const payload = {
            ...req.body,
            tenantId,
        };

        console.log("CREATE PROPERTY PAYLOAD:", payload);

        const data = await svc.createProperty(payload);

        res.status(201).json({
            success: true,
            message: "Property created",
            data,
        });
    } catch (err) {
        next(err);
    }
};


/* ─────────────────────────────────────────────────────────────────────────
   UPDATE PROPERTY
───────────────────────────────────────────────────────────────────────── */

const updateProperty = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            const err = new Error(
                "User is not associated with a tenant"
            );

            err.status = 400;
            err.code = "TENANT_REQUIRED";

            throw err;
        }

        const {
            tenantId: bodyTenantId,
            ...rest
        } = req.body;

        const data = await svc.updateProperty(
            req.params.propertyId,
            tenantId,
            rest
        );

        res.status(200).json({
            success: true,
            message: "Property updated",
            data,
        });
    } catch (err) {
        next(err);
    }
};


/* ─────────────────────────────────────────────────────────────────────────
   GET MY PROPERTIES
───────────────────────────────────────────────────────────────────────── */

const getMyProperties = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            const err = new Error(
                "User is not associated with a tenant"
            );

            err.status = 400;
            err.code = "TENANT_REQUIRED";

            throw err;
        }

        const data = await svc.getMyProperties(tenantId);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        next(err);
    }
};


/* ─────────────────────────────────────────────────────────────────────────
   UPDATE PROPERTY STATUS
───────────────────────────────────────────────────────────────────────── */

const updatePropertyStatus = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            const err = new Error(
                "User is not associated with a tenant"
            );

            err.status = 400;
            err.code = "TENANT_REQUIRED";

            throw err;
        }

        const { status } = req.body;

        const data = await svc.updatePropertyStatus(
            req.params.propertyId,
            tenantId,
            status
        );

        res.status(200).json({
            success: true,
            message: "Status updated",
            data,
        });
    } catch (err) {
        next(err);
    }
};


const deleteProperty = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;

        if (!tenantId) {
            const err = new Error("Tenant is required");
            err.status = 400;
            err.code = "TENANT_REQUIRED";
            throw err;
        }

        const data = await svc.deleteProperty(
            req.params.propertyId,
            tenantId
        );

        res.status(200).json({
            success: true,
            message: "Property deleted",
            data,
        });
    } catch (err) {
        next(err);
    }
};


/* ─────────────────────────────────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────────────────────────────────── */

module.exports = {
    searchProperties,
    getPropertyBySlug,
    getPropertyAvailability,
    createProperty,
    updateProperty,
    updatePropertyStatus,
    getMyProperties,
    deleteProperty,
};