import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStaff, listStaff, saveStaff } from "@/lib/api.functions";
import { useI18n } from "@/lib/i18n";
import { useAuthed } from "@/lib/session";
import { errMsg } from "@/components/arch/orders";
import { roleKey } from "./_app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/staff")({
  head: () => ({
    meta: [
      { title: "Staff — Arch Dashboard" },
      { name: "description", content: "Manage staff members, PINs and roles." },
      { property: "og:title", content: "Staff — Arch Dashboard" },
      { property: "og:description", content: "Manage staff members, PINs and roles." },
    ],
  }),
  component: StaffPage,
});

type Member = { id: string; name: string; pin: string; role: "admin" | "staff" | "viewer" };

function StaffPage() {
  const { t } = useI18n();
  const { token, staff } = useAuthed();
  const qc = useQueryClient();
  const isAdmin = staff.role === "admin";
  const members = useQuery({
    queryKey: ["staff"],
    queryFn: () => listStaff({ data: { token } }),
    enabled: isAdmin,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteStaff({ data: { token, id } }),
    onSuccess: () => {
      toast.success(t("deleted"));
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["staff-names"] });
    },
    onError: (e) => toast.error(errMsg(e, t)),
  });

  if (!isAdmin) return <div className="p-10 text-center text-muted-foreground">{t("forbidden")}</div>;

  const badge = (r: string) =>
    r === "admin" ? "bg-primary text-primary-foreground" : r === "staff" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("staff")}</h1>
        <Button className="h-12 gap-2 font-bold" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-5 w-5" />
          {t("addStaff")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        {(members.data ?? []).map((m) => (
          <div key={m.id} className="flex items-center gap-3 border-b p-4 last:border-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-primary">
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{m.name}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge(m.role)}`}>{t(roleKey(m.role))}</span>
                <span className="font-mono text-muted-foreground" dir="ltr">PIN {m.pin}</span>
              </div>
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => { setEditing(m); setOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 text-destructive"
              disabled={m.id === staff.id}
              onClick={() => confirm(t("confirmDelete")) && del.mutate(m.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <StaffForm open={open} member={editing} onClose={() => setOpen(false)} />
    </div>
  );
}

function StaffForm({ open, member, onClose }: { open: boolean; member: Member | null; onClose: () => void }) {
  const { t } = useI18n();
  const { token } = useAuthed();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Member["role"]>("staff");

  useEffect(() => {
    if (!open) return;
    setName(member?.name ?? "");
    setPin(member?.pin ?? "");
    setRole(member?.role ?? "staff");
  }, [open, member]);

  const save = useMutation({
    mutationFn: () => saveStaff({ data: { token, id: member?.id, name, pin, role } }),
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["staff-names"] });
      qc.invalidateQueries({ queryKey: ["staff-count"] });
      onClose();
    },
    onError: (e) => toast.error(errMsg(e, t)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? t("editStaff") : t("addStaff")}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) { toast.error(t("required")); return; }
            if (!/^\d{4,6}$/.test(pin)) { toast.error(t("invalidPin")); return; }
            save.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>{t("name")} *</Label>
            <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("pin")} *</Label>
            <Input
              className="h-12 font-mono tracking-widest"
              inputMode="numeric"
              maxLength={6}
              dir="ltr"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder={t("pinHint")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Member["role"])}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("admin")}</SelectItem>
                <SelectItem value="staff">{t("staffRole")}</SelectItem>
                <SelectItem value="viewer">{t("viewer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-12 flex-1" onClick={onClose}>{t("cancel")}</Button>
            <Button type="submit" className="h-12 flex-1 font-bold" disabled={save.isPending}>{t("save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
