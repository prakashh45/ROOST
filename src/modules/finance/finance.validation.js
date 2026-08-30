const { z } = require("zod");
const id = z.union([z.string().regex(/^\d+$/), z.number().int().positive()]);
const money = z.coerce.number().positive().max(10000000);
const collectPaymentSchema = z.object({ bookingId: id, amount: money, method: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "ONLINE"]), transactionRef: z.string().max(255).optional(), notes: z.string().max(2000).optional() });
const requestRefundSchema = z.object({ paymentId: id, amount: money, reason: z.string().min(5).max(2000) });
const approveRefundSchema = z.object({ action: z.enum(["APPROVE", "REJECT"]) });
module.exports = { collectPaymentSchema, requestRefundSchema, approveRefundSchema };
