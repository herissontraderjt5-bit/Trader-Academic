import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://jkpywxaxmxlqthxxhbdd.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_zcEGCKoz7bpqZBenjZXR2A_QE6JIYrM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseClientRecord {
  id?: string;
  email: string;
  first_login_at?: number | null;
  last_login_at?: number | null;
  expires_at?: number | null;
  status: "ACTIVE" | "EXPIRED" | "BLOCKED";
  registered_via: "HIOVE" | "ADMIN_MANUAL" | "ADMIN_MASTER";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}
