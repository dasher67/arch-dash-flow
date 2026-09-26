// Server-only helpers: admin DB access + PIN session verification.
export type Role = "admin" | "staff" | "viewer";
export type StaffRow = { id: string; name: string; role: Role };

export async function db(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export async function requireStaff(token: string, roles?: Role[]): Promise<StaffRow> {
  const sb = await db();
  const { data, error } = await sb
    .from("staff_sessions")
    .select("expires_at, staff:staff_id(id,name,role)")
    .eq("token", token)
    .maybeSingle();
  if (error || !data || !data.staff || new Date(data.expires_at) < new Date()) {
    throw new Error("UNAUTHORIZED");
  }
  const staff = data.staff as StaffRow;
  if (roles && !roles.includes(staff.role)) throw new Error("FORBIDDEN");
  return staff;
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
