import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const dict = {
  appName: { en: "Arch Dashboard", ar: "لوحة آرتش" },
  login: { en: "Sign in", ar: "تسجيل الدخول" },
  loginSubtitle: { en: "Select your name and enter your PIN", ar: "اختر اسمك وأدخل الرمز السري" },
  staffName: { en: "Staff name", ar: "اسم الموظف" },
  selectName: { en: "Select your name", ar: "اختر اسمك" },
  pin: { en: "PIN", ar: "الرمز السري" },
  wrongPin: { en: "Wrong name or PIN", ar: "الاسم أو الرمز السري غير صحيح" },
  logout: { en: "Logout", ar: "خروج" },
  dashboard: { en: "Dashboard", ar: "الرئيسية" },
  orders: { en: "Orders", ar: "الطلبات" },
  stock: { en: "Stock", ar: "المخزون" },
  staff: { en: "Staff", ar: "الموظفون" },
  history: { en: "History", ar: "السجل" },
  admin: { en: "Admin", ar: "مدير" },
  staffRole: { en: "Staff", ar: "موظف" },
  viewer: { en: "Viewer", ar: "مشاهد" },
  role: { en: "Role", ar: "الدور" },
  ordersToday: { en: "Orders today", ar: "طلبات اليوم" },
  ordersWeek: { en: "This week", ar: "هذا الأسبوع" },
  ordersMonth: { en: "This month", ar: "هذا الشهر" },
  pending: { en: "Pending", ar: "قيد الانتظار" },
  completed: { en: "Completed", ar: "مكتمل" },
  activeStaff: { en: "Staff members", ar: "الموظفون" },
  recentPending: { en: "Pending orders", ar: "طلبات قيد الانتظار" },
  newOrder: { en: "New order", ar: "طلب جديد" },
  editOrder: { en: "Edit order", ar: "تعديل الطلب" },
  orderDetails: { en: "Order details", ar: "تفاصيل الطلب" },
  phone: { en: "Phone number", ar: "رقم الهاتف" },
  city: { en: "City", ar: "المدينة" },
  selectCity: { en: "Select city", ar: "اختر المدينة" },
  items: { en: "Items", ar: "الأصناف" },
  item: { en: "Item", ar: "الصنف" },
  selectItem: { en: "Select item", ar: "اختر الصنف" },
  color: { en: "Color", ar: "اللون" },
  colors: { en: "Colors", ar: "الألوان" },
  selectColor: { en: "Color", ar: "اللون" },
  qty: { en: "Qty", ar: "الكمية" },
  quantity: { en: "Quantity", ar: "الكمية" },
  unitPrice: { en: "Unit price", ar: "سعر الوحدة" },
  total: { en: "Total", ar: "الإجمالي" },
  addItem: { en: "Add item", ar: "إضافة صنف" },
  notes: { en: "Notes (optional)", ar: "ملاحظات (اختياري)" },
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  edit: { en: "Edit", ar: "تعديل" },
  delete: { en: "Delete", ar: "حذف" },
  resolve: { en: "Resolve", ar: "إنهاء" },
  view: { en: "View", ar: "عرض" },
  confirmDelete: { en: "Are you sure you want to delete this?", ar: "هل أنت متأكد من الحذف؟" },
  search: { en: "Search…", ar: "بحث…" },
  searchStock: { en: "Search by name or color", ar: "ابحث بالاسم أو اللون" },
  searchOrders: { en: "Search phone, city, item", ar: "ابحث بالهاتف أو المدينة أو الصنف" },
  noOrders: { en: "No orders yet", ar: "لا توجد طلبات" },
  noStock: { en: "No stock items yet", ar: "لا توجد أصناف" },
  addStock: { en: "Add stock", ar: "إضافة صنف" },
  editStock: { en: "Edit stock", ar: "تعديل الصنف" },
  name: { en: "Name", ar: "الاسم" },
  image: { en: "Image", ar: "الصورة" },
  uploadImage: { en: "Upload image", ar: "رفع صورة" },
  colorsHint: { en: "Comma separated, e.g. Red, Black", ar: "افصل بفاصلة، مثال: أحمر، أسود" },
  addStaff: { en: "Add staff", ar: "إضافة موظف" },
  editStaff: { en: "Edit staff", ar: "تعديل موظف" },
  pinHint: { en: "4 to 6 digits", ar: "من 4 إلى 6 أرقام" },
  all: { en: "All", ar: "الكل" },
  status: { en: "Status", ar: "الحالة" },
  date: { en: "Date", ar: "التاريخ" },
  from: { en: "From", ar: "من" },
  to: { en: "To", ar: "إلى" },
  createdBy: { en: "Created by", ar: "أنشأه" },
  resolvedBy: { en: "Resolved by", ar: "أنهاه" },
  saved: { en: "Saved", ar: "تم الحفظ" },
  deleted: { en: "Deleted", ar: "تم الحذف" },
  resolved: { en: "Order resolved", ar: "تم إنهاء الطلب" },
  error: { en: "Something went wrong", ar: "حدث خطأ ما" },
  required: { en: "Please fill in all required fields", ar: "يرجى تعبئة الحقول المطلوبة" },
  invalidPin: { en: "PIN must be 4–6 digits", ar: "يجب أن يكون الرمز من 4 إلى 6 أرقام" },
  forbidden: { en: "You don't have permission", ar: "ليس لديك صلاحية" },
  currency: { en: "LYD", ar: "د.ل" },
  inStock: { en: "in stock", ar: "متوفر" },
  viewOnly: { en: "View-only access", ar: "صلاحية عرض فقط" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…" },
  menu: { en: "Menu", ar: "القائمة" },
} as const;

export type TKey = keyof typeof dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string; dir: "ltr" | "rtl" };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("arch-lang");
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => {
    localStorage.setItem("arch-lang", l);
    setLangState(l);
  };
  const t = (k: TKey) => dict[k][lang];
  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}

export function formatMoney(n: number, lang: Lang) {
  return `${n.toLocaleString(lang === "ar" ? "ar-LY" : "en-US", { maximumFractionDigits: 2 })} ${dict.currency[lang]}`;
}

export function formatDate(s: string, lang: Lang) {
  return new Date(s).toLocaleString(lang === "ar" ? "ar-LY" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
