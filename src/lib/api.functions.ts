import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, requireStaff, randomToken } from "./api.server";

const tok = z.string().min(10);
const pin = z.string().regex(/^\d{4,6}$/);
const role = z.enum(["admin", "staff", "viewer"]);

function check(error: any) {
  if (error) throw new Error(error.message);
}

// ---------- Auth ----------
export const listStaffNames = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await db();
  const { data, error } = await sb.from("staff").select("id,name").order("name");
  check(error);
  return (data ?? []) as { id: string; name: string }[];
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ staffId: z.string().uuid(), pin }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: s } = await sb
      .from("staff")
      .select("id,name,role,pin")
      .eq("id", data.staffId)
      .maybeSingle();
    if (!s || s.pin !== data.pin) return { ok: false as const };
    const token = randomToken();
    const { error } = await sb.from("staff_sessions").insert({ token, staff_id: s.id });
    check(error);
    return { ok: true as const, token, staff: { id: s.id, name: s.name, role: s.role } };
  });

export const me = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok }).parse(d))
  .handler(async ({ data }) => {
    try {
      return await requireStaff(data.token);
    } catch {
      return null;
    }
  });

export const logout = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    await sb.from("staff_sessions").delete().eq("token", data.token);
    return { ok: true };
  });

// ---------- Staff ----------
export const listStaff = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff(data.token, ["admin"]);
    const sb = await db();
    const { data: rows, error } = await sb.from("staff").select("*").order("created_at");
    check(error);
    return rows as { id: string; name: string; pin: string; role: "admin" | "staff" | "viewer" }[];
  });

export const saveStaff = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: tok,
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(60),
        pin,
        role,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireStaff(data.token, ["admin"]);
    const sb = await db();
    const row = { name: data.name, pin: data.pin, role: data.role };
    const { error } = data.id
      ? await sb.from("staff").update(row).eq("id", data.id)
      : await sb.from("staff").insert(row);
    check(error);
    return { ok: true };
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireStaff(data.token, ["admin"]);
    if (me.id === data.id) throw new Error("CANNOT_DELETE_SELF");
    const sb = await db();
    const { error } = await sb.from("staff").delete().eq("id", data.id);
    check(error);
    return { ok: true };
  });

// ---------- Stock ----------
export type StockItem = {
  id: string;
  name: string;
  colors: string[];
  quantity: number;
  unit_price: number;
  image_url: string | null;
};

export const listStock = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff(data.token);
    const sb = await db();
    const { data: rows, error } = await sb.from("stock").select("*").order("name");
    check(error);
    return (rows ?? []).map((r: any) => ({ ...r, unit_price: Number(r.unit_price) })) as StockItem[];
  });

export const saveStock = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: tok,
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(100),
        colors: z.array(z.string().trim().min(1).max(40)).max(30),
        quantity: z.number().int().min(0),
        unit_price: z.number().min(0),
        image_url: z.string().url().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireStaff(data.token, ["admin"]);
    const sb = await db();
    const { token, id, ...row } = data;
    const { error } = id
      ? await sb.from("stock").update(row).eq("id", id)
      : await sb.from("stock").insert(row);
    check(error);
    return { ok: true };
  });

export const deleteStock = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff(data.token, ["admin"]);
    const sb = await db();
    const { error } = await sb.from("stock").delete().eq("id", data.id);
    check(error);
    return { ok: true };
  });

export const uploadStockImage = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: tok,
        dataUrl: z.string().max(7_500_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireStaff(data.token, ["admin"]);
    const m = /^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/.exec(data.dataUrl);
    if (!m) throw new Error("INVALID_IMAGE");
    const bytes = Uint8Array.from(atob(m[3]), (c) => c.charCodeAt(0));
    const ext = m[2] === "jpeg" ? "jpg" : m[2];
    const path = `${crypto.randomUUID()}.${ext}`;
    const sb = await db();
    const up = await sb.storage.from("stock-images").upload(path, bytes, { contentType: m[1] });
    check(up.error);
    const signed = await sb.storage
      .from("stock-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    check(signed.error);
    return { url: signed.data.signedUrl as string };
  });

// ---------- Orders ----------
const itemSchema = z.object({
  stock_id: z.string().uuid().nullable(),
  name: z.string().min(1).max(100),
  color: z.string().max(40).optional().default(""),
  qty: z.number().int().min(1),
  unit_price: z.number().min(0),
});
export type OrderItem = z.infer<typeof itemSchema>;
export type Order = {
  id: string;
  order_number: number;
  phone: string;
  city: string;
  items: OrderItem[];
  total: number;
  notes: string | null;
  status: "pending" | "completed";
  created_by_name: string | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
};

export const listOrders = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff(data.token);
    const sb = await db();
    const { data: rows, error } = await sb
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    check(error);
    return (rows ?? []).map((r: any) => ({ ...r, total: Number(r.total) })) as Order[];
  });

export const saveOrder = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        token: tok,
        id: z.string().uuid().optional(),
        phone: z.string().trim().min(5).max(20),
        city: z.string().trim().min(1).max(60),
        items: z.array(itemSchema).min(1).max(50),
        notes: z.string().max(1000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireStaff(data.token, ["admin", "staff"]);
    const sb = await db();
    const total = data.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const row = {
      phone: data.phone,
      city: data.city,
      items: data.items,
      notes: data.notes || null,
      total,
    };
    if (data.id) {
      const { data: existing } = await sb.from("orders").select("status").eq("id", data.id).maybeSingle();
      if (!existing) throw new Error("NOT_FOUND");
      if (existing.status === "completed") throw new Error("ALREADY_RESOLVED");
      const { error } = await sb.from("orders").update(row).eq("id", data.id);
      check(error);
    } else {
      const { error } = await sb
        .from("orders")
        .insert({ ...row, created_by: me.id, created_by_name: me.name });
      check(error);
    }
    return { ok: true };
  });

export const resolveOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireStaff(data.token, ["admin", "staff"]);
    const sb = await db();
    const { error } = await sb
      .from("orders")
      .update({ status: "completed", resolved_by_name: me.name, resolved_at: new Date().toISOString() })
      .eq("id", data.id);
    check(error);
    return { ok: true };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff(data.token, ["admin"]);
    const sb = await db();
    const { error } = await sb.from("orders").delete().eq("id", data.id);
    check(error);
    return { ok: true };
  });

export const staffCount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tok }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff(data.token);
    const sb = await db();
    const { count, error } = await sb.from("staff").select("id", { count: "exact", head: true });
    check(error);
    return count ?? 0;
  });
