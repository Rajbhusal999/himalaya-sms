"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRole, validatePasswordStrength, type Role } from "@/lib/authIdentity";

export type SessionInfo = {
  role: Role;
  /** Supabase Auth user id */
  auth_user_id: string;
  /** teachers.id for teachers, null otherwise (kept as `user_id` for existing callers) */
  user_id: string | null;
  email: string | null;
  teachers: { first_name: string; last_name: string } | null;
};

/**
 * Returns the signed-in user's role/identity, or null when not signed in.
 * Uses getUser() which validates the JWT against the Auth server.
 */
export async function validateSession(): Promise<SessionInfo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = getRole(user);
  if (!user || !role) return null;

  let teacherId: string | null = null;
  let teacher: SessionInfo["teachers"] = null;

  if (role === "teacher") {
    teacherId = (user.app_metadata?.teacher_id as string | undefined) ?? null;
    if (teacherId) {
      const { data } = await supabase
        .from("teachers")
        .select("first_name, last_name")
        .eq("id", teacherId)
        .single();
      teacher = data ?? null;
    }
  }

  return {
    role,
    auth_user_id: user.id,
    user_id: teacherId,
    email: user.email ?? null,
    teachers: teacher,
  };
}

/** Signs the user out and clears the auth cookies. */
export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Clears the "must change password" flag after the user has set a new password.
 * app_metadata can only be written with the service role, so this runs here.
 */
export async function completeForcedPasswordChange(): Promise<{ ok: boolean; role?: Role; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = getRole(user);
  if (!user || !role) return { ok: false, error: "Not signed in." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, must_change_password: false },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, role };
}

/**
 * Re-authentication check: is `password` the current user's password?
 * Uses a stateless client so the real session (and its MFA level) is untouched.
 */
export async function verifyOwnPassword(password: string): Promise<boolean> {
  if (!password) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const probe = createStatelessClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error } = await probe.auth.signInWithPassword({ email: user.email, password });
  return !error;
}

/** Sets a new password for the currently signed-in user (after server-side strength check). */
export async function changeOwnPassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const weak = validatePasswordStrength(newPassword);
  if (weak) return { ok: false, error: weak };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
