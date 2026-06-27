/*
 * File:    frontend/src/providers/LanguageProvider.tsx
 * Purpose: Lightweight, zero-dependency i18n — STUDENT dashboard only. Holds the
 *          chosen language (persisted in localStorage so it follows the student
 *          across visits), exposes `t(key)` to translate UI strings, and
 *          `setLang` for the profile-section switcher. English keys fall back to
 *          themselves, so any untranslated string still renders readably.
 *
 *          `t()` only translates when the signed-in user is a STUDENT — every
 *          other role (and the public site) always gets English, even if a
 *          student's language choice is sitting in this browser's
 *          localStorage. This is a single guard here rather than threading a
 *          role check through every shared chrome component (Header, Sidebar,
 *          etc.) that calls `t()`.
 * Owner:   Pranav
 */

"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { DICTIONARIES, type Lang } from "@/i18n/dictionaries";
import { useAuthStore } from "@/store/authStore";

const STORAGE_KEY = "skillship.lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLang(v: string | null): v is Lang {
  return v === "en" || v === "hi" || v === "mr" || v === "ta" || v === "gu";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start at "en" on both server and first client render to avoid a hydration
  // mismatch, then adopt the stored preference once mounted.
  const [lang, setLangState] = useState<Lang>("en");
  const isStudent = useAuthStore((s) => s.user?.role === "STUDENT");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (isLang(stored)) setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = isStudent ? lang : "en";
  }, [lang, isStudent]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: string) => (isStudent ? DICTIONARIES[lang]?.[key] ?? DICTIONARIES.en[key] ?? key : DICTIONARIES.en[key] ?? key),
    [lang, isStudent],
  );

  // Non-students always read as "en" — the switcher is hidden for them too
  // (Header.tsx), but this guard holds even if a stale lang sits in storage.
  const effectiveLang = isStudent ? lang : "en";

  const value = useMemo(() => ({ lang: effectiveLang, setLang, t }), [effectiveLang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe fallback if a component renders outside the provider (e.g. in tests):
    // identity translation so nothing crashes.
    return { lang: "en", setLang: () => {}, t: (k: string) => DICTIONARIES.en[k] ?? k };
  }
  return ctx;
}
