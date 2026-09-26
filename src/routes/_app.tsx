import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History, LayoutDashboard, LogOut, Package, PanelLeft, ShoppingBag, Users } from "lucide-react";
import logo from "@/assets/arch-logo.png";
import { useI18n, type TKey } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { logout } from "@/lib/api.functions";
import { LangToggle } from "@/components/arch/LangToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

const NAV: { to: string; key: TKey; icon: typeof Package; adminOnly?: boolean }[] = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/orders", key: "orders", icon: ShoppingBag },
  { to: "/stock", key: "stock", icon: Package },
  { to: "/history", key: "history", icon: History },
  { to: "/staff", key: "staff", icon: Users, adminOnly: true },
];

export const roleKey = (r: string): TKey => (r === "admin" ? "admin" : r === "viewer" ? "viewer" : "staffRole");

function AppLayout() {
  const { ready, staff, token, signOut } = useSession();
  const { t } = useI18n();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (ready && !staff) navigate({ to: "/" });
  }, [ready, staff, navigate]);

  if (!ready || !staff) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">{t("loading")}</div>;
  }

  const items = NAV.filter((n) => !n.adminOnly || staff.role === "admin");

  async function doLogout() {
    if (token) logout({ data: { token } }).catch(() => {});
    signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-e bg-sidebar transition-all md:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <img src={logo} alt="Arch" className="h-9 w-9" />
          {!collapsed && <span className="text-lg font-extrabold">{t("appName")}</span>}
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-lg px-4 font-semibold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
                  collapsed && "justify-center px-0",
                )}
                title={t(n.key)}
              >
                <n.icon className="h-5 w-5 shrink-0" />
                {!collapsed && t(n.key)}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="m-3 flex h-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
          aria-label={t("menu")}
        >
          <PanelLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
          <img src={logo} alt="Arch" className="h-9 w-9 md:hidden" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold leading-tight">{staff.name}</div>
            <span className="inline-block rounded-full bg-accent px-2 text-xs font-semibold text-accent-foreground">
              {t(roleKey(staff.role))}
            </span>
          </div>
          <LangToggle />
          <Button variant="ghost" size="sm" className="h-10 gap-1.5 text-primary" onClick={doLogout}>
            <LogOut className="h-4 w-4 rtl:rotate-180" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </Button>
        </header>
        <main className="flex-1 p-4 pb-28 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map((n) => {
          const active = path.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <n.icon className="h-5 w-5" />
              {t(n.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
