import { supabase } from "@/lib/supabase/client";
import * as OTPAuth from "otpauth";

export const DEFAULT_ADMIN_PASSWORD = "RJAryan@986107";
const SALT = "_shbs_secure_salt_2083";

/**
 * Computes a secure SHA-256 cryptographic hash of a password with salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Retrieves the stored SHA-256 password hash from Supabase database.
 * Defaults to the hash of DEFAULT_ADMIN_PASSWORD if not yet updated.
 */
export async function getStoredAdminPasswordHash(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("admin_credentials")
      .select("password_hash")
      .eq("id", "admin_account")
      .single();

    if (data && data.password_hash && !error) {
      return data.password_hash;
    }
  } catch (e) {
    console.warn("Could not fetch admin password hash from Supabase, using default.", e);
  }
  return await hashPassword(DEFAULT_ADMIN_PASSWORD);
}

/**
 * Verifies an entered password against the stored SHA-256 password hash.
 */
export async function verifyAdminPassword(inputPassword: string): Promise<boolean> {
  const inputHash = await hashPassword(inputPassword);
  const storedHash = await getStoredAdminPasswordHash();
  return inputHash === storedHash;
}

/**
 * Updates the admin password in Supabase database by storing only its cryptographic hash.
 */
export async function updateAdminPasswordHash(newPassword: string): Promise<boolean> {
  const newHash = await hashPassword(newPassword);
  const payload = {
    id: "admin_account",
    password_hash: newHash,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("admin_credentials")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

// ────────────────────────────────────────────────────────────────────────────
// TOTP / 2FA Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random Base32 TOTP secret (20 bytes → 32 Base32 chars).
 */
export function generateTOTPSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  // Base32 encode (RFC 4648)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  let buffer = 0;
  let bitsLeft = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      secret += chars[(buffer >> bitsLeft) & 31];
    }
  }
  if (bitsLeft > 0) {
    secret += chars[(buffer << (5 - bitsLeft)) & 31];
  }
  return secret;
}

/**
 * Returns an otpauth:// URI for QR code generation.
 * @param secret  - Base32 TOTP secret
 * @param email   - Admin email to show as the account label in the authenticator app
 */
export function getTOTPUri(secret: string, email: string = "Admin"): string {
  const totp = new OTPAuth.TOTP({
    issuer: "Himalaya SMS",
    label: email,          // ← shows the real email in Google Authenticator
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

/**
 * Verifies a 6-digit TOTP token against the given secret.
 * Allows ±1 time-step window for clock drift.
 */
export function verifyTOTPToken(secret: string, token: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: "Himalaya SMS",
      label: "Admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

/**
 * Fetches the 2FA status (enabled + secret) from Supabase.
 */
export async function get2FAStatus(): Promise<{ enabled: boolean; secret: string | null }> {
  try {
    const { data, error } = await supabase
      .from("admin_credentials")
      .select("totp_enabled, totp_secret")
      .eq("id", "admin_account")
      .single();

    if (data && !error) {
      return { enabled: data.totp_enabled ?? false, secret: data.totp_secret ?? null };
    }
  } catch (e) {
    console.warn("Could not fetch 2FA status from Supabase.", e);
  }
  return { enabled: false, secret: null };
}

/**
 * Saves the TOTP secret and enables 2FA in Supabase.
 * Uses a two-step approach:
 *  1. Ensure the admin_credentials row exists (upsert with password_hash).
 *  2. Update only the TOTP columns.
 */
export async function enable2FA(secret: string): Promise<void> {
  // Step 1: Make sure the row exists with a valid password_hash
  const existingHash = await getStoredAdminPasswordHash();
  await supabase
    .from("admin_credentials")
    .upsert(
      {
        id: "admin_account",
        password_hash: existingHash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  // Step 2: Update only the TOTP fields (no risk of null password_hash)
  const { error } = await supabase
    .from("admin_credentials")
    .update({ totp_secret: secret, totp_enabled: true, updated_at: new Date().toISOString() })
    .eq("id", "admin_account");

  if (error) throw new Error(error.message);
}


/**
 * Disables 2FA in Supabase (clears secret).
 */
export async function disable2FA(): Promise<void> {
  const { error } = await supabase
    .from("admin_credentials")
    .update({ totp_secret: null, totp_enabled: false, updated_at: new Date().toISOString() })
    .eq("id", "admin_account");
  if (error) throw new Error(error.message);
}
