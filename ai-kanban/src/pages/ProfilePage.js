// src/pages/ProfilePage.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLocale } from "../LocaleContext";

/* =========================
   helpers
========================= */
function safeErrorMessage(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

function formatDateMaybe(value) {
  try {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function extFromFile(file) {
  const parts = (file?.name || "").split(".");
  const ext = parts.length > 1 ? parts.pop() : "png";
  return (ext || "png").toLowerCase();
}

function isImageFile(file) {
  return !!file && file.type?.startsWith("image/");
}

/* =========================
   toast
========================= */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const tone = toast.tone || "neutral";
  const toneMap = {
    neutral: { bar: "rgba(17,24,39,0.14)" },
    success: { bar: "rgba(31,157,106,0.32)" },
    danger: { bar: "rgba(226,61,61,0.32)" },
    info: { bar: "rgba(47,111,237,0.30)" },
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 220,
        width: "min(460px, calc(100vw - 36px))",
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(17,24,39,0.14)",
        boxShadow: "0 22px 54px rgba(17,24,39,0.16)",
        backdropFilter: "blur(12px)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        overflow: "hidden",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        style={{
          width: 6,
          borderRadius: 999,
          background: (toneMap[tone] || toneMap.neutral).bar,
          alignSelf: "stretch",
        }}
      />
      <div style={{ fontSize: 18, lineHeight: "18px", marginTop: 2 }}>{toast.icon || "ℹ️"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 950, color: "#111827", fontSize: 13 }}>{toast.title || "Done"}</div>
        {toast.message && (
          <div
            style={{
              color: "rgba(17,24,39,0.72)",
              fontSize: 13,
              marginTop: 3,
              lineHeight: 1.35,
              wordBreak: "break-word",
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontWeight: 950,
          color: "rgba(17,24,39,0.55)",
          padding: 6,
          margin: -6,
          borderRadius: 10,
        }}
        aria-label="Close toast"
      >
        ✕
      </button>
    </div>
  );
}

/* =========================
   modal
========================= */
function Modal({ open, title, subtitle, children, footer, onClose }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 230,
        background: "rgba(17,24,39,0.45)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(620px, 100%)",
          borderRadius: 16,
          background: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(17,24,39,0.16)",
          boxShadow: "0 30px 90px rgba(17,24,39,0.28)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: "1px solid rgba(17,24,39,0.08)",
          }}
        >
          <div style={{ display: "grid", gap: 3 }}>
            <div style={{ fontWeight: 950, color: "#111827" }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: 950,
              color: "rgba(17,24,39,0.60)",
              padding: 6,
              margin: -6,
              borderRadius: 10,
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 16 }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: 16,
              borderTop: "1px solid rgba(17,24,39,0.08)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   UI bits
========================= */
function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { border: "1px solid rgba(17,24,39,0.12)", bg: "rgba(17,24,39,0.06)", color: "rgba(17,24,39,0.78)" },
    brand: { border: "1px solid rgba(47,111,237,0.18)", bg: "rgba(47,111,237,0.10)", color: "rgba(17,24,39,0.92)" },
    success: { border: "1px solid rgba(31,157,106,0.18)", bg: "rgba(31,157,106,0.10)", color: "rgba(17,24,39,0.92)" },
    danger: { border: "1px solid rgba(226,61,61,0.18)", bg: "rgba(226,61,61,0.10)", color: "rgba(17,24,39,0.92)" },
  };
  const t = tones[tone] || tones.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 950,
        whiteSpace: "nowrap",
        ...t,
      }}
    >
      {children}
    </span>
  );
}

function Switch({ checked, onChange, label, description }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid rgba(17,24,39,0.06)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 950, fontSize: 13, color: "rgba(17,24,39,0.92)" }}>{label}</div>
        {description && (
          <div style={{ fontWeight: 800, fontSize: 12, color: "rgba(17,24,39,0.62)", marginTop: 2 }}>{description}</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          border: "1px solid rgba(17,24,39,0.14)",
          background: checked ? "rgba(47,111,237,0.92)" : "rgba(17,24,39,0.08)",
          position: "relative",
          cursor: "pointer",
          flex: "0 0 auto",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 22 : 3,
            width: 20,
            height: 20,
            borderRadius: 999,
            background: "#fff",
            boxShadow: "0 8px 18px rgba(17,24,39,0.16)",
            transition: "left 0.15s ease",
          }}
        />
      </button>
    </div>
  );
}

