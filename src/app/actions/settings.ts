"use server";

import { supabase } from "@/lib/supabase/client";

/**
 * Fetches the current maintenance mode status from Supabase school_settings table.
 */
export async function getMaintenanceMode(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("school_settings")
      .select("maintenance_mode")
      .eq("id", "default")
      .single();

    if (data && !error) {
      return data.maintenance_mode ?? false;
    }
  } catch (e) {
    console.warn("Could not fetch maintenance mode:", e);
  }
  return false;
}
