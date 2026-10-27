import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supplementalTranslations, translations, type Language, type TranslationKey } from "./translations";

type I18nValue = { language: Language; locale: string; setLanguage: (language: Language) => void; t: (key: TranslationKey, values?: Record<string, string | number>) => string };
const I18nContext = createContext<I18nValue | null>(null);

function initialLanguage(): Language {
  const saved = localStorage.getItem("archer-language");
  if (saved === "en" || saved === "ja") return saved;
  return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const setLanguage = (next: Language) => { setLanguageState(next); localStorage.setItem("archer-language", next); document.documentElement.lang = next; document.documentElement.dataset.language = next; };
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dataset.language = language; }, [language]);
  const value = useMemo<I18nValue>(() => ({ language, locale: language === "ja" ? "ja-JP" : "en-US", setLanguage, t: (key, values) => { const current = { ...translations[language], ...supplementalTranslations[language] } as Record<string, string>; const fallback = { ...translations.en, ...supplementalTranslations.en } as Record<string, string>; let text: string = current[key] ?? fallback[key] ?? key; for (const [name, replacement] of Object.entries(values ?? {})) text = text.replaceAll(`{${name}}`, String(replacement)); return text; } }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() { const value = useContext(I18nContext); if (!value) throw new Error("useI18n must be used inside I18nProvider"); return value; }
