import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  deleteOrder,
  listOrders,
  listStock,
  resolveOrder,
  saveOrder,
  type Order,
  type OrderItem,
} from "@/lib/api.functions";
import { formatDate, formatMoney, useI18n } from "@/lib/i18n";
import { useAuthed } from "@/lib/session";
import { LIBYA_CITIES, cityLabel } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function useOrders() {
  const { token } = useAuthed();
  return useQuery({ queryKey: ["orders"], queryFn: () => listOrders({ data: { token } }) });
}
export function useStock() {
  const { token } = useAuthed();
  return useQuery({ queryKey: ["stock"], queryFn: () => listStock({ data: { token } }) });
}

export function errMsg(e: unknown, t: (k: any) => string) {
  const m = e instanceof Error ? e.message : "";
  if (m.includes("FORBIDDEN")) return t("forbidden");
  return t("error");
}

export function StatusBadge({ status }: { status: Order["status"] }) {
  const { t } = useI18n();
  return status === "completed" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {t("completed")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning-strong">
      <Clock className="h-3.5 w-3.5" />
      {t("pending")}
    </span>
  );
}

export function OrderCard({
  order,
  onView,
  onEdit,
}: {
  order: Order;
  onView: () => void;
  onEdit?: () => void;
}) {
  const { t, lang } = useI18n();
  const { token, staff } = useAuthed();
  const qc = useQueryClient();
  const canAct = staff.role !== "viewer";
  const resolve = useMutation({
    mutationFn: () => resolveOrder({ data: { token, id: order.id } }),
    onSuccess: () => {
      toast.success(t("resolved"));
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(errMsg(e, t)),
  });
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">#{order.order_number}</div>
          <div className="text-lg font-bold" dir="ltr">
            {order.phone}
          </div>
          <div className="text-sm text-muted-foreground">
            {cityLabel(order.city, lang)} · {formatDate(order.created_at, lang)}
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-2">
            <span className="truncate">
              {i.qty}× {i.name}
              {i.color ? ` · ${i.color}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-lg font-extrabold text-primary">{formatMoney(order.total, lang)}</span>
        <div className="flex gap-1.5">
          <Button size="icon" variant="outline" className="h-11 w-11" onClick={onView} aria-label={t("view")}>
            <Eye className="h-4 w-4" />
          </Button>
          {canAct && order.status === "pending" && (
            <>
              {onEdit && (
                <Button size="icon" variant="outline" className="h-11 w-11" onClick={onEdit} aria-label={t("edit")}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                className="h-11 gap-1.5 bg-success text-success-foreground hover:bg-success/90"
                onClick={() => resolve.mutate()}
                disabled={resolve.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("resolve")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrderDetails({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { token, staff } = useAuthed();
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (id: string) => deleteOrder({ data: { token, id } }),
    onSuccess: () => {
      toast.success(t("deleted"));
      qc.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: (e) => toast.error(errMsg(e, t)),
  });
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>
                {t("orderDetails")} #{order.order_number}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <StatusBadge status={order.status} />
              <Row label={t("phone")} value={<span dir="ltr">{order.phone}</span>} />
              <Row label={t("city")} value={cityLabel(order.city, lang)} />
              <Row label={t("date")} value={formatDate(order.created_at, lang)} />
              {order.created_by_name && <Row label={t("createdBy")} value={order.created_by_name} />}
              {order.resolved_by_name && (
                <Row
                  label={t("resolvedBy")}
                  value={`${order.resolved_by_name}${order.resolved_at ? ` · ${formatDate(order.resolved_at, lang)}` : ""}`}
                />
              )}
              <div className="rounded-lg border">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between gap-2 border-b p-3 last:border-0">
                    <div>
                      <div className="font-semibold">{i.name}</div>
                      <div className="text-muted-foreground">
                        {i.color && `${i.color} · `}
                        {i.qty} × {formatMoney(i.unit_price, lang)}
                      </div>
                    </div>
                    <div className="font-bold">{formatMoney(i.qty * i.unit_price, lang)}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-lg font-extrabold">
                <span>{t("total")}</span>
                <span className="text-primary">{formatMoney(order.total, lang)}</span>
              </div>
              {order.notes && <p className="whitespace-pre-wrap rounded-lg bg-muted p-3">{order.notes}</p>}
              {staff.role === "admin" && (
                <Button
                  variant="outline"
                  className="h-11 w-full gap-2 text-destructive"
                  onClick={() => confirm(t("confirmDelete")) && del.mutate(order.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("delete")}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-semibold">{value}</span>
    </div>
  );
}

type Line = OrderItem & { key: number };

export function OrderForm({
  open,
  order,
  onClose,
}: {
  open: boolean;
  order: Order | null;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const { token } = useAuthed();
  const qc = useQueryClient();
  const stock = useStock();
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    if (!open) return;
    setPhone(order?.phone ?? "");
    setCity(order?.city ?? "");
    setNotes(order?.notes ?? "");
    setLines(
      order?.items.map((i, k) => ({ ...i, key: k })) ?? [
        { key: 0, stock_id: null, name: "", color: "", qty: 1, unit_price: 0 },
      ],
    );
  }, [open, order]);

  const total = lines.reduce((s, l) => s + (l.qty || 0) * (l.unit_price || 0), 0);
  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const save = useMutation({
    mutationFn: () =>
      saveOrder({
        data: {
          token,
          id: order?.id,
          phone,
          city,
          notes,
          items: lines.map(({ key, ...l }) => l),
        },
      }),
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: (e) => toast.error(errMsg(e, t)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.trim().length < 5 || !city || lines.length === 0 || lines.some((l) => !l.name || l.qty < 1)) {
      toast.error(t("required"));
      return;
    }
    save.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{order ? t("editOrder") : t("newOrder")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("phone")} *</Label>
              <Input
                type="tel"
                inputMode="tel"
                dir="ltr"
                className="h-12"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09X XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("city")} *</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t("selectCity")} />
                </SelectTrigger>
                <SelectContent>
                  {LIBYA_CITIES.map((c) => (
                    <SelectItem key={c.en} value={c.en} className="py-2.5">
                      {c[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("items")} *</Label>
            {lines.map((l) => {
              const s = stock.data?.find((x) => x.id === l.stock_id);
              return (
                <div key={l.key} className="space-y-3 rounded-xl border bg-muted/40 p-3">
                  <div className="flex gap-2">
                    <Select
                      value={l.stock_id ?? ""}
                      onValueChange={(id) => {
                        const it = stock.data?.find((x) => x.id === id);
                        if (it)
                          update(l.key, {
                            stock_id: it.id,
                            name: it.name,
                            unit_price: it.unit_price,
                            color: it.colors[0] ?? "",
                          });
                      }}
                    >
                      <SelectTrigger className="h-12 flex-1 bg-card">
                        <SelectValue placeholder={l.name || t("selectItem")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(stock.data ?? []).map((it) => (
                          <SelectItem key={it.id} value={it.id} className="py-2.5">
                            {it.name} — {formatMoney(it.unit_price, lang)} ({it.quantity} {t("inStock")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 shrink-0 text-destructive"
                        onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">{t("color")}</span>
                      {s && s.colors.length > 0 ? (
                        <Select value={l.color} onValueChange={(c) => update(l.key, { color: c })}>
                          <SelectTrigger className="h-12 bg-card">
                            <SelectValue placeholder={t("selectColor")} />
                          </SelectTrigger>
                          <SelectContent>
                            {s.colors.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          className="h-12 bg-card"
                          value={l.color}
                          onChange={(e) => update(l.key, { color: e.target.value })}
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">{t("qty")}</span>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className="h-12 bg-card"
                        value={l.qty}
                        onChange={(e) => update(l.key, { qty: Math.max(0, parseInt(e.target.value) || 0) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">{t("unitPrice")}</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        className="h-12 bg-card"
                        value={l.unit_price}
                        onChange={(e) => update(l.key, { unit_price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="text-end text-sm font-bold">
                    {formatMoney((l.qty || 0) * (l.unit_price || 0), lang)}
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full gap-2 border-dashed"
              onClick={() =>
                setLines((ls) => [
                  ...ls,
                  { key: Date.now(), stock_id: null, name: "", color: "", qty: 1, unit_price: 0 },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              {t("addItem")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t("notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div
            className={cn(
              "sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t bg-card px-6 py-4",
            )}
          >
            <div>
              <div className="text-xs text-muted-foreground">{t("total")}</div>
              <div className="text-xl font-extrabold text-primary">{formatMoney(total, lang)}</div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-12" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="h-12 px-6 font-bold" disabled={save.isPending}>
                {t("save")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
