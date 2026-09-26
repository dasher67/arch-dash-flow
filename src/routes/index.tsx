import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/arch-logo.png";
import { listStaffNames, login } from "@/lib/api.functions";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LangToggle } from "@/components/arch/LangToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Arch Dashboard" },
      { name: "description", content: "Staff sign in with name and PIN for the Arch order dashboard." },
      { property: "og:title", content: "Sign in — Arch Dashboard" },
      { property: "og:description", content: "Staff sign in with name and PIN for the Arch order dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const { ready, staff, signIn } = useSession();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const names = useQuery({ queryKey: ["staff-names"], queryFn: () => listStaffNames() });

  useEffect(() => {
    if (ready && staff) navigate({ to: "/dashboard" });
  }, [ready, staff, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId || !/^\d{4,6}$/.test(pin)) {
      toast.error(t("wrongPin"));
      return;
    }
    setBusy(true);
    try {
      const res = await login({ data: { staffId, pin } });
      if (!res.ok) {
        toast.error(t("wrongPin"));
        setPin("");
      } else {
        signIn(res.token, res.staff);
        navigate({ to: "/dashboard" });
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-accent to-background px-4 py-10">
      <div className="absolute end-4 top-4">
        <LangToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logo} alt="Arch" className="h-24 w-24 drop-shadow-md" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{t("appName")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        </div>
        <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label>{t("staffName")}</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={t("selectName")} />
              </SelectTrigger>
              <SelectContent>
                {(names.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id} className="py-3 text-base">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">{t("pin")}</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="h-12 text-center text-2xl tracking-[0.6em]"
              dir="ltr"
              placeholder="••••"
            />
          </div>
          <Button type="submit" className="h-12 w-full text-base font-bold" disabled={busy}>
            {t("login")}
          </Button>
        </form>
      </div>
    </div>
  );
}
