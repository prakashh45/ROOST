const bcrypt = require("bcrypt");
const prisma = require("../../config/db");
const { recordAudit } = require("../../common/audit.service");

const fail = (message, status, code) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  throw error;
};

const MANAGEMENT_ROLES = ["OWNER", "PLATFORM_ADMIN", "MANAGER", "RECEPTIONIST", "STAFF"];
const PLATFORM_ROLES = new Set(["PLATFORM_ADMIN", "ADMIN"]);

const toId = (value, label = "ID") => {
  try {
    const id = BigInt(value);
    if (id <= 0n) throw new Error();
    return id;
  } catch (_error) {
    fail(`${label} must be a positive numeric ID`, 400, "INVALID_ID");
  }
};

const formatUser = (user) => ({
  id: user.id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  tenantId: user.tenant_id?.toString() || null,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const formatItem = (item) => ({
  id: item.id.toString(),
  propertyId: item.property_id.toString(),
  name: item.name,
  category: item.category,
  unit: item.unit,
  currentStock: item.current_stock.toString(),
  minStockLevel: item.min_stock_level.toString(),
  costPerUnit: item.cost_per_unit?.toString() || null,
  status: item.status,
  lowStock: Number(item.current_stock) <= Number(item.min_stock_level),
});

const assertTenant = (tenantId) => {
  if (tenantId === null || tenantId === undefined || tenantId === "") {
    fail("A tenant is required for this operation", 400, "TENANT_REQUIRED");
  }
  return toId(tenantId, "Tenant ID");
};

const assertRoleAssignment = (actor, targetRole) => {
  if (PLATFORM_ROLES.has(actor.role)) return;

  const allowed = actor.role === "OWNER"
    ? ["MANAGER", "RECEPTIONIST", "STAFF"]
    : actor.role === "MANAGER"
      ? ["RECEPTIONIST", "STAFF"]
      : [];

  if (!allowed.includes(targetRole)) {
    fail("You cannot assign that role", 403, "ROLE_ASSIGNMENT_FORBIDDEN");
  }
};

const resolveTenant = (data, actor, inheritedTenantId) => {
  if (data.role === "PLATFORM_ADMIN") {
    if (data.tenantId !== undefined && data.tenantId !== null) {
      fail("PLATFORM_ADMIN accounts cannot belong to a tenant", 400, "INVALID_TENANT_ASSIGNMENT");
    }
    return null;
  }

  if (data.tenantId !== undefined && data.tenantId !== null) {
    if (!PLATFORM_ROLES.has(actor.role)) {
      fail("Only a platform administrator can select another tenant", 403, "TENANT_SCOPE_FORBIDDEN");
    }
    return toId(data.tenantId, "Tenant ID");
  }

  return assertTenant(inheritedTenantId ?? actor.tenantId);
};

const createUser = async (tenantId, data, actor, req) => {
  assertRoleAssignment(actor, data.role);
  const targetTenantId = resolveTenant(data, actor, tenantId);
  const existing = await prisma.users.findUnique({ where: { email: data.email } });
  if (existing) fail("Email already registered", 409, "EMAIL_EXISTS");

  const user = await prisma.users.create({
    data: {
      tenant_id: targetTenantId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      password_hash: await bcrypt.hash(data.password, 12),
      role: data.role,
      status: "ACTIVE",
    },
  });

  await recordAudit({
    tenantId: targetTenantId,
    userId: actor.userId,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: user.id,
    newValues: { role: user.role, email: user.email },
    req,
  });
  return formatUser(user);
};

const listUsers = async (tenantId, role, options = {}) => {
  if (role && !MANAGEMENT_ROLES.includes(role)) {
    fail("Invalid role filter", 400, "VALIDATION_ERROR");
  }

  const scopedTenantId = options.allTenants ? undefined : assertTenant(tenantId);
  const requestedTenantId = options.requestedTenantId === undefined
    ? scopedTenantId
    : options.requestedTenantId === null
      ? null
      : toId(options.requestedTenantId, "Tenant ID");
  const where = {
    role: role ? role : { in: MANAGEMENT_ROLES },
    ...(options.allTenants && options.requestedTenantId === undefined ? {} : { tenant_id: requestedTenantId }),
  };

  const users = await prisma.users.findMany({ where, orderBy: { created_at: "desc" } });
  return users.map(formatUser);
};

const findUserInScope = async (tenantId, userId, allTenants = false) => {
  const where = {
    id: toId(userId, "User ID"),
    role: { in: MANAGEMENT_ROLES },
    ...(allTenants ? {} : { tenant_id: assertTenant(tenantId) }),
  };
  const user = await prisma.users.findFirst({ where });
  if (!user) fail("User not found", 404, "NOT_FOUND");
  return user;
};

const assertUserMutation = (actor, current, data) => {
  if (!PLATFORM_ROLES.has(actor.role)) {
    if (!["RECEPTIONIST", "STAFF"].includes(current.role)) {
      fail("You can only manage receptionist and staff accounts", 403, "ROLE_SCOPE_FORBIDDEN");
    }
    if (data.role && !["RECEPTIONIST", "STAFF"].includes(data.role)) {
      fail("You cannot assign that role", 403, "ROLE_ASSIGNMENT_FORBIDDEN");
    }
  }

  if (String(current.id) === String(actor.userId) && data.status && data.status !== "ACTIVE") {
    fail("You cannot deactivate your own account", 409, "INVALID_OPERATION");
  }
  if (String(current.id) === String(actor.userId) && data.role && data.role !== current.role) {
    fail("You cannot change your own role", 409, "INVALID_OPERATION");
  }
};

const updateUser = async (tenantId, userId, data, actor, req, options = {}) => {
  const current = await findUserInScope(tenantId, userId, options.allTenants);
  assertUserMutation(actor, current, data);

  if (data.email && data.email !== current.email) {
    const existing = await prisma.users.findUnique({ where: { email: data.email } });
    if (existing) fail("Email already registered", 409, "EMAIL_EXISTS");
  }

  let targetTenantId = current.tenant_id;
  if (data.role === "PLATFORM_ADMIN") {
    if (data.tenantId !== undefined && data.tenantId !== null) {
      fail("PLATFORM_ADMIN accounts cannot belong to a tenant", 400, "INVALID_TENANT_ASSIGNMENT");
    }
    targetTenantId = null;
  } else if (data.tenantId !== undefined) {
    if (!PLATFORM_ROLES.has(actor.role)) {
      fail("Only a platform administrator can change tenant assignment", 403, "TENANT_SCOPE_FORBIDDEN");
    }
    targetTenantId = data.tenantId === null ? null : toId(data.tenantId, "Tenant ID");
  } else if (current.role === "PLATFORM_ADMIN" && data.role && data.role !== "PLATFORM_ADMIN") {
    fail("A tenant is required when changing a platform administrator to a tenant role", 400, "TENANT_REQUIRED");
  }
  if ((data.role || current.role) !== "PLATFORM_ADMIN" && targetTenantId === null) {
    fail("Tenant management accounts require a tenant", 400, "TENANT_REQUIRED");
  }

  const updateData = { updated_at: new Date(), tenant_id: targetTenantId };
  for (const field of ["name", "email", "phone", "role", "status"]) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const updated = await prisma.users.update({ where: { id: current.id }, data: updateData });
  await recordAudit({
    tenantId: updated.tenant_id,
    userId: actor.userId,
    action: "USER_UPDATED",
    entityType: "USER",
    entityId: updated.id,
    oldValues: { name: current.name, email: current.email, role: current.role, status: current.status, tenantId: current.tenant_id?.toString() || null },
    newValues: { name: updated.name, email: updated.email, role: updated.role, status: updated.status, tenantId: updated.tenant_id?.toString() || null },
    req,
  });
  return formatUser(updated);
};

const updateUserStatus = (tenantId, userId, status, actor, req, options = {}) =>
  updateUser(tenantId, userId, { status }, actor, req, options);

const resetUserPassword = async (tenantId, userId, temporaryPassword, actor, req, options = {}) => {
  const current = await findUserInScope(tenantId, userId, options.allTenants);
  assertUserMutation(actor, current, {});
  await prisma.users.update({
    where: { id: current.id },
    data: { password_hash: await bcrypt.hash(temporaryPassword, 12), updated_at: new Date() },
  });
  await recordAudit({ tenantId: current.tenant_id, userId: actor.userId, action: "USER_PASSWORD_RESET", entityType: "USER", entityId: current.id, req });
  return { id: current.id.toString(), passwordReset: true };
};

const createItem = async (tenantId, data, actor, req) => {
  const tenant = assertTenant(tenantId);
  const property = await prisma.properties.findFirst({ where: { id: toId(data.propertyId, "Property ID"), tenant_id: tenant } });
  if (!property) fail("Property not found", 404, "PROPERTY_NOT_FOUND");
  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.inventory_items.create({ data: { tenant_id: tenant, property_id: property.id, name: data.name, category: data.category, unit: data.unit, current_stock: data.openingStock.toFixed(2), min_stock_level: data.minStockLevel.toFixed(2), cost_per_unit: data.costPerUnit?.toFixed(2) || null, status: "ACTIVE" } });
    if (data.openingStock > 0) await tx.inventory_transactions.create({ data: { tenant_id: tenant, item_id: created.id, type: "IN", quantity: data.openingStock.toFixed(2), notes: "Opening stock", performed_by: toId(actor.userId, "Actor ID") } });
    await recordAudit({ tenantId: tenant, userId: actor.userId, action: "INVENTORY_ITEM_CREATED", entityType: "INVENTORY_ITEM", entityId: created.id, newValues: { name: created.name, currentStock: data.openingStock }, req, client: tx });
    return created;
  });
  return formatItem(item);
};

