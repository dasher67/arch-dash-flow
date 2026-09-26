import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStock, saveStock, uploadStockImage, type StockItem } from "@/lib/api.functions";
import { formatMoney, useI18n } from "@/lib/i18n";
import { useAuthed } from "@/lib/session";
import { errMsg, useStock } from "@/components/arch/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/stock")({
  head: () => ({
    meta: [
      { title: "Stock — Arch Dashboard" },
      { name: "description", content: "Stock catalog with images, colors, quantities and prices." },
      { property: "og:title", content: "Stock — Arch Dashboard" },
      { property: "og:description", content: "Stock catalog with images, colors, quantities and prices." },
    ],
  }),
  component: StockPage,
});

function StockPage() {
  const { t, lang } = useI18n();
  const { token, staff } = useAuthed();
  const qc = useQueryClient();
  const stock = useStock();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [open, setOpen] = useState(false);
  const isAdmin = staff.role === "admin";

  const del = useMutation({
    mutationFn: (id: string) => deleteStock({ data: { token, id } }),
    onSuccess: () => {
      toast.success(t("deleted"));
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (e) => toast.error(errMsg(e, t)),
  });

  const query = q.trim().toLowerCase();
  const list = (stock.data ?? []).filter(
    (s) => !query || s.name.toLowerCase().includes(query) || s.colors.some((c) => c.toLowerCase().includes(query)),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("stock")}</h1>
        {isAdmin && (
          <Button className="h-12 gap-2 font-bold" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-5 w-5" />
            {t("addStock")}
          </Button>
        )}
      </div>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-12 ps-10" placeholder={t("searchStock")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {stock.isLoading ? t("loading") : t("noStock")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {list.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="flex aspect-square items-center justify-center bg-accent">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Package className="h-12 w-12 text-primary/40" />
                )}
              </div>
              <div className="space-y-2 p-3">
                <div className="truncate font-bold">{s.name}</div>
                <div className="flex flex-wrap gap-1">
                  {s.colors.map((c) => (
                    <span key={c} className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-extrabold text-primary">{formatMoney(s.unit_price, lang)}</span>
                  <span className={`text-xs font-semibold ${s.quantity === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {s.quantity} {t("inStock")}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="h-11 flex-1" onClick={() => { setEditing(s); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 flex-1 text-destructive"
                      onClick={() => confirm(t("confirmDelete")) && del.mutate(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <StockForm open={open} item={editing} onClose={() => setOpen(false)} />
    </div>
  );
}

function StockForm({ open, item, onClose }: { open: boolean; item: StockItem | null; onClose: () => void }) {
  const { t } = useI18n();
  const { token } = useAuthed();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [colors, setColors] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [price, setPrice] = useState("0");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setColors(item?.colors.join(", ") ?? "");
    setQuantity(String(item?.quantity ?? 0));
    setPrice(String(item?.unit_price ?? 0));
    setImage(item?.image_url ?? null);
  }, [open, item]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      const { url } = await uploadStockImage({ data: { token, dataUrl } });
      setImage(url);
    } catch (e) {
      toast.error(errMsg(e, t));
    } finally {
      setUploading(false);
    }
  }

  const save = useMutation({
    mutationFn: () =>
      saveStock({
        data: {
          token,
          id: item?.id,
          name,
          colors: colors.split(/[,،]/).map((c) => c.trim()).filter(Boolean),
          quantity: Math.max(0, parseInt(quantity) || 0),
          unit_price: Math.max(0, parseFloat(price) || 0),
          image_url: image,
        },
      }),
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["stock"] });
      onClose();
    },
    onError: (e) => toast.error(errMsg(e, t)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? t("editStock") : t("addStock")}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) { toast.error(t("required")); return; }
            save.mutate();
          }}
        >
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-accent/50 text-muted-foreground hover:bg-accent"
          >
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 font-semibold">
                <ImagePlus className="h-8 w-8 text-primary" />
                {uploading ? t("loading") : t("uploadImage")}
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="space-y-2">
            <Label>{t("name")} *</Label>
            <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("colors")}</Label>
            <Input className="h-12" value={colors} onChange={(e) => setColors(e.target.value)} placeholder={t("colorsHint")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("quantity")}</Label>
              <Input type="number" min={0} inputMode="numeric" className="h-12" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("unitPrice")}</Label>
              <Input type="number" min={0} step="0.01" inputMode="decimal" className="h-12" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-12 flex-1" onClick={onClose}>{t("cancel")}</Button>
            <Button type="submit" className="h-12 flex-1 font-bold" disabled={save.isPending || uploading}>{t("save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
