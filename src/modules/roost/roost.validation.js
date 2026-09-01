/* ─────────────────────────────────────────────────────────────────────────
   src/modules/roost/roost.validation.js
───────────────────────────────────────────────────────────────────────── */
const { z } = require("zod");

const createGuestSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(255),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Invalid email address").optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  idProofType: z.string().trim().optional().nullable(),
  idProofNumber: z.string().trim().optional().nullable(),
  idProofPhoto: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  nationality: z.string().trim().default("Indian").optional(),
  dateOfBirth: z.string().optional().nullable(),
  emergencyContactName: z.string().trim().optional().nullable(),
  emergencyContactPhone: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const updateGuestSchema = createGuestSchema.partial();

const createBookingSchema = z.object({
  guestId: z.union([z.string(), z.number()]),
  propertyId: z.union([z.string(), z.number()]),
  roomId: z.union([z.string(), z.number()]),
  bedId: z.union([z.string(), z.number()]),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "checkIn must be YYYY-MM-DD"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "checkOut must be YYYY-MM-DD"),
  totalAmount: z.number().nonnegative().optional(),
  source: z.string().default("WEB").optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().trim().optional(),
});

const createPaymentSchema = z.object({
  bookingId: z.union([z.string(), z.number()]),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "ONLINE"]),
  transactionRef: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const createRefundSchema = z.object({
  paymentId: z.union([z.string(), z.number()]),
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().trim().min(5, "Reason must be at least 5 characters"),
});

const createComplaintSchema = z.object({
  bookingId: z.union([z.string(), z.number()]).optional().nullable(),
  category: z.enum(["CLEANLINESS", "NOISE", "MAINTENANCE", "SERVICE", "FOOD", "SAFETY", "OTHER"]).optional().default("OTHER"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
});

const updateComplaintSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  assignedTo: z.union([z.string(), z.number()]).optional().nullable(),
  resolution: z.string().trim().optional().nullable(),
});

const createFeedbackSchema = z.object({
  bookingId: z.union([z.string(), z.number()]).optional().nullable(),
  overallRating: z.number().int().min(1).max(5),
  cleanlinessRating: z.number().int().min(1).max(5).optional().nullable(),
  serviceRating: z.number().int().min(1).max(5).optional().nullable(),
  valueRating: z.number().int().min(1).max(5).optional().nullable(),
  comment: z.string().trim().optional().nullable(),
});

const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["MANAGER", "RECEPTIONIST", "STAFF"]),
});

const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional().nullable(),
  role: z.enum(["MANAGER", "RECEPTIONIST", "STAFF"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

const createInventorySchema = z.object({
  propertyId: z.union([z.string(), z.number()]),
  name: z.string().trim().min(1),
  category: z.enum(["RECURRING", "NON_RECURRING"]).default("NON_RECURRING"),
  unit: z.string().trim().default("PIECE").optional(),
  openingStock: z.number().nonnegative().default(0).optional(),
  minStockLevel: z.number().nonnegative().default(0).optional(),
  costPerUnit: z.number().nonnegative().optional().nullable(),
});

const updateInventorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  minStock: z.number().nonnegative().optional(),
  costPerUnit: z.number().nonnegative().optional().nullable(),
});

const updateSettingsSchema = z.record(z.any());

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional().nullable(),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  emailOrPhone: z.string().trim().optional(),
}).refine((data) => data.email || data.phone || data.emailOrPhone, {
  message: "Either email or phone is required",
});

module.exports = {
  createGuestSchema,
  updateGuestSchema,
  createBookingSchema,
  cancelBookingSchema,
  createPaymentSchema,
  createRefundSchema,
  createComplaintSchema,
  updateComplaintSchema,
  createFeedbackSchema,
  createStaffSchema,
  updateStaffSchema,
  createInventorySchema,
  updateInventorySchema,
  updateSettingsSchema,
  updateProfileSchema,
  forgotPasswordSchema,
};
