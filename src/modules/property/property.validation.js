/* ─────────────────────────────────────────────────────────────────────────
   src/modules/property/property.validation.js
───────────────────────────────────────────────────────────────────────── */
const { z } = require("zod");

const createPropertySchema = z.object({
    tenantId:    z.union([z.string(), z.number()]),
    name:        z.string().min(2).max(255),
    slug:        z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
    description: z.string().optional(),
    address:     z.string().optional(),
    city:        z.string().max(100).optional(),
    state:       z.string().max(100).optional(),
    postalCode:  z.string().max(20).optional(),
    latitude:    z.number().min(-90).max(90).optional(),
    longitude:   z.number().min(-180).max(180).optional(),
});

const updatePropertySchema = z.object({
    tenantId:    z.union([z.string(), z.number()]),
    name:        z.string().min(2).max(255).optional(),
    description: z.string().optional(),
    address:     z.string().optional(),
    city:        z.string().max(100).optional(),
    state:       z.string().max(100).optional(),
    postalCode:  z.string().max(20).optional(),
    latitude:    z.number().min(-90).max(90).optional(),
    longitude:   z.number().min(-180).max(180).optional(),
});

const updatePropertyStatusSchema = z.object({
    tenantId: z.union([z.string(), z.number()]),
    status:   z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"]),
});

module.exports = { createPropertySchema, updatePropertySchema, updatePropertyStatusSchema };
