import type { User } from "@supabase/supabase-js";

export type Role = "admin" | "teacher" | "accountant";

/**
 * Supabase Auth identifies users by email. Teachers and the accountant sign in
 * with a short username, so we map it to a deterministic internal address.
 * These domains are never used to send mail.
 */
export const LOGIN_DOMAINS = {
  teacher: "teachers.himalaya.local",
  accountant: "accountant.himalaya.local",
} as const;

/** Lower-case and strip anything that is not valid in an email local part. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9._+-]/g, "_");
}

/**
 * Convert what the user typed into the Supabase Auth email.
 * - Anything containing "@" is treated as a real email and used as-is.
 * - Otherwise the username is mapped to the portal's internal domain.
 */
export function toLoginEmail(portal: Role, identifier: string): string {
  const value = identifier.trim();
  if (value.includes("@")) return value.toLowerCase();
  if (portal === "admin") return value.toLowerCase();
  return `${normalizeUsername(value)}@${LOGIN_DOMAINS[portal]}`;
}

/** Role claim set by the server (app_metadata is not user-editable). */
export function getRole(user: User | null | undefined): Role | null {
  const role = user?.app_metadata?.role;
  return role === "admin" || role === "teacher" || role === "accountant" ? role : null;
}

/** Minimum bar for any new password set through the app. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}
