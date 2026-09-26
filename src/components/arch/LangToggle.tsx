import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-10 gap-1.5 font-bold"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
    >
      <Languages className="h-4 w-4" />
      {lang === "en" ? "AR" : "EN"}
    </Button>
  );
}
