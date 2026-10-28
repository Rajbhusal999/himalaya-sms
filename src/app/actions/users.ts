"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRole,
  normalizeUsername,
  toLoginEmail,
  validatePasswordStrength,
} from "@/lib/authIdentity";

type Result = { ok: true } | { ok: false; error: string };

/** Throws unless the caller is a signed-in admin (verified against the Auth server). */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || getRole(user) !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

/**
 * Creates or updates a teacher's login. Called by the admin when saving a teacher.
 * - `password` is optional when editing (leave empty to keep the current one).
 * - The password is never written to the teachers table.
 */
export async function upsertTeacherLogin(input: {
  teacherId: string;
  username: string;
  password?: string;
}): Promise<Result> {
  try {
    await requireAdmin();

    const username = normalizeUsername(input.username || "");
    if (!username) return { ok: false, error: "Username is required." };

    if (input.password) {
      const weak = validatePasswordStrength(input.password);
      if (weak) return { ok: false, error: weak };
    }

    const email = toLoginEmail("teacher", username);
    const admin = createAdminClient();

    const { data: teacher, error: tErr } = await admin
      .from("teachers")
      .select("id, auth_user_id")
      .eq("id", input.teacherId)
      .single();
    if (tErr || !teacher) return { ok: false, error: "Teacher not found." };

    if (teacher.auth_user_id) {
      const { error } = await admin.auth.admin.updateUserById(teacher.auth_user_id, {
        email,
        ...(input.password ? { password: input.password } : {}),
        app_metadata: { role: "teacher", teacher_id: teacher.id },
      });
      if (error) return { ok: false, error: error.message };
    } else {
      if (!input.password) {
        return { ok: false, error: "A password is required to create the login." };
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: true,
        app_metadata: { role: "teacher", teacher_id: teacher.id, must_change_password: true },
      });
      if (error || !data.user) return { ok: false, error: error?.message ?? "Could not create login." };

      const { error: linkErr } = await admin
        .from("teachers")
        .update({ auth_user_id: data.user.id, password: null })
        .eq("id", teacher.id);
      if (linkErr) return { ok: false, error: linkErr.message };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

/** Removes a teacher's login. Call before deleting the teacher row. */
export async function deleteTeacherLogin(teacherId: string): Promise<Result> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data } = await admin.from("teachers").select("auth_user_id").eq("id", teacherId).single();
    if (data?.auth_user_id) {
      const { error } = await admin.auth.admin.deleteUser(data.auth_user_id);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

/** Sets the accountant's username and/or password (admin only). */
export async function setAccountantLogin(input: {
  username: string;
  password?: string;
}): Promise<Result> {
  try {
    await requireAdmin();

    const username = normalizeUsername(input.username || "");
    if (!username) return { ok: false, error: "Username is required." };
    if (input.password) {
      const weak = validatePasswordStrength(input.password);
      if (weak) return { ok: false, error: weak };
    }

    const email = toLoginEmail("accountant", username);
    const admin = createAdminClient();

    const { data: row } = await admin
      .from("accountant_credentials")
      .select("id, auth_user_id")
      .eq("id", "default")
      .maybeSingle();

    if (row?.auth_user_id) {
      const { error } = await admin.auth.admin.updateUserById(row.auth_user_id, {
        email,
        ...(input.password ? { password: input.password } : {}),
        app_metadata: { role: "accountant" },
      });
      if (error) return { ok: false, error: error.message };
    } else {
      if (!input.password) return { ok: false, error: "A password is required to create the login." };
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: true,
        app_metadata: { role: "accountant", must_change_password: true },
      });
      if (error || !data.user) return { ok: false, error: error?.message ?? "Could not create login." };
      const { error: linkErr } = await admin
        .from("accountant_credentials")
        .upsert({ id: "default", username, password: null, auth_user_id: data.user.id });
      if (linkErr) return { ok: false, error: linkErr.message };
      return { ok: true };
    }

    await admin
      .from("accountant_credentials")
      .update({ username, password: null, updated_at: new Date().toISOString() })
      .eq("id", "default");

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

/** Signs the current admin out of every device (replaces the old active_sessions list). */
export async function signOutEverywhere(): Promise<Result> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}
