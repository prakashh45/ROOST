const ROLE_PERMISSIONS = {
  PLATFORM_ADMIN: ["*"],
  MANAGER: [
    "guests:read", "guests:write", "reception:operate", "finance:read", "finance:collect", "finance:refund:approve",
    "users:read", "users:manage", "inventory:read", "inventory:manage", "experience:read", "experience:manage",
    "reports:read", "settings:read", "settings:write", "audit:read",
  ],
  RECEPTIONIST: ["guests:read", "guests:write", "reception:operate", "finance:read", "finance:collect", "experience:write"],
  OWNER: [
    "guests:read", "guests:write", "reception:operate", "finance:read", "finance:collect", "finance:refund:approve",
    "users:read", "users:manage", "inventory:read", "inventory:manage", "experience:read", "experience:manage",
    "reports:read", "settings:read", "settings:write", "audit:read",
  ],
  STAFF: ["guests:read", "guests:write", "reception:operate", "finance:read", "finance:collect", "experience:write"],
  GUEST: ["experience:write"],
};

const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes("*") || permissions.includes(permission);
};

const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    const error = new Error("Unauthorized");
    error.status = 401;
    error.code = "UNAUTHORIZED";
    return next(error);
  }
  if (!permissions.every((permission) => hasPermission(req.user.role, permission))) {
    const error = new Error("You do not have permission to perform this operation");
    error.status = 403;
    error.code = "FORBIDDEN";
    return next(error);
  }
  next();
};

module.exports = { ROLE_PERMISSIONS, hasPermission, requirePermission };
