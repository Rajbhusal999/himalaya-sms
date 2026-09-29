import { supabase } from "@/lib/supabase/client";

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
