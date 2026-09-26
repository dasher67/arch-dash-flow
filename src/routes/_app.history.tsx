import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Order } from "@/lib/api.functions";
import { formatDate, formatMoney, useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/cities";
import { OrderDetails, StatusBadge, useOrders } from "@/components/arch/orders";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "Order history — Arch Dashboard" },
      { name: "description", content: "Search past orders by status, date, phone or city." },
      { property: "og:title", content: "Order history — Arch Dashboard" },
      { property: "og:description", content: "Search past orders by status, date, phone or city." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { t, lang } = useI18n();
  const orders = useOrders();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [viewing, setViewing] = useState<Order | null>(null);

  const query = q.trim().toLowerCase();
  const list = (orders.data ?? []).filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    const d = new Date(o.created_at);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + "T23:59:59")) return false;
    if (!query) return true;
    return (
      o.phone.includes(query) ||
      String(o.order_number) === query.replace("#", "") ||
      o.city.toLowerCase().includes(query) ||
      cityLabel(o.city, lang).includes(query) ||
      o.items.some((i) => i.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-2xl font-extrabold md:text-3xl">{t("history")}</h1>
      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <Label>{t("search")}</Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-12 ps-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchOrders")} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>{t("status")}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="pending">{t("pending")}</SelectItem>
              <SelectItem value="completed">{t("completed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t("from")}</Label>
          <Input type="date" className="h-12" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t("to")}</Label>
          <Input type="date" className="h-12" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {orders.isLoading ? t("loading") : t("noOrders")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {list.map((o) => (
            <button
              key={o.id}
              onClick={() => setViewing(o)}
              className="flex w-full items-center gap-3 border-b p-4 text-start last:border-0 hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{o.order_number}</span>
                  <span className="font-bold" dir="ltr">{o.phone}</span>
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  {cityLabel(o.city, lang)} · {formatDate(o.created_at, lang)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-extrabold text-primary">{formatMoney(o.total, lang)}</span>
                <StatusBadge status={o.status} />
              </div>
            </button>
          ))}
        </div>
      )}
      <OrderDetails order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
