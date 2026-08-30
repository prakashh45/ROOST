const crypto = require("crypto");
const prisma = require("../../config/db");
const { recordAudit } = require("../../common/audit.service");
const fail = (message, status, code) => { const error = new Error(message); error.status = status; error.code = code; throw error; };
const code = (prefix) => `${prefix}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
const formatPayment = (payment) => ({ id: payment.id.toString(), bookingId: payment.booking_id.toString(), paymentCode: payment.payment_code, amount: payment.amount.toString(), method: payment.method, status: payment.status, transactionRef: payment.transaction_ref, paidAt: payment.paid_at, createdAt: payment.created_at });
const formatRefund = (refund) => ({ id: refund.id.toString(), paymentId: refund.payment_id.toString(), bookingId: refund.booking_id.toString(), refundCode: refund.refund_code, amount: refund.amount.toString(), reason: refund.reason, status: refund.status, processedAt: refund.processed_at });
const formatInvoice = (invoice) => ({ id: invoice.id.toString(), bookingId: invoice.booking_id.toString(), paymentId: invoice.payment_id?.toString() || null, invoiceNumber: invoice.invoice_number, subtotal: invoice.subtotal.toString(), taxAmount: invoice.tax_amount.toString(), totalAmount: invoice.total_amount.toString(), status: invoice.status, issuedAt: invoice.issued_at });

const updateBookingPaymentStatus = async (tx, booking) => {
  const [paid, refunded] = await Promise.all([
    tx.payments.aggregate({ where: { booking_id: booking.id, status: "COMPLETED" }, _sum: { amount: true } }),
    tx.refunds.aggregate({ where: { booking_id: booking.id, status: { in: ["APPROVED", "PROCESSED"] } }, _sum: { amount: true } }),
  ]);
  const net = Number(paid._sum.amount || 0) - Number(refunded._sum.amount || 0);
  const total = Number(booking.total_amount);
  const paymentStatus = net <= 0 ? "UNPAID" : net >= total ? "PAID" : "PARTIALLY_PAID";
  return tx.bookings.update({ where: { id: booking.id }, data: { payment_status: paymentStatus, updated_at: new Date() } });
};

const collectPayment = async (tenantId, data, actor, req) => {
  const payment = await prisma.$transaction(async (tx) => {
    const booking = await tx.bookings.findFirst({ where: { id: BigInt(data.bookingId), tenant_id: BigInt(tenantId) } });
    if (!booking) fail("Booking not found", 404, "NOT_FOUND");
    if (!["CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(booking.status)) fail("Payments can only be collected for confirmed bookings", 409, "INVALID_PAYMENT_STATE");
    const prior = await tx.payments.aggregate({ where: { booking_id: booking.id, status: "COMPLETED" }, _sum: { amount: true } });
    if (Number(prior._sum.amount || 0) + data.amount > Number(booking.total_amount)) fail("Payment exceeds the outstanding booking balance", 409, "PAYMENT_EXCEEDS_BALANCE");
    const created = await tx.payments.create({ data: { tenant_id: BigInt(tenantId), booking_id: booking.id, payment_code: code("PAY"), amount: data.amount.toFixed(2), method: data.method, status: "COMPLETED", received_by: BigInt(actor.userId), transaction_ref: data.transactionRef || null, notes: data.notes || null, paid_at: new Date() } });
    await tx.invoices.create({ data: { tenant_id: BigInt(tenantId), booking_id: booking.id, payment_id: created.id, invoice_number: code("RCT"), subtotal: created.amount, tax_amount: "0", total_amount: created.amount, status: "PAID", issued_at: new Date() } });
    await updateBookingPaymentStatus(tx, booking);
    await recordAudit({ tenantId, userId: actor.userId, action: "PAYMENT_COLLECTED", entityType: "PAYMENT", entityId: created.id, newValues: { amount: data.amount, bookingId: data.bookingId }, req, client: tx });
    return created;
  }, { isolationLevel: "Serializable" });
  return formatPayment(payment);
};

const listPayments = async (tenantId, bookingId) => (await prisma.payments.findMany({ where: { tenant_id: BigInt(tenantId), ...(bookingId ? { booking_id: BigInt(bookingId) } : {}) }, orderBy: { created_at: "desc" } })).map(formatPayment);
const getInvoice = async (tenantId, invoiceNumber) => {
  const invoice = await prisma.invoices.findFirst({ where: { tenant_id: BigInt(tenantId), invoice_number: invoiceNumber } });
  if (!invoice) fail("Invoice not found", 404, "NOT_FOUND");
  return formatInvoice(invoice);
};

const requestRefund = async (tenantId, data, actor, req) => {
  const refund = await prisma.$transaction(async (tx) => {
    const payment = await tx.payments.findFirst({ where: { id: BigInt(data.paymentId), tenant_id: BigInt(tenantId), status: "COMPLETED" } });
    if (!payment) fail("Completed payment not found", 404, "PAYMENT_NOT_FOUND");
    const committed = await tx.refunds.aggregate({ where: { payment_id: payment.id, status: { in: ["PENDING", "APPROVED", "PROCESSED"] } }, _sum: { amount: true } });
    if (Number(committed._sum.amount || 0) + data.amount > Number(payment.amount)) fail("Refund exceeds the eligible payment amount", 409, "REFUND_EXCEEDS_ELIGIBLE_AMOUNT");
    const created = await tx.refunds.create({ data: { tenant_id: BigInt(tenantId), payment_id: payment.id, booking_id: payment.booking_id, refund_code: code("RFD"), amount: data.amount.toFixed(2), reason: data.reason, status: "PENDING" } });
    await recordAudit({ tenantId, userId: actor.userId, action: "REFUND_REQUESTED", entityType: "REFUND", entityId: created.id, newValues: { amount: data.amount, paymentId: data.paymentId }, req, client: tx });
    return created;
  }, { isolationLevel: "Serializable" });
  return formatRefund(refund);
};

const decideRefund = async (tenantId, refundId, action, actor, req) => {
  const refund = await prisma.$transaction(async (tx) => {
    const current = await tx.refunds.findFirst({ where: { id: BigInt(refundId), tenant_id: BigInt(tenantId) } });
    if (!current) fail("Refund not found", 404, "NOT_FOUND");
    if (current.status !== "PENDING") fail("Only pending refunds can be decided", 409, "INVALID_TRANSITION");
    if (action === "APPROVE") {
      const payment = await tx.payments.findUnique({ where: { id: current.payment_id } });
      const committed = await tx.refunds.aggregate({ where: { payment_id: current.payment_id, status: { in: ["APPROVED", "PROCESSED"] } }, _sum: { amount: true } });
      if (Number(committed._sum.amount || 0) + Number(current.amount) > Number(payment.amount)) fail("Refund exceeds the eligible payment amount", 409, "REFUND_EXCEEDS_ELIGIBLE_AMOUNT");
    }
    const updated = await tx.refunds.update({ where: { id: current.id }, data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED", approved_by: BigInt(actor.userId), processed_at: action === "APPROVE" ? new Date() : null, updated_at: new Date() } });
    if (action === "APPROVE") { const booking = await tx.bookings.findUnique({ where: { id: current.booking_id } }); await updateBookingPaymentStatus(tx, booking); }
    await recordAudit({ tenantId, userId: actor.userId, action: `REFUND_${action}D`, entityType: "REFUND", entityId: updated.id, newValues: { status: updated.status }, req, client: tx });
    return updated;
  }, { isolationLevel: "Serializable" });
  return formatRefund(refund);
};

module.exports = { collectPayment, listPayments, getInvoice, requestRefund, decideRefund };
