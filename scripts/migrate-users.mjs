/**
 * One-time migration of the existing logins to Supabase Auth.
 *
 *   node --env-file=.env.local scripts/migrate-users.mjs --dry-run   # preview, changes nothing
 *   node --env-file=.env.local scripts/migrate-users.mjs             # create auth users
 *   node --env-file=.env.local scripts/migrate-users.mjs --scrub     # AFTER you verified logins:
 *                                                                    # wipe the old plain-text passwords
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY      (server-only secret)
 *   ADMIN_INITIAL_PASSWORD         (temporary; the admin must change it on first login)
 *
 * Prerequisite: supabase/migrations/20261028000001_auth_foundation.sql is applied.
 * The script is idempotent: re-running skips accounts that already exist.
 * Existing passwords are copied so nobody is locked out; Supabase Auth stores
 * them as bcrypt hashes. Everyone is forced to choose a new password on first login.
 */
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const SCRUB = process.argv.includes("--scrub");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "himalayabasicschool01@gmail.com").toLowerCase();

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Keep these in sync with src/lib/authIdentity.ts
const normalize = (u) => u.trim().toLowerCase().replace(/[^a-z0-9._+-]/g, "_");
const teacherEmail = (u) => `${normalize(u)}@teachers.himalaya.local`;
const accountantEmail = (u) => `${normalize(u)}@accountant.himalaya.local`;

const report = { created: [], skipped: [], failed: [] };

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function ensureUser({ label, email, password, appMetadata }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    report.skipped.push(`${label} (${email}) already exists`);
    return existing;
  }
  if (!password || password.length < 6) {
    report.failed.push(`${label} (${email}): password missing or shorter than 6 chars - set it from the admin panel`);
    return null;
  }
  if (DRY) {
    report.created.push(`[dry-run] would create ${label} (${email})`);
    return null;
  }
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });
  if (error) {
    report.failed.push(`${label} (${email}): ${error.message}`);
    return null;
  }
  report.created.push(`${label} (${email})`);
  return data.user;
}

async function migrate() {
  // ── Admin ──────────────────────────────────────────────────────────────
  if (!adminPassword) {
    report.failed.push("Admin: ADMIN_INITIAL_PASSWORD is not set in .env.local");
  } else {
    await ensureUser({
      label: "Admin",
      email: ADMIN_EMAIL,
      password: adminPassword,
      appMetadata: { role: "admin", must_change_password: true },
    });
  }

  // ── Teachers ───────────────────────────────────────────────────────────
  const { data: teachers, error: tErr } = await db
    .from("teachers")
    .select("id, first_name, last_name, username, password, auth_user_id");
  if (tErr) throw tErr;

  const seen = new Map();
  for (const t of teachers) {
    const label = `Teacher ${t.first_name} ${t.last_name}`;
    if (t.auth_user_id) {
      report.skipped.push(`${label} already linked`);
      continue;
    }
    if (!t.username) {
      report.failed.push(`${label}: no username, cannot create a login`);
      continue;
    }
    const email = teacherEmail(t.username);
    if (seen.has(email)) {
      report.failed.push(`${label}: username collides with ${seen.get(email)} after normalising (${email})`);
      continue;
    }
    seen.set(email, label);

    const user = await ensureUser({
      label,
      email,
      password: t.password,
      appMetadata: { role: "teacher", teacher_id: t.id, must_change_password: true },
    });
    if (user && !DRY) {
      const { error } = await db.from("teachers").update({ auth_user_id: user.id }).eq("id", t.id);
      if (error) report.failed.push(`${label}: created login but could not link row: ${error.message}`);
    }
  }

  // ── Accountant ─────────────────────────────────────────────────────────
  const { data: acc } = await db
    .from("accountant_credentials")
    .select("id, username, password, auth_user_id")
    .eq("id", "default")
    .maybeSingle();

  if (acc && !acc.auth_user_id) {
    const user = await ensureUser({
      label: "Accountant",
      email: accountantEmail(acc.username),
      password: acc.password,
      appMetadata: { role: "accountant", must_change_password: true },
    });
    if (user && !DRY) {
      await db.from("accountant_credentials").update({ auth_user_id: user.id }).eq("id", "default");
    }
  } else if (acc) {
    report.skipped.push("Accountant already linked");
  }
}

async function scrub() {
  // Only wipe passwords for accounts that now exist in Supabase Auth.
  if (DRY) {
    console.log("[dry-run] would null teachers.password and accountant_credentials.password for linked accounts");
    return;
  }
  const t = await db.from("teachers").update({ password: null }).not("auth_user_id", "is", null);
  const a = await db.from("accountant_credentials").update({ password: null }).not("auth_user_id", "is", null);
  if (t.error || a.error) {
    console.error("Scrub failed:", t.error?.message, a.error?.message);
    process.exit(1);
  }
  console.log("Plain-text passwords wiped for all migrated accounts.");
}

try {
  if (SCRUB) {
    await scrub();
  } else {
    await migrate();
    console.log(DRY ? "\n=== DRY RUN (nothing was changed) ===" : "\n=== MIGRATION RESULT ===");
    for (const [k, list] of Object.entries(report)) {
      console.log(`\n${k.toUpperCase()} (${list.length})`);
      list.forEach((l) => console.log("  -", l));
    }
    if (!DRY) console.log("\nNext: test all three logins, then run again with --scrub.");
  }
} catch (e) {
  console.error("Migration aborted:", e);
  process.exit(1);
}
