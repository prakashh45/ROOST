const { z } = require("zod");
const id = z.union([z.string().regex(/^\d+$/), z.number().int().positive()]);
const createUserSchema = z.object({ name: z.string().min(2).max(255), email: z.string().email(), phone: z.string().regex(/^[6-9]\d{9}$/).optional(), password: z.string().min(8).max(128), role: z.enum(["MANAGER", "RECEPTIONIST", "STAFF"]) });
const userStatusSchema = z.object({ status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]) });
const itemSchema = z.object({ propertyId: id, name: z.string().min(2).max(255), category: z.enum(["RECURRING", "NON_RECURRING"]), unit: z.string().min(1).max(30).default("PIECE"), openingStock: z.coerce.number().min(0).default(0), minStockLevel: z.coerce.number().min(0).default(0), costPerUnit: z.coerce.number().min(0).optional() });
const stockSchema = z.object({ type: z.enum(["IN", "OUT", "ADJUSTMENT"]), quantity: z.coerce.number().refine((value) => value !== 0, "Quantity cannot be zero"), notes: z.string().max(2000).optional() });
module.exports = { createUserSchema, userStatusSchema, itemSchema, stockSchema };
