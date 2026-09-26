import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Order } from "@/lib/api.functions";
import { useI18n } from "@/lib/i18n";
import { useAuthed } from "@/lib/session";
import { cityLabel } from "@/lib/cities";
import { OrderCard, OrderDetails, OrderForm, useOrders } from "@/components/arch/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Arch Dashboard" },
      { name: "description", content: "Create, edit and resolve customer orders." },
      { property: "og:title", content: "Orders — Arch Dashboard" },
      { property: "og:description", content: "Create, edit and resolve customer orders." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { t, lang } = useI18n();
  const { staff } = useAuthed();
  const orders = useOrders();
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);

  const all = orders.data ?? [];
  const query = q.trim().toLowerCase();
  const list = all
    .filter((o) => o.status === tab)
    .filter(
      (o) =>
        !query ||
        o.phone.includes(query) ||
        cityLabel(o.city, lang).toLowerCase().includes(query) ||
        o.city.toLowerCase().includes(query) ||
        o.items.some((i) => i.name.toLowerCase().includes(query)),
    );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("orders")}</h1>
        {staff.role !== "viewer" && (
          <Button className="h-12 gap-2 font-bold" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-5 w-5" />
            {t("newOrder")}
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="h-12 w-full sm:w-auto">
            <TabsTrigger value="pending" className="h-10 flex-1 px-5">
              {t("pending")} ({all.filter((o) => o.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="h-10 flex-1 px-5">
              {t("completed")} ({all.filter((o) => o.status === "completed").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-12 ps-10" placeholder={t("searchOrders")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {orders.isLoading ? t("loading") : t("noOrders")}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onView={() => setViewing(o)}
              onEdit={() => { setEditing(o); setFormOpen(true); }}
            />
          ))}
        </div>
      )}
      <OrderForm open={formOpen} order={editing} onClose={() => setFormOpen(false)} />
      <OrderDetails order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
