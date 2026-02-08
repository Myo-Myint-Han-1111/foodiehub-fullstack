import { Role } from "@prisma/client";

const PERMISSIONS: Record<Role, Set<string>> = {
  ADMIN: new Set(["*"]),
  SERVER: new Set([
    "order:read",
    "order:create",
    "order:update",
    "order-set:create",
    "order-set:read",
    "order-item:read",
    "order-item:cancel-request",
    "order-item:modify-request",
    "action-request:create",
    "action-request:read",
    "menu:read",
  ]),
  KITCHEN: new Set([
    "order:read",
    "order-set:read",
    "order-set:update-status",
    "order-item:read",
    "order-item:update-status",
    "action-request:read",
    "action-request:approve",
    "menu:read",
  ]),
  COUNTER: new Set([
    "order:read",
    "order:update-payment",
    "order-set:read",
    "order-item:read",
    "menu:read",
  ]),
  CUSTOMER: new Set([
    "order:read-own",
    "order:create",
    "menu:read",
  ]),
};

export function hasPermission(role: Role, action: string): boolean {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  return perms.has("*") || perms.has(action);
}
