// src/LocaleContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translate } from "./i18n";

const LocaleContext = createContext(null);

export function LocaleProvider({ profile, children }) {
  // Initialize with fallback chain: profile → localStorage → default
  const [locale, setLocale] = useState(() => {
    return profile?.locale || localStorage.getItem("kiro_locale") || "en";
  });

  const [timezone, setTimezone] = useState(() => {
    return profile?.timezone || localStorage.getItem("kiro_timezone") || "Asia/Singapore";
  });

  // Sync from profile when it changes (handles profile updates from other components)
  useEffect(() => {
    if (!profile) return;
    
    // Only update if profile has values and they differ from current state
    if (profile.locale && profile.locale !== locale) {
      setLocale(profile.locale);
    }
    if (profile.timezone && profile.timezone !== timezone) {
      setTimezone(profile.timezone);
    }
  }, [profile, locale, timezone]);

  // Persist locale changes to localStorage and update document language
  useEffect(() => {
    localStorage.setItem("kiro_locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  // Persist timezone changes to localStorage
  useEffect(() => {
    localStorage.setItem("kiro_timezone", timezone);
  }, [timezone]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    // Translation function
    const t = (key) => translate(locale, key);
    
    return {
      locale,
      setLocale,
      timezone,
      setTimezone,
      t, // ✅ Translation function available to all consumers
    };
  }, [locale, timezone]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}