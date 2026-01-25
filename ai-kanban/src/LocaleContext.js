// src/LocaleContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translate } from "./i18n"; // ✅ IMPORTANT

const LocaleContext = createContext(null);

export function LocaleProvider({ profile, children }) {
  const [locale, setLocale] = useState(() => {
    return profile?.locale || localStorage.getItem("kiro_locale") || "en";
  });

  const [timezone, setTimezone] = useState(() => {
    return profile?.timezone || localStorage.getItem("kiro_timezone") || "Asia/Singapore";
  });

  // ✅ derive stable deps
  const profileLocale = profile?.locale;
  const profileTimezone = profile?.timezone;

  // sync from DB profile when it changes
  useEffect(() => {
    if (!profile) return;
    if (profileLocale) setLocale(profileLocale);
    if (profileTimezone) setTimezone(profileTimezone);
  }, [profile, profileLocale, profileTimezone]);

  // persist locally (instant UX)
  useEffect(() => {
    localStorage.setItem("kiro_locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    localStorage.setItem("kiro_timezone", timezone);
  }, [timezone]);

  const value = useMemo(() => {
    const t = (key) => translate(locale, key); // ✅ THIS is what you’re missing
    return { locale, setLocale, timezone, setTimezone, t };
  }, [locale, timezone]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
