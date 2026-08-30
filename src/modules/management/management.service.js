const bcrypt = require("bcrypt");
const prisma = require("../../config/db");
const { recordAudit } = require("../../common/audit.service");
const fail = (message, status, code) => { const error = new Error(message); error.status = status; error.code = code; throw error; };
const formatUser = (user) => ({ id: user.id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, tenantId: user.tenant_id?.toString() || null, createdAt: user.created_at });
const formatItem = (item) => ({ id: item.id.toString(), propertyId: item.property_id.toString(), name: item.name, category: item.category, unit: item.unit, currentStock: item.current_stock.toString(), minStockLevel: item.min_stock_level.toString(), costPerUnit: item.cost_per_unit?.toString() || null, status: item.status, lowStock: Number(item.current_stock) <= Number(item.min_stock_level) });

const createUser = async (tenantId, data, actor, req) => {
  const existing = await prisma.users.findUnique({ where: { email: data.email } });
  if (existing) fail("Email already registered", 409, "EMAIL_EXISTS");
  const user = await prisma.users.create({ data: { tenant_id: BigInt(tenantId), name: data.name, email: data.email, phone: data.phone || null, password_hash: await bcrypt.hash(data.password, 10), role: data.role, status: "ACTIVE" } });
  await recordAudit({ tenantId, userId: actor.userId, action: "USER_CREATED", entityType: "USER", entityId: user.id, newValues: { role: user.role, email: user.email }, req });
  return formatUser(user);
};
const listUsers = async (tenantId, role) => (await prisma.users.findMany({ where: { tenant_id: BigInt(tenantId), ...(role ? { role } : { role: { in: ["MANAGER", "RECEPTIONIST", "STAFF"] } }) }, orderBy: { created_at: "desc" } })).map(formatUser);
const updateUserStatus = async (tenantId, userId, status, actor, req) => {
  const user = await prisma.users.findFirst({ where: { id: BigInt(userId), tenant_id: BigInt(tenantId) } });
  if (!user) fail("User not found", 404, "NOT_FOUND");
  if (user.id.toString() === String(actor.userId) && status !== "ACTIVE") fail("You cannot deactivate your own account", 409, "INVALID_OPERATION");
  const updated = await prisma.users.update({ where: { id: user.id }, data: { status, updated_at: new Date() } });
  await recordAudit({ tenantId, userId: actor.userId, action: "USER_STATUS_CHANGED", entityType: "USER", entityId: user.id, oldValues: { status: user.status }, newValues: { status }, req });
  return formatUser(updated);
};

const createItem = async (tenantId, data, actor, req) => {
  const property = await prisma.properties.findFirst({ where: { id: BigInt(data.propertyId), tenant_id: BigInt(tenantId) } });
  if (!property) fail("Property not found", 404, "PROPERTY_NOT_FOUND");
  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.inventory_items.create({ data: { tenant_id: BigInt(tenantId), property_id: property.id, name: data.name, category: data.category, unit: data.unit, current_stock: data.openingStock.toFixed(2), min_stock_level: data.minStockLevel.toFixed(2), cost_per_unit: data.costPerUnit?.toFixed(2) || null, status: "ACTIVE" } });
    if (data.openingStock > 0) await tx.inventory_transactions.create({ data: { tenant_id: BigInt(tenantId), item_id: created.id, type: "IN", quantity: data.openingStock.toFixed(2), notes: "Opening stock", performed_by: BigInt(actor.userId) } });
    await recordAudit({ tenantId, userId: actor.userId, action: "INVENTORY_ITEM_CREATED", entityType: "INVENTORY_ITEM", entityId: created.id, newValues: { name: created.name, currentStock: data.openingStock }, req, client: tx });
    return created;
  });
  return formatItem(item);
};
const listItems = async (tenantId, propertyId) => (await prisma.inventory_items.findMany({ where: { tenant_id: BigInt(tenantId), ...(propertyId ? { property_id: BigInt(propertyId) } : {}) }, orderBy: { name: "asc" } })).map(formatItem);
const adjustStock = async (tenantId, itemId, data, actor, req) => {
  const item = await prisma.$transaction(async (tx) => {
    const current = await tx.inventory_items.findFirst({ where: { id: BigInt(itemId), tenant_id: BigInt(tenantId), status: "ACTIVE" } });
    if (!current) fail("Inventory item not found", 404, "NOT_FOUND");
    const currentStock = Number(current.current_stock); const delta = data.type === "IN" ? data.quantity : data.type === "OUT" ? -data.quantity : data.quantity;
    if (currentStock + delta < 0) fail("Stock cannot become negative", 409, "INSUFFICIENT_STOCK");
    const updated = await tx.inventory_items.update({ where: { id: current.id }, data: { current_stock: (currentStock + delta).toFixed(2), updated_at: new Date() } });
    await tx.inventory_transactions.create({ data: { tenant_id: BigInt(tenantId), item_id: current.id, type: data.type, quantity: Math.abs(data.quantity).toFixed(2), notes: data.notes || null, performed_by: BigInt(actor.userId) } });
    await recordAudit({ tenantId, userId: actor.userId, action: "INVENTORY_STOCK_CHANGED", entityType: "INVENTORY_ITEM", entityId: current.id, oldValues: { currentStock }, newValues: { currentStock: currentStock + delta, type: data.type }, req, client: tx });
    return updated;
  }, { isolationLevel: "Serializable" });
  return formatItem(item);
};
const stockHistory = async (tenantId, itemId) => (await prisma.inventory_transactions.findMany({ where: { tenant_id: BigInt(tenantId), item_id: BigInt(itemId) }, orderBy: { created_at: "desc" }, take: 100 })).map((entry) => ({ id: entry.id.toString(), type: entry.type, quantity: entry.quantity.toString(), notes: entry.notes, performedBy: entry.performed_by.toString(), createdAt: entry.created_at }));
module.exports = { createUser, listUsers, updateUserStatus, createItem, listItems, adjustStock, stockHistory };
