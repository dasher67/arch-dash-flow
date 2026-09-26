// Libyan cities: value stored in English, label shown per language.
export const LIBYA_CITIES: { en: string; ar: string }[] = [
  { en: "Tripoli", ar: "طرابلس" },
  { en: "Benghazi", ar: "بنغازي" },
  { en: "Misrata", ar: "مصراتة" },
  { en: "Zawiya", ar: "الزاوية" },
  { en: "Bayda", ar: "البيضاء" },
  { en: "Zliten", ar: "زليتن" },
  { en: "Khoms", ar: "الخمس" },
  { en: "Sabha", ar: "سبها" },
  { en: "Tobruk", ar: "طبرق" },
  { en: "Ajdabiya", ar: "أجدابيا" },
  { en: "Derna", ar: "درنة" },
  { en: "Sirte", ar: "سرت" },
  { en: "Gharyan", ar: "غريان" },
  { en: "Sabratha", ar: "صبراتة" },
  { en: "Surman", ar: "صرمان" },
  { en: "Janzour", ar: "جنزور" },
  { en: "Tajoura", ar: "تاجوراء" },
  { en: "Tarhuna", ar: "ترهونة" },
  { en: "Bani Walid", ar: "بني وليد" },
  { en: "Marj", ar: "المرج" },
  { en: "Shahhat", ar: "شحات" },
  { en: "Zuwara", ar: "زوارة" },
  { en: "Msallata", ar: "مسلاتة" },
  { en: "Yafran", ar: "يفرن" },
  { en: "Nalut", ar: "نالوت" },
  { en: "Zintan", ar: "الزنتان" },
  { en: "Ghadames", ar: "غدامس" },
  { en: "Ubari", ar: "أوباري" },
  { en: "Murzuq", ar: "مرزق" },
  { en: "Kufra", ar: "الكفرة" },
  { en: "Hun", ar: "هون" },
  { en: "Brega", ar: "البريقة" },
  { en: "Ras Lanuf", ar: "راس لانوف" },
  { en: "Al Abyar", ar: "الأبيار" },
  { en: "Qasr Bin Ghashir", ar: "قصر بن غشير" },
];

export function cityLabel(value: string, lang: "en" | "ar") {
  const c = LIBYA_CITIES.find((x) => x.en === value);
  return c ? c[lang] : value;
}