const listItems = async (tenantId, propertyId) => (await prisma.inventory_items.findMany({ where: { tenant_id: assertTenant(tenantId), ...(propertyId ? { property_id: toId(propertyId, "Property ID") } : {}) }, orderBy: { name: "asc" } })).map(formatItem);

const adjustStock = async (tenantId, itemId, data, actor, req) => {
  const tenant = assertTenant(tenantId);
  const item = await prisma.$transaction(async (tx) => {
    const current = await tx.inventory_items.findFirst({ where: { id: toId(itemId, "Item ID"), tenant_id: tenant, status: "ACTIVE" } });
    if (!current) fail("Inventory item not found", 404, "NOT_FOUND");
    const currentStock = Number(current.current_stock); const delta = data.type === "IN" ? data.quantity : data.type === "OUT" ? -data.quantity : data.quantity;
    if (currentStock + delta < 0) fail("Stock cannot become negative", 409, "INSUFFICIENT_STOCK");
    const updated = await tx.inventory_items.update({ where: { id: current.id }, data: { current_stock: (currentStock + delta).toFixed(2), updated_at: new Date() } });
    await tx.inventory_transactions.create({ data: { tenant_id: tenant, item_id: current.id, type: data.type, quantity: Math.abs(data.quantity).toFixed(2), notes: data.notes || null, performed_by: toId(actor.userId, "Actor ID") } });
    await recordAudit({ tenantId: tenant, userId: actor.userId, action: "INVENTORY_STOCK_CHANGED", entityType: "INVENTORY_ITEM", entityId: current.id, oldValues: { currentStock }, newValues: { currentStock: currentStock + delta, type: data.type }, req, client: tx });
    return updated;
  }, { isolationLevel: "Serializable" });
  return formatItem(item);
};

const stockHistory = async (tenantId, itemId) => (await prisma.inventory_transactions.findMany({ where: { tenant_id: assertTenant(tenantId), item_id: toId(itemId, "Item ID") }, orderBy: { created_at: "desc" }, take: 100 })).map((entry) => ({ id: entry.id.toString(), type: entry.type, quantity: entry.quantity.toString(), notes: entry.notes, performedBy: entry.performed_by.toString(), createdAt: entry.created_at }));

module.exports = { createUser, listUsers, updateUser, updateUserStatus, resetUserPassword, createItem, listItems, adjustStock, stockHistory };
