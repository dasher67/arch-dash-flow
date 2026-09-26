import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Plus, Users } from "lucide-react";
import { staffCount, type Order } from "@/lib/api.functions";
import { useI18n } from "@/lib/i18n";
import { useAuthed } from "@/lib/session";
import { OrderCard, OrderDetails, OrderForm, useOrders } from "@/components/arch/orders";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Arch Dashboard" },
      { name: "description", content: "Today's orders, pending deliveries and team overview." },
      { property: "og:title", content: "Dashboard — Arch Dashboard" },
      { property: "og:description", content: "Today's orders, pending deliveries and team overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { token, staff } = useAuthed();
  const orders = useOrders();
  const members = useQuery({ queryKey: ["staff-count"], queryFn: () => staffCount({ data: { token } }) });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);

  const stats = useMemo(() => {
    const list = orders.data ?? [];
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(dayStart);
    weekStart.setDate(dayStart.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const since = (d: Date) => list.filter((o) => new Date(o.created_at) >= d).length;
    return {
      today: since(dayStart),
      week: since(weekStart),
      month: since(monthStart),
      pending: list.filter((o) => o.status === "pending").length,
      completed: list.filter((o) => o.status === "completed").length,
    };
  }, [orders.data]);

  const pending = (orders.data ?? []).filter((o) => o.status === "pending").slice(0, 6);
  const canCreate = staff.role !== "viewer";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("dashboard")}</h1>
        {canCreate && (
          <Button className="h-12 gap-2 font-bold" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-5 w-5" />
            {t("newOrder")}
          </Button>
        )}
      </div>

      <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-md">
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
          <CalendarDays className="h-4 w-4" />
          {t("orders")}
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-primary-foreground/25 rtl:divide-x-reverse">
          {[
            [t("ordersToday"), stats.today],
            [t("ordersWeek"), stats.week],
            [t("ordersMonth"), stats.month],
          ].map(([l, v]) => (
            <div key={l as string} className="px-3 first:ps-0">
              <div className="text-3xl font-extrabold md:text-4xl">{v}</div>
              <div className="text-xs opacity-90 md:text-sm">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric icon={Clock} label={t("pending")} value={stats.pending} tone="warn" />
        <Metric icon={CheckCircle2} label={t("completed")} value={stats.completed} tone="ok" />
        <Metric icon={Users} label={t("activeStaff")} value={members.data ?? 0} tone="red" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("recentPending")}</h2>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            {orders.isLoading ? t("loading") : t("noOrders")}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {pending.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onView={() => setViewing(o)}
                onEdit={() => { setEditing(o); setFormOpen(true); }}
              />
            ))}
          </div>
        )}
      </section>

      <OrderForm open={formOpen} order={editing} onClose={() => setFormOpen(false)} />
      <OrderDetails order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  tone: "warn" | "ok" | "red";
}) {
  const cls =
    tone === "warn"
      ? "bg-warning-soft text-warning-strong"
      : tone === "ok"
        ? "bg-success-soft text-success"
        : "bg-accent text-primary";
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-muted-foreground md:text-sm">{label}</div>
    </div>
  );
}
