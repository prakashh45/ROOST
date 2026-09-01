const { z } = require("zod");

const id = z.union([z.string().regex(/^\d+$/), z.number().int().positive()]);
const managementRoles = ["OWNER", "PLATFORM_ADMIN", "MANAGER", "RECEPTIONIST", "STAFF"];

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  password: z.string().min(12).max(128),
  role: z.enum(managementRoles),
  // PLATFORM_ADMIN accounts are global. Other management accounts need a
  // tenant; platform-admin callers may select one explicitly.
  tenantId: id.optional(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).nullable().optional(),
  role: z.enum(managementRoles).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  tenantId: id.nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

const userStatusSchema = z.object({ status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]) });
const passwordResetSchema = z.object({ temporaryPassword: z.string().min(12).max(128) });
const itemSchema = z.object({ propertyId: id, name: z.string().min(2).max(255), category: z.enum(["RECURRING", "NON_RECURRING"]), unit: z.string().min(1).max(30).default("PIECE"), openingStock: z.coerce.number().min(0).default(0), minStockLevel: z.coerce.number().min(0).default(0), costPerUnit: z.coerce.number().min(0).optional() });
const stockSchema = z.object({ type: z.enum(["IN", "OUT", "ADJUSTMENT"]), quantity: z.coerce.number().refine((value) => value !== 0, "Quantity cannot be zero"), notes: z.string().max(2000).optional() });

module.exports = { createUserSchema, updateUserSchema, userStatusSchema, passwordResetSchema, itemSchema, stockSchema };
