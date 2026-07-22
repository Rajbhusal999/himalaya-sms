"use server";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "himalaya_sms_session";

export async function setSession(sessionId: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

export async function validateSession() {
  const sessionId = await getSessionId();
  if (!sessionId) return null;

  // Since this runs on the server, we need a server-side Supabase client.
  // We can just use the REST API directly or standard fetch to keep it simple,
  // Or we can import the standard supabase client if it's initialized correctly for server.
  // We'll dynamically import it to avoid build issues.
  const { supabase } = await import("@/lib/supabase/client");
  
  const { data, error } = await supabase
    .from("active_sessions")
    .select("*, teachers (first_name, last_name)")
    .eq("id", sessionId)
    .single();

  if (error || !data) return null;
  
  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return null;
  }
  
  return data;
}