function SectionCard({ title, subtitle, children, right, styles }) {
  return (
    <section style={styles.card} aria-label={title}>
      <div style={styles.cardHeader}>
        <div style={{ display: "grid", gap: 3 }}>
          <div style={styles.cardTitle}>{title}</div>
          {subtitle && <div style={styles.cardSubtitle}>{subtitle}</div>}
        </div>
        {right}
      </div>
      <div style={styles.cardBody}>{children}</div>
    </section>
  );
}

/* =========================
   styles factory (shorter)
========================= */
function S(tt) {
  const card = {
    borderRadius: 16,
    border: `1px solid ${tt.border}`,
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 18px 42px rgba(17,24,39,0.10)",
    overflow: "hidden",
  };

  const btnBase = { borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 950 };

  return {
    page: {
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      padding: 22,
      color: tt.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },

    bg: { position: "fixed", inset: 0, zIndex: -2, background: tt.pageBg },
    bgGrid: {
      position: "fixed",
      inset: 0,
      zIndex: -1,
      backgroundImage:
        "linear-gradient(to right, rgba(17,24,39,0.04) 1px, transparent 1px)," +
        "linear-gradient(to bottom, rgba(17,24,39,0.04) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
      opacity: 0.10,
      pointerEvents: "none",
    },

    container: { maxWidth: 1180, margin: "0 auto" },

    topbar: {
      maxWidth: 1180,
      margin: "0 auto 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },

    breadcrumb: { display: "flex", alignItems: "center", gap: 10, color: "rgba(17,24,39,0.62)", fontWeight: 850, fontSize: 13 },

    btn: { ...btnBase, border: `1px solid ${tt.border}`, background: "rgba(255,255,255,0.90)", color: "rgba(17,24,39,0.86)" },
    btnPrimary: { ...btnBase, border: "none", background: `linear-gradient(90deg, ${tt.primary}, ${tt.primary2})`, color: "#fff" },
    btnDanger: { ...btnBase, border: "none", background: `linear-gradient(90deg, ${tt.danger}, ${tt.danger2})`, color: "#fff" },

    hero: { ...card, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
    heroLeft: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
    avatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 999,
      overflow: "hidden",
      border: "1px solid rgba(17,24,39,0.10)",
      background: "rgba(17,24,39,0.06)",
      boxShadow: "0 12px 24px rgba(17,24,39,0.10)",
      display: "grid",
      placeItems: "center",
      flex: "0 0 auto",
    },
    avatarFallback: {
      width: "100%",
      height: "100%",
      display: "grid",
      placeItems: "center",
      fontWeight: 950,
      color: "#fff",
      background: `linear-gradient(135deg, ${tt.primary}, ${tt.primary2})`,
    },
    heroName: { margin: 0, fontSize: 22, fontWeight: 950, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    heroEmail: { marginTop: 4, fontSize: 13, fontWeight: 850, color: "rgba(17,24,39,0.62)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

    grid: { marginTop: 14, display: "grid", gridTemplateColumns: "320px 1fr", gap: 14 },
    sidebar: { ...card, padding: 12, height: "fit-content" },

    sideTitle: { margin: "8px 10px 10px", fontSize: 12, fontWeight: 950, color: "rgba(17,24,39,0.62)", textTransform: "uppercase", letterSpacing: "0.6px" },
    navItem: (active) => ({
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "11px 12px",
      borderRadius: 12,
      cursor: "pointer",
      fontWeight: 950,
      border: active ? "1px solid rgba(47,111,237,0.22)" : "1px solid transparent",
      background: active ? "rgba(47,111,237,0.10)" : "transparent",
      color: active ? tt.primary : "rgba(17,24,39,0.84)",
      textAlign: "left",
    }),
    sideActions: { marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(17,24,39,0.08)", display: "grid", gap: 10 },

    content: { display: "grid", gap: 14 },

    card,
    cardHeader: { padding: "14px 16px", borderBottom: "1px solid rgba(17,24,39,0.08)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
    cardTitle: { fontWeight: 950, color: "#111827" },
    cardSubtitle: { fontSize: 12, fontWeight: 850, color: "rgba(17,24,39,0.62)" },
    cardBody: { padding: 16 },

    fieldGrid: { display: "grid", gridTemplateColumns: "190px 1fr", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(17,24,39,0.06)" },
    label: { color: "rgba(17,24,39,0.70)", fontWeight: 900, fontSize: 13 },
    valueText: { fontWeight: 950, fontSize: 13, color: "rgba(17,24,39,0.90)", wordBreak: "break-word" },

    input: { width: "min(560px, 100%)", padding: "12px 14px", borderRadius: 12, border: `1px solid ${tt.inputBorder}`, background: tt.inputBg, outline: "none", fontSize: 14, color: tt.text },
    select: { width: "min(420px, 100%)", padding: "12px 14px", borderRadius: 12, border: `1px solid ${tt.inputBorder}`, background: tt.inputBg, outline: "none", fontSize: 14, color: tt.text, cursor: "pointer" },

    btnRow: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },

    hintBox: { marginTop: 10, borderRadius: 14, border: "1px solid rgba(47,111,237,0.18)", background: "rgba(47,111,237,0.06)", padding: 12, color: "rgba(17,24,39,0.78)", fontSize: 13, fontWeight: 850, lineHeight: 1.4 },

    errorBox: {
      borderRadius: 14,
      border: "1px solid rgba(226,61,61,0.22)",
      background: "rgba(226,61,61,0.08)",
      padding: 12,
      color: "rgba(17,24,39,0.92)",
      fontWeight: 850,
      fontSize: 13,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },

    statusRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 },
    statusTitle: { fontWeight: 950, color: "rgba(17,24,39,0.92)" },
    statusSub: { fontSize: 12, fontWeight: 850, color: "rgba(17,24,39,0.62)", marginTop: 2 },

    loading: { minHeight: "60vh", display: "grid", placeItems: "center", color: tt.muted, fontWeight: 950 },
  };
}

/* =========================
   page
========================= */
export default function ProfilePage({ user, profile, onProfileUpdated }) {
  const navigate = useNavigate();
  const { locale, setLocale, timezone, setTimezone, t } = useLocale();

  const [tab, setTab] = useState("profile"); // profile | preferences | security
  const [toast, setToast] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [sendingReset, setSendingReset] = useState(false);
  const [signOutOthersBusy, setSignOutOthersBusy] = useState(false);
  const [signOutAllBusy, setSignOutAllBusy] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, intent: "", title: "", subtitle: "" });

  const [dbProfile, setDbProfile] = useState(profile || null);
  const [sessionUser, setSessionUser] = useState(null);

  const [username, setUsername] = useState(profile?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [theme, setTheme] = useState(profile?.theme || "system");
  const [emailNotif, setEmailNotif] = useState(profile?.email_notif ?? true);
  const [inappNotif, setInappNotif] = useState(profile?.inapp_notif ?? true);
  const [reduceMotion, setReduceMotion] = useState(profile?.reduce_motion ?? false);

  const showToast = (payload) => setToast(payload);

  const themeTokens = useMemo(
    () => ({
      pageBg: "#f6f7fb",
      text: "#111827",
      muted: "#6b7280",
      border: "rgba(17,24,39,0.14)",
      primary: "#2f6fed",
      primary2: "#1f5fe2",
      danger: "#e25555",
      danger2: "#cf3f3f",
      inputBorder: "rgba(17,24,39,0.16)",
      inputBg: "rgba(255,255,255,0.98)",
    }),
    []
  );

  const styles = useMemo(() => S(themeTokens), [themeTokens]);

  /* =========================
     load fresh profile + auth user
  ========================= */
  useEffect(() => {
    let mounted = true;

    async function load() {
      setPageError("");
      try {
        setLoading(true);

        const { data: p, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user?.id)
          .maybeSingle();
        if (pErr) throw pErr;

        const { data, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        if (!mounted) return;

        setDbProfile(p || null);

        setUsername(p?.username || "");
        setAvatarUrl(p?.avatar_url || "");

        setTheme(p?.theme || "system");
        setEmailNotif(p?.email_notif ?? true);
        setInappNotif(p?.inapp_notif ?? true);
        setReduceMotion(p?.reduce_motion ?? false);

        setSessionUser(data?.user || null);
        setEmail(user?.email || data?.user?.email || "");
      } catch (err) {
        if (mounted) setPageError(safeErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (user?.id) load();
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.email]);

  const displayName = username?.trim() || dbProfile?.username || "User";
  const firstLetter = (displayName || "U").slice(0, 1).toUpperCase();

  const lastSignIn = sessionUser?.last_sign_in_at || sessionUser?.last_sign_in || null;
  const createdAt = sessionUser?.created_at || null;

  const avatarPublicUrl = useMemo(() => {
    if (!avatarUrl) return "";
    if (avatarUrl.startsWith("http")) return avatarUrl;
    const { data } = supabase.storage.from("avatars").getPublicUrl(avatarUrl);
    return data?.publicUrl || "";
  }, [avatarUrl]);

  /* =========================
     "dirty" detection (enterprise UX)
  ========================= */
  const prefsDirty =
    locale !== (dbProfile?.locale || "en") ||
    timezone !== (dbProfile?.timezone || "Asia/Singapore") ||
    theme !== (dbProfile?.theme || "system") ||
    emailNotif !== (dbProfile?.email_notif ?? true) ||
    inappNotif !== (dbProfile?.inapp_notif ?? true) ||
    reduceMotion !== (dbProfile?.reduce_motion ?? false);

  const profileDirty = username.trim() !== (dbProfile?.username || "");

  /* =========================
     actions
  ========================= */
  const doLogout = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/");
    } finally {
      setSigningOut(false);
    }
  };

  const refreshLocalProfile = async () => {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setDbProfile(p || null);
  };

  const saveUsername = async () => {
    const next = username.trim();
    if (!next) {
      showToast({ tone: "danger", icon: "⚠️", title: "Invalid username", message: "Username cannot be empty." });
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").update({ username: next }).eq("id", user.id);
      if (error) throw error;

      await refreshLocalProfile();
      if (typeof onProfileUpdated === "function") onProfileUpdated();

      showToast({ tone: "success", icon: "✅", title: "Saved", message: "Username updated." });
    } catch (err) {
      showToast({ tone: "danger", icon: "⚠️", title: "Save failed", message: safeErrorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const payload = {
        locale,
        timezone,
        theme,
        email_notif: emailNotif,
        inapp_notif: inappNotif,
        reduce_motion: reduceMotion,
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;

      await refreshLocalProfile();
      if (typeof onProfileUpdated === "function") onProfileUpdated();

      showToast({ tone: "success", icon: "✅", title: "Saved", message: "Preferences updated." });
    } catch (err) {
      showToast({ tone: "danger", icon: "⚠️", title: "Save failed", message: safeErrorMessage(err) });
    } finally {
      setSavingPrefs(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    if (!isImageFile(file)) {
      showToast({ tone: "danger", icon: "⚠️", title: "Invalid file", message: "Please upload an image file." });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast({ tone: "danger", icon: "⚠️", title: "Too large", message: "Max 3MB. Use a smaller image." });
      return;
    }

    setAvatarBusy(true);
    try {
      const ext = extFromFile(file);
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, cacheControl: "3600" });

      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: filePath }).eq("id", user.id);
      if (dbErr) throw dbErr;

      setAvatarUrl(filePath);
      await refreshLocalProfile();
      if (typeof onProfileUpdated === "function") onProfileUpdated();

      showToast({ tone: "success", icon: "🖼️", title: "Updated", message: "Profile picture updated." });
    } catch (err) {
      showToast({ tone: "danger", icon: "⚠️", title: "Upload failed", message: safeErrorMessage(err) });
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    try {
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        await supabase.storage.from("avatars").remove([avatarUrl]);
      }
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      if (error) throw error;

      setAvatarUrl("");
      await refreshLocalProfile();
      if (typeof onProfileUpdated === "function") onProfileUpdated();

      showToast({ tone: "success", icon: "✅", title: "Removed", message: "Profile picture removed." });
    } catch (err) {
      showToast({ tone: "danger", icon: "⚠️", title: "Failed", message: safeErrorMessage(err) });
    } finally {
      setAvatarBusy(false);
    }
  };

  const sendResetPasswordEmail = async () => {
    try {
      if (!email) {
        showToast({ tone: "danger", icon: "⚠️", title: "No email", message: "Your account email is missing." });
        return;
      }

      setSendingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;

      showToast({ tone: "success", icon: "📧", title: "Reset sent", message: "Check your email for the reset link." });
    } catch (err) {
      showToast({ tone: "danger", icon: "⚠️", title: "Reset failed", message: safeErrorMessage(err) });
    } finally {
      setSendingReset(false);
    }
  };

  const signOutOtherDevices = async () => {
    try {
      setSignOutOthersBusy(true);
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      showToast({ tone: "success", icon: "✅", title: "Done", message: "Signed out other devices." });
    } catch (err) {
      showToast({ tone: "danger", icon: "⚠️", title: "Failed", message: safeErrorMessage(err) });
    } finally {
      setSignOutOthersBusy(false);
    }
  };

  const signOutAllDevices = async () => {
    try {
      setSignOutAllBusy(true);
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      showToast({ tone: "success", icon: "✅", title: "Signed out everywhere", message: "Please log in again." });
      navigate("/");
    } catch (err) {
      showToast({ tone: "danger", icon: "⚠️", title: "Failed", message: safeErrorMessage(err) });
    } finally {
      setSignOutAllBusy(false);
    }
  };

  const openConfirmSignoutAll = () => {
    setConfirm({
      open: true,
      intent: "signout_all",
      title: "Sign out all devices?",
      subtitle: "This ends all sessions including this one. You must log in again.",
    });
  };

  const runConfirm = async () => {
    if (confirm.intent === "signout_all") {
      setConfirm({ open: false, intent: "", title: "", subtitle: "" });
      await signOutAllDevices();
      return;
    }
    setConfirm({ open: false, intent: "", title: "", subtitle: "" });
  };

  if (loading) return <div style={styles.loading}>Loading profile…</div>;

  return (
    <main style={styles.page}>
      <style>{`@media (max-width: 980px){ ._profile_grid { grid-template-columns: 1fr !important; } }`}</style>

      <div style={styles.bg} aria-hidden="true" />
      <div style={styles.bgGrid} aria-hidden="true" />

      <Toast toast={toast} onClose={() => setToast(null)} />

      <Modal
        open={confirm.open}
        title={confirm.title}
        subtitle={confirm.subtitle}
        onClose={() => setConfirm({ open: false, intent: "", title: "", subtitle: "" })}
        footer={
          <>
            <button style={styles.btn} onClick={() => setConfirm({ open: false, intent: "", title: "", subtitle: "" })}>
              Cancel
            </button>
            <button style={styles.btnDanger} onClick={runConfirm} disabled={signOutAllBusy}>
              {signOutAllBusy ? "Signing out…" : "Sign out all"}
            </button>
          </>
        }
      >
        <div style={{ color: "rgba(17,24,39,0.78)", fontWeight: 850, fontSize: 13, lineHeight: 1.4 }}>
          If you suspect compromise, sign out all devices then reset password.
        </div>
      </Modal>

      {/* TOP BAR */}
      <div style={styles.topbar}>
        <div style={styles.breadcrumb}>
          <span>{t("nav.account")}</span>
          <span style={{ opacity: 0.55 }}>›</span>
          <span style={{ color: "rgba(17,24,39,0.82)" }}>{t("nav.settings")}</span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.btn} onClick={() => navigate(-1)}>
            ← {t("nav.back")}
          </button>
          <button style={styles.btnDanger} onClick={doLogout} disabled={signingOut}>
            {signingOut ? "Logging out…" : t("nav.logout")}
          </button>
        </div>
      </div>

      <div style={styles.container}>
        {/* HERO */}
        <div style={styles.hero}>
          <div style={styles.heroLeft}>
            <div style={styles.avatarWrap}>
              {avatarPublicUrl ? (
                <img src={avatarPublicUrl} alt="Profile avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={styles.avatarFallback}>{firstLetter}</div>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <h1 style={styles.heroName}>{displayName}</h1>
              <div style={styles.heroEmail}>{email || "—"}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Pill tone="brand">KIRO</Pill>
            <Pill>Supabase Auth</Pill>
          </div>
        </div>

        {/* Error banner */}
        {pageError && (
          <div style={{ ...styles.errorBox, marginTop: 12 }}>
            <div>
              <div style={{ fontWeight: 950, marginBottom: 4 }}>Something went wrong</div>
              <div style={{ opacity: 0.95 }}>{pageError}</div>
            </div>
            <button style={styles.btn} onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        )}

        {/* MAIN GRID */}
        <div className="_profile_grid" style={styles.grid}>
          {/* LEFT NAV */}
          <aside style={styles.sidebar}>
            <div style={styles.sideTitle}>{t("nav.settings")}</div>

            <button style={styles.navItem(tab === "profile")} onClick={() => setTab("profile")}>
              {t("nav.profile")}
            </button>

            <button style={styles.navItem(tab === "preferences")} onClick={() => setTab("preferences")}>
              {t("nav.preferences")}
            </button>

            <button style={styles.navItem(tab === "security")} onClick={() => setTab("security")}>
              {t("nav.security")}
            </button>

            <div style={styles.sideActions}>
              <button style={styles.btn} onClick={() => navigate("/organisations")}>
                {t("nav.workspaces")}
              </button>
              <button style={styles.btn} onClick={() => navigate("/kanban")}>
                {t("nav.kanban")}
              </button>
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <div style={styles.content}>
            {/* PROFILE TAB */}
            {tab === "profile" && (
              <>
                <SectionCard
                  styles={styles}
                  title={t("nav.profile")}
                  subtitle="Your identity shown across the app."
                  right={<Pill tone={profileDirty ? "neutral" : "success"}>{profileDirty ? "Draft" : "Saved"}</Pill>}
                >
                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>User ID</div>
                    <div style={styles.valueText}>{user?.id || "—"}</div>
                  </div>

                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>Email</div>
                    <div style={styles.valueText}>{email || "—"}</div>
                  </div>

                  <div style={{ ...styles.fieldGrid, borderBottom: "none" }}>
                    <div style={styles.label}>Username</div>
                    <div>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        placeholder="Enter username"
                        onKeyDown={(e) => e.key === "Enter" && saveUsername()}
                        aria-label="Username"
                      />
                    </div>
                  </div>

                  <div style={styles.btnRow}>
                    <button
                      style={{ ...styles.btnPrimary, opacity: profileDirty ? 1 : 0.6 }}
                      onClick={saveUsername}
                      disabled={savingProfile || !profileDirty}
                    >
                      {savingProfile ? "Saving…" : "Save username"}
                    </button>

                    <button
                      style={styles.btn}
                      onClick={() => {
                        setUsername(dbProfile?.username || "");
                        showToast({ tone: "info", icon: "↩️", title: "Reverted", message: "Changes discarded." });
                      }}
                      disabled={savingProfile || !profileDirty}
                    >
                      Cancel
                    </button>
                  </div>
                </SectionCard>

                <SectionCard
                  styles={styles}
                  title="Profile picture"
                  subtitle="Upload a square image (recommended 512×512). Max 3MB."
                  right={<Pill tone={avatarPublicUrl ? "success" : "neutral"}>{avatarPublicUrl ? "Set" : "Not set"}</Pill>}
                >
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ ...styles.btnPrimary, display: "inline-flex", alignItems: "center", gap: 10, cursor: avatarBusy ? "not-allowed" : "pointer" }}>
                      {avatarBusy ? "Working…" : "Upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => uploadAvatar(e.target.files?.[0])}
                        disabled={avatarBusy}
                      />
                    </label>

                    <button style={styles.btn} onClick={removeAvatar} disabled={avatarBusy || !avatarUrl}>
                      Remove
                    </button>

                    <div style={{ color: "rgba(17,24,39,0.62)", fontWeight: 850, fontSize: 13 }}>PNG/JPG recommended.</div>
                  </div>

                  <div style={styles.hintBox}>
                    <div style={{ fontWeight: 950, marginBottom: 6 }}>Tip</div>
                    <div>
                      Store path in <code>profiles.avatar_url</code> like <code>{user?.id}/avatar.png</code>.
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {/* PREFERENCES TAB */}
            {tab === "preferences" && (
              <>
                <div style={styles.statusRow}>
                  <div>
                    <div style={styles.statusTitle}>{t("nav.preferences")}</div>
                    <div style={styles.statusSub}>{prefsDirty ? "You have unsaved changes." : "All changes are saved."}</div>
                  </div>
                  <Pill tone={prefsDirty ? "neutral" : "success"}>{prefsDirty ? "Draft" : "Saved"}</Pill>
                </div>

                <SectionCard
                  styles={styles}
                  title={t("prefs.language_region")}
                  subtitle="Language and timezone settings."
                  right={<Pill tone="brand">Standard</Pill>}
                >
                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>{t("prefs.language")}</div>
                    <div>
                      <select value={locale} onChange={(e) => setLocale(e.target.value)} style={styles.select} aria-label="Language">
                        <option value="en">English</option>
                        <option value="zh">Chinese (中文)</option>
                        <option value="ms">Malay</option>
                        <option value="ta">Tamil</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ ...styles.fieldGrid, borderBottom: "none" }}>
                    <div style={styles.label}>{t("prefs.timezone")}</div>
                    <div>
                      <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={styles.select} aria-label="Timezone">
                        <option value="Asia/Singapore">Asia/Singapore</option>
                        <option value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur</option>
                        <option value="Asia/Jakarta">Asia/Jakarta</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard styles={styles} title={t("prefs.appearance")} subtitle="Display and notification preferences." right={<Pill>Policy</Pill>}>
                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>{t("prefs.theme")}</div>
                    <div>
                      <select value={theme} onChange={(e) => setTheme(e.target.value)} style={styles.select} aria-label="Theme">
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <Switch checked={reduceMotion} onChange={setReduceMotion} label="Reduce motion" description="Accessibility setting." />
                    <Switch checked={inappNotif} onChange={setInappNotif} label="In-app notifications" description="Show alerts inside KIRO." />
                    <Switch checked={emailNotif} onChange={setEmailNotif} label="Email notifications" description="Receive important account emails." />
                  </div>

                  <div style={styles.btnRow}>
                    <button
                      style={{ ...styles.btnPrimary, opacity: prefsDirty ? 1 : 0.6 }}
                      onClick={savePreferences}
                      disabled={savingPrefs || !prefsDirty}
                    >
                      {savingPrefs ? "Saving…" : t("prefs.save")}
                    </button>

                    <button
                      style={styles.btn}
                      onClick={() => {
                        setLocale(dbProfile?.locale || "en");
                        setTimezone(dbProfile?.timezone || "Asia/Singapore");
                        setTheme(dbProfile?.theme || "system");
                        setEmailNotif(dbProfile?.email_notif ?? true);
                        setInappNotif(dbProfile?.inapp_notif ?? true);
                        setReduceMotion(dbProfile?.reduce_motion ?? false);
                        showToast({ tone: "info", icon: "↩️", title: "Reverted", message: "Preferences discarded." });
                      }}
                      disabled={savingPrefs || !prefsDirty}
                    >
                      {t("prefs.discard")}
                    </button>
                  </div>

                  <div style={styles.hintBox}>
                    <div style={{ fontWeight: 950, marginBottom: 6 }}>Enterprise tip</div>
                    <div>Disable “Save” until changes are detected (done), to prevent accidental writes and improve audit clarity.</div>
                  </div>
                </SectionCard>
              </>
            )}

            {/* SECURITY TAB */}
            {tab === "security" && (
              <>
                <SectionCard styles={styles} title={t("nav.security")} subtitle="Session and access management." right={<Pill tone="success">Live</Pill>}>
                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>Last login</div>
                    <div style={styles.valueText}>{formatDateMaybe(lastSignIn)}</div>
                  </div>

                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>Account created</div>
                    <div style={styles.valueText}>{formatDateMaybe(createdAt)}</div>
                  </div>

                  <div style={{ ...styles.btnRow, marginTop: 10 }}>
                    <button style={styles.btn} onClick={signOutOtherDevices} disabled={signOutOthersBusy}>
                      {signOutOthersBusy ? "Working…" : "Sign out other devices"}
                    </button>

                    <button
                      style={{ ...styles.btn, borderColor: "rgba(226,61,61,0.22)", background: "rgba(226,61,61,0.10)", color: "rgba(207,63,63,1)" }}
                      onClick={openConfirmSignoutAll}
                      disabled={signOutAllBusy}
                    >
                      Sign out ALL devices
                    </button>
                  </div>

                  <div style={styles.hintBox}>
                    <div style={{ fontWeight: 950, marginBottom: 6 }}>Security note</div>
                    <div>For enterprise use, consider adding audit logs for sign-outs and password resets.</div>
                  </div>
                </SectionCard>

                <SectionCard styles={styles} title="Password" subtitle="Reset via secure email flow." right={<Pill tone="brand">Supabase</Pill>}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <button style={styles.btnPrimary} onClick={sendResetPasswordEmail} disabled={sendingReset}>
                      {sendingReset ? "Sending…" : "Send reset email"}
                    </button>
                    <div style={{ color: "rgba(17,24,39,0.62)", fontWeight: 850, fontSize: 13 }}>
                      You’ll receive a reset link in your inbox.
                    </div>
                  </div>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
