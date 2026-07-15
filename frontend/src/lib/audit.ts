import { logAuditLocal } from "@/services/localStoreAdapter";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "item.create"
  | "item.update"
  | "item.archive"
  | "entry.create"
  | "exit.create"
  | "exit.validate"
  | "exit.reject"
  | "exit.deliver"
  | "user.create"
  | "user.update"
  | "export.run";

export async function logAudit(
  action: AuditAction,
  options: {
    entity_type?: string;
    entity_id?: string;
    old_value?: any;
    new_value?: any;
    metadata?: Record<string, any>;
  } = {}
) {
  logAuditLocal(action, options);
}