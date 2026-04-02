import permissionsMatrix from "../config/permissions.json";

const ROLE_ALIASES = {
  super_admin: "superadmin",
  "super admin": "superadmin",
  superadmin: "superadmin",
  admin: "admin",
  hr: "hr",
  "hr_manager": "hr",
  "hr manager": "hr",
  supervisor: "supervisor",
  manager: "manager",
  employee: "employee",
  contractor: "contractor",
};

export const normalizeRole = (role) => {
  const raw = String(role || "").trim().toLowerCase();
  if (!raw) return "";
  if (ROLE_ALIASES[raw]) return ROLE_ALIASES[raw];

  const compact = raw.replace(/[\s_]+/g, "");
  const knownRoles = Object.keys(permissionsMatrix);
  const match = knownRoles.find((r) => r.replace(/[\s_]+/g, "") === compact);
  return match || raw;
};

export const can = (role, module, action) => {
  const roleKey = normalizeRole(role);
  const moduleKey = String(module || "").trim().toLowerCase();
  const actionKey = String(action || "").trim().toLowerCase();
  if (!roleKey || !moduleKey || !actionKey) return false;
  return Boolean(
    permissionsMatrix?.[roleKey]?.modules?.[moduleKey]?.includes(actionKey)
  );
};

export const canAny = (role, module, actions = []) => {
  return actions.some((a) => can(role, module, a));
};

