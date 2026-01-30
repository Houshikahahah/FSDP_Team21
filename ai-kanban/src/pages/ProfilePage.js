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
    return d.toLocaleString("en-SG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
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
   toast notification
========================= */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const tone = toast.tone || "neutral";
  const toneMap = {
    neutral: { bg: "rgba(255,255,255,0.96)", border: "rgba(255,255,255,0.3)", accent: "#64748b" },
    success: { bg: "rgba(16,185,129,0.95)", border: "rgba(255,255,255,0.25)", accent: "#059669" },
    danger: { bg: "rgba(239,68,68,0.95)", border: "rgba(255,255,255,0.25)", accent: "#dc2626" },
    info: { bg: "rgba(59,130,246,0.95)", border: "rgba(255,255,255,0.25)", accent: "#2563eb" },
    warning: { bg: "rgba(245,158,11,0.95)", border: "rgba(255,255,255,0.25)", accent: "#d97706" },
  };

  const config = toneMap[tone] || toneMap.neutral;

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 9999,
        width: "min(420px, calc(100vw - 48px))",
        padding: "16px 18px",
        borderRadius: 12,
        background: config.bg,
        border: `1px solid ${config.border}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.40), 0 0 0 1px rgba(0,0,0,0.08)",
        backdropFilter: "blur(16px)",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        color: tone === "neutral" ? "#1e293b" : "#fff",
        fontFamily: '"DM Sans", -apple-system, sans-serif',
        animation: "toastSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes toastSlide {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div style={{ fontSize: 20, lineHeight: "20px" }}>{toast.icon || "ℹ️"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: "-0.01em", marginBottom: 4 }}>
          {toast.title || "Notification"}
        </div>
        {toast.message && (
          <div
            style={{
              opacity: 0.92,
              fontSize: 13.5,
              lineHeight: 1.45,
              fontWeight: 500,
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
          fontWeight: 700,
          color: tone === "neutral" ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.7)",
          padding: 6,
          margin: -6,
          borderRadius: 8,
          fontSize: 16,
          lineHeight: "16px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = tone === "neutral" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

/* =========================
   modal
========================= */
function Modal({ open, title, subtitle, children, footer, onClose, danger }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        animation: "fadeIn 0.25s ease",
      }}
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlide {
          from { transform: scale(0.92) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>

      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          borderRadius: 16,
          background: "#fff",
          border: "1px solid rgba(226,232,240,0.6)",
          boxShadow: "0 32px 96px rgba(0,0,0,0.35)",
          overflow: "hidden",
          animation: "modalSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(226,232,240,0.8)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            background: danger ? "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)" : "linear-gradient(135deg, #f8fafc 0%, #fff 100%)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: danger ? "#991b1b" : "#0f172a", letterSpacing: "-0.02em" }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 13.5, fontWeight: 500, color: danger ? "#dc2626" : "#64748b", marginTop: 4 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: 700,
              color: "#64748b",
              padding: 8,
              margin: -8,
              borderRadius: 8,
              fontSize: 16,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 24 }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(226,232,240,0.8)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              flexWrap: "wrap",
              background: "#f8fafc",
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
   UI Components
========================= */
function Badge({ children, variant = "default" }) {
  const variants = {
    default: {
      bg: "linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)",
      color: "#475569",
      border: "1px solid rgba(148,163,184,0.3)",
    },
    primary: {
      bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    success: {
      bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    danger: {
      bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    warning: {
      bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.2)",
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        background: style.bg,
        color: style.color,
        border: style.border,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {children}
    </span>
  );
}

function Switch({ checked, onChange, label, description, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid rgba(226,232,240,0.6)",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b", letterSpacing: "-0.01em" }}>{label}</div>
        {description && (
          <div style={{ fontWeight: 500, fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        aria-pressed={checked}
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          border: "1px solid rgba(203,213,225,0.8)",
          background: checked
            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            : "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
          flex: "0 0 auto",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: checked ? "0 4px 14px rgba(59,130,246,0.35)" : "0 2px 8px rgba(0,0,0,0.08)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 24 : 3,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "#fff",
            boxShadow: "0 3px 12px rgba(0,0,0,0.18)",
            transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </button>
    </div>
  );
}

function Card({ title, subtitle, children, actions, variant = "default" }) {
  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(226,232,240,0.8)",
        background: "#fff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
        overflow: "hidden",
      }}
      aria-label={title}
    >
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid rgba(226,232,240,0.8)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          background: variant === "danger"
            ? "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #fff 100%)",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: variant === "danger" ? "#991b1b" : "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 13.5, fontWeight: 500, color: variant === "danger" ? "#dc2626" : "#64748b", marginTop: 4 }}>
              {subtitle}
            </div>
          )}
        </div>
        {actions}
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </section>
  );
}

/* =========================
   Main Profile Page
========================= */
export default function ProfilePage({ user, profile, onProfileUpdated }) {
  const navigate = useNavigate();
  const { locale, setLocale, timezone, setTimezone, t } = useLocale();

  const [tab, setTab] = useState("profile");
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

  /* =========================
     load profile + auth user
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
      showToast({ tone: "warning", icon: "⚠️", title: "Validation Error", message: "Username cannot be empty." });
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").update({ username: next }).eq("id", user.id);
      if (error) throw error;

      await refreshLocalProfile();
      if (typeof onProfileUpdated === "function") onProfileUpdated();

      showToast({ tone: "success", icon: "✓", title: "Profile Updated", message: "Username saved successfully." });
    } catch (err) {
      showToast({ tone: "danger", icon: "✕", title: "Update Failed", message: safeErrorMessage(err) });
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

      showToast({ tone: "success", icon: "✓", title: "Preferences Saved", message: "Settings updated successfully." });
    } catch (err) {
      showToast({ tone: "danger", icon: "✕", title: "Save Failed", message: safeErrorMessage(err) });
    } finally {
      setSavingPrefs(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    if (!isImageFile(file)) {
      showToast({ tone: "warning", icon: "⚠️", title: "Invalid File", message: "Please upload an image file." });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast({ tone: "warning", icon: "⚠️", title: "File Too Large", message: "Maximum file size is 3MB." });
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

      showToast({ tone: "success", icon: "✓", title: "Avatar Updated", message: "Profile picture uploaded successfully." });
    } catch (err) {
      showToast({ tone: "danger", icon: "✕", title: "Upload Failed", message: safeErrorMessage(err) });
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

      showToast({ tone: "success", icon: "✓", title: "Avatar Removed", message: "Profile picture removed." });
    } catch (err) {
      showToast({ tone: "danger", icon: "✕", title: "Operation Failed", message: safeErrorMessage(err) });
    } finally {
      setAvatarBusy(false);
    }
  };

  const sendResetPasswordEmail = async () => {
    try {
      if (!email) {
        showToast({ tone: "warning", icon: "⚠️", title: "No Email", message: "Account email is missing." });
        return;
      }

      setSendingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;

      showToast({ tone: "info", icon: "📧", title: "Reset Email Sent", message: "Check your inbox for password reset link." });
    } catch (err) {
      showToast({ tone: "danger", icon: "✕", title: "Request Failed", message: safeErrorMessage(err) });
    } finally {
      setSendingReset(false);
    }
  };

  const signOutOtherDevices = async () => {
    try {
      setSignOutOthersBusy(true);
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      showToast({ tone: "success", icon: "✓", title: "Sessions Terminated", message: "Signed out from other devices." });
    } catch (err) {
      showToast({ tone: "danger", icon: "✕", title: "Operation Failed", message: safeErrorMessage(err) });
    } finally {
      setSignOutOthersBusy(false);
    }
  };

  const signOutAllDevices = async () => {
    try {
      setSignOutAllBusy(true);
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      showToast({ tone: "success", icon: "✓", title: "All Sessions Ended", message: "Redirecting to login..." });
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      showToast({ tone: "danger", icon: "✕", title: "Operation Failed", message: safeErrorMessage(err) });
    } finally {
      setSignOutAllBusy(false);
    }
  };

  const openConfirmSignoutAll = () => {
    setConfirm({
      open: true,
      intent: "signout_all",
      title: "Terminate All Sessions?",
      subtitle: "This will end all active sessions including this one. You must log in again.",
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

  /* =========================
     Styles
  ========================= */
  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      color: "#f8fafc",
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: "relative",
      padding: "32px 24px",
    },

    container: {
      maxWidth: 1280,
      margin: "0 auto",
    },

    topNav: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 32,
      gap: 20,
      flexWrap: "wrap",
    },

    breadcrumb: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      color: "#94a3b8",
      fontSize: 13.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },

    navActions: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
    },

    btn: {
      padding: "11px 20px",
      borderRadius: 10,
      border: "1px solid rgba(148,163,184,0.25)",
      background: "rgba(255,255,255,0.08)",
      color: "#f8fafc",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      backdropFilter: "blur(8px)",
      fontFamily: '"DM Sans", sans-serif',
    },

    btnPrimary: {
      padding: "11px 20px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.2)",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
      fontFamily: '"DM Sans", sans-serif',
    },

    btnDanger: {
      padding: "11px 20px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.2)",
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 4px 16px rgba(239,68,68,0.4)",
      fontFamily: '"DM Sans", sans-serif',
    },

    hero: {
      background: "linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)",
      border: "1px solid rgba(148,163,184,0.2)",
      borderRadius: 20,
      padding: "28px 32px",
      marginBottom: 32,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      flexWrap: "wrap",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(148,163,184,0.1)",
      backdropFilter: "blur(16px)",
    },

    avatarSection: {
      display: "flex",
      alignItems: "center",
      gap: 20,
    },

    avatar: {
      width: 72,
      height: 72,
      borderRadius: 999,
      overflow: "hidden",
      border: "2px solid rgba(59,130,246,0.5)",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      boxShadow: "0 8px 24px rgba(59,130,246,0.35), 0 0 0 4px rgba(59,130,246,0.1)",
      display: "grid",
      placeItems: "center",
      fontSize: 28,
      fontWeight: 700,
      color: "#fff",
    },

    heroText: {
      flex: 1,
      minWidth: 0,
    },

    heroName: {
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: "-0.03em",
      color: "#f8fafc",
      margin: 0,
      marginBottom: 6,
    },

    heroEmail: {
      fontSize: 14.5,
      fontWeight: 500,
      color: "#94a3b8",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gap: 24,
      alignItems: "flex-start",
    },

    sidebar: {
      background: "rgba(30,41,59,0.6)",
      border: "1px solid rgba(148,163,184,0.2)",
      borderRadius: 16,
      padding: 16,
      backdropFilter: "blur(16px)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    },

    sideTitle: {
      fontSize: 11.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#64748b",
      margin: "12px 16px 10px",
    },

    navItem: (active) => ({
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderRadius: 12,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
      border: active ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
      background: active ? "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.15) 100%)" : "transparent",
      color: active ? "#93c5fd" : "#cbd5e1",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      textAlign: "left",
      boxShadow: active ? "0 4px 16px rgba(59,130,246,0.2)" : "none",
    }),

    sideActions: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: "1px solid rgba(148,163,184,0.15)",
      display: "grid",
      gap: 10,
    },

    content: {
      display: "grid",
      gap: 24,
    },

    fieldGrid: {
      display: "grid",
      gridTemplateColumns: "200px 1fr",
      gap: 16,
      alignItems: "center",
      padding: "14px 0",
      borderBottom: "1px solid rgba(226,232,240,0.6)",
    },

    label: {
      color: "#475569",
      fontWeight: 600,
      fontSize: 13.5,
    },

    valueText: {
      fontWeight: 500,
      fontSize: 14,
      color: "#1e293b",
      wordBreak: "break-word",
    },

    input: {
      width: "100%",
      maxWidth: 560,
      padding: "12px 16px",
      borderRadius: 10,
      border: "1px solid rgba(203,213,225,0.8)",
      background: "#fff",
      outline: "none",
      fontSize: 14,
      fontWeight: 500,
      color: "#1e293b",
      transition: "all 0.25s ease",
      fontFamily: '"DM Sans", sans-serif',
    },

    select: {
      width: "100%",
      maxWidth: 420,
      padding: "12px 16px",
      borderRadius: 10,
      border: "1px solid rgba(203,213,225,0.8)",
      background: "#fff",
      outline: "none",
      fontSize: 14,
      fontWeight: 500,
      color: "#1e293b",
      cursor: "pointer",
      transition: "all 0.25s ease",
      fontFamily: '"DM Sans", sans-serif',
    },

    btnRow: {
      marginTop: 20,
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
    },

    infoBox: {
      marginTop: 16,
      borderRadius: 12,
      border: "1px solid rgba(59,130,246,0.25)",
      background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(37,99,235,0.05) 100%)",
      padding: 16,
      color: "#334155",
      fontSize: 13.5,
      fontWeight: 500,
      lineHeight: 1.5,
    },

    errorBox: {
      borderRadius: 12,
      border: "1px solid rgba(239,68,68,0.3)",
      background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.10) 100%)",
      padding: 16,
      color: "#7f1d1d",
      fontWeight: 600,
      fontSize: 14,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      marginBottom: 24,
    },

    loading: {
      minHeight: "70vh",
      display: "grid",
      placeItems: "center",
      color: "#94a3b8",
      fontWeight: 600,
      fontSize: 16,
    },
  };

  if (loading) return <div style={styles.loading}>Loading your profile...</div>;

  return (
    <main style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        input:focus, select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        
        @media (max-width: 980px) {
          ._profile_grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <Modal
        open={confirm.open}
        title={confirm.title}
        subtitle={confirm.subtitle}
        danger={true}
        onClose={() => setConfirm({ open: false, intent: "", title: "", subtitle: "" })}
        footer={
          <>
            <button
              style={{
                ...styles.btn,
                background: "#fff",
                color: "#475569",
                border: "1px solid rgba(203,213,225,0.8)",
              }}
              onClick={() => setConfirm({ open: false, intent: "", title: "", subtitle: "" })}
            >
              Cancel
            </button>
            <button style={styles.btnDanger} onClick={runConfirm} disabled={signOutAllBusy}>
              {signOutAllBusy ? "Processing..." : "Terminate All Sessions"}
            </button>
          </>
        }
      >
        <div style={{ color: "#64748b", fontWeight: 500, fontSize: 14, lineHeight: 1.6 }}>
          If you suspect unauthorized access, sign out all devices immediately and reset your password.
          This action cannot be undone and will require you to log in again on all devices.
        </div>
      </Modal>

      <div style={styles.container}>
        {/* TOP NAV */}
        <div style={styles.topNav}>
          <div style={styles.breadcrumb}>
            <span>Account</span>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: "#cbd5e1" }}>Settings</span>
          </div>

          <div style={styles.navActions}>
            <button
              style={styles.btn}
              onClick={() => navigate(-1)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                e.currentTarget.style.borderColor = "rgba(148,163,184,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(148,163,184,0.25)";
              }}
            >
              ← Back
            </button>
            <button
              style={styles.btnDanger}
              onClick={doLogout}
              disabled={signingOut}
              onMouseEnter={(e) => {
                if (!signingOut) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(239,68,68,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.4)";
              }}
            >
              {signingOut ? "Logging out..." : "Sign Out"}
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {pageError && (
          <div style={styles.errorBox}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>System Error</div>
              <div style={{ opacity: 0.95 }}>{pageError}</div>
            </div>
            <button
              style={{
                ...styles.btn,
                background: "#fff",
                color: "#dc2626",
                border: "1px solid rgba(220,38,38,0.3)",
              }}
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        )}

        {/* HERO */}
        <div style={styles.hero}>
          <div style={styles.avatarSection}>
            <div style={styles.avatar}>
              {avatarPublicUrl ? (
                <img
                  src={avatarPublicUrl}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                firstLetter
              )}
            </div>

            <div style={styles.heroText}>
              <h1 style={styles.heroName}>{displayName}</h1>
              <div style={styles.heroEmail}>{email || "—"}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Badge variant="primary">RSAF</Badge>
            <Badge variant="success">Active</Badge>
            <Badge>Supabase Auth</Badge>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="_profile_grid" style={styles.grid}>
          {/* SIDEBAR */}
          <aside style={styles.sidebar}>
            <div style={styles.sideTitle}>Navigation</div>

            <button
              style={styles.navItem(tab === "profile")}
              onClick={() => setTab("profile")}
              onMouseEnter={(e) => {
                if (tab !== "profile") {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (tab !== "profile") {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              Profile
            </button>

            <button
              style={styles.navItem(tab === "preferences")}
              onClick={() => setTab("preferences")}
              onMouseEnter={(e) => {
                if (tab !== "preferences") {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (tab !== "preferences") {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              Preferences
            </button>

            <button
              style={styles.navItem(tab === "security")}
              onClick={() => setTab("security")}
              onMouseEnter={(e) => {
                if (tab !== "security") {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (tab !== "security") {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              Security
            </button>

            <div style={styles.sideActions}>
              <button
                style={{
                  ...styles.btn,
                  fontSize: 13,
                  padding: "10px 16px",
                }}
                onClick={() => navigate("/organisations")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
              >
                Workspaces
              </button>
              <button
                style={{
                  ...styles.btn,
                  fontSize: 13,
                  padding: "10px 16px",
                }}
                onClick={() => navigate("/kanban")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
              >
                Kanban Board
              </button>
            </div>
          </aside>

          {/* CONTENT */}
          <div style={styles.content}>
            {/* PROFILE TAB */}
            {tab === "profile" && (
              <>
                <Card
                  title="Profile Information"
                  subtitle="Your identity displayed across the system."
                  actions={<Badge variant={profileDirty ? "warning" : "success"}>{profileDirty ? "Unsaved" : "Saved"}</Badge>}
                >
                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>User ID</div>
                    <div style={styles.valueText}>{user?.id || "—"}</div>
                  </div>

                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>Email Address</div>
                    <div style={styles.valueText}>{email || "—"}</div>
                  </div>

                  <div style={{ ...styles.fieldGrid, borderBottom: "none" }}>
                    <div style={styles.label}>Username</div>
                    <div>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        placeholder="Enter your username"
                        onKeyDown={(e) => e.key === "Enter" && saveUsername()}
                        aria-label="Username"
                      />
                    </div>
                  </div>

                  <div style={styles.btnRow}>
                    <button
                      style={{
                        ...styles.btnPrimary,
                        opacity: profileDirty ? 1 : 0.6,
                        cursor: profileDirty && !savingProfile ? "pointer" : "not-allowed",
                      }}
                      onClick={saveUsername}
                      disabled={savingProfile || !profileDirty}
                      onMouseEnter={(e) => {
                        if (profileDirty && !savingProfile) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.4)";
                      }}
                    >
                      {savingProfile ? "Saving..." : "Save Username"}
                    </button>

                    <button
                      style={{
                        ...styles.btn,
                        background: "#fff",
                        color: "#475569",
                        border: "1px solid rgba(203,213,225,0.8)",
                        cursor: profileDirty && !savingProfile ? "pointer" : "not-allowed",
                        opacity: profileDirty ? 1 : 0.6,
                      }}
                      onClick={() => {
                        setUsername(dbProfile?.username || "");
                        showToast({ tone: "info", icon: "↩", title: "Changes Reverted", message: "Draft discarded." });
                      }}
                      disabled={savingProfile || !profileDirty}
                    >
                      Discard
                    </button>
                  </div>
                </Card>

                <Card
                  title="Profile Picture"
                  subtitle="Upload a square image (recommended 512×512px, max 3MB)."
                  actions={<Badge variant={avatarPublicUrl ? "success" : "default"}>{avatarPublicUrl ? "Active" : "Not Set"}</Badge>}
                >
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <label
                      style={{
                        ...styles.btnPrimary,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: avatarBusy ? "not-allowed" : "pointer",
                        opacity: avatarBusy ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!avatarBusy) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.4)";
                      }}
                    >
                      {avatarBusy ? "Uploading..." : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => uploadAvatar(e.target.files?.[0])}
                        disabled={avatarBusy}
                      />
                    </label>

                    <button
                      style={{
                        ...styles.btn,
                        background: "#fff",
                        color: "#475569",
                        border: "1px solid rgba(203,213,225,0.8)",
                        cursor: !avatarBusy && avatarUrl ? "pointer" : "not-allowed",
                        opacity: !avatarBusy && avatarUrl ? 1 : 0.6,
                      }}
                      onClick={removeAvatar}
                      disabled={avatarBusy || !avatarUrl}
                    >
                      Remove
                    </button>

                    <div style={{ color: "#64748b", fontWeight: 500, fontSize: 13 }}>
                      PNG, JPG, or WEBP format
                    </div>
                  </div>

                  <div style={styles.infoBox}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>Storage Information</div>
                    <div>
                      Profile pictures are stored securely in Supabase Storage. File path: <code>{user?.id}/avatar.[ext]</code>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* PREFERENCES TAB */}
            {tab === "preferences" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: -8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#f8fafc", letterSpacing: "-0.02em" }}>
                      User Preferences
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "#94a3b8", marginTop: 4 }}>
                      {prefsDirty ? "You have unsaved changes." : "All preferences are saved."}
                    </div>
                  </div>
                  <Badge variant={prefsDirty ? "warning" : "success"}>{prefsDirty ? "Unsaved" : "Saved"}</Badge>
                </div>

                <Card
                  title="Language & Region"
                  subtitle="Configure language and timezone settings."
                  actions={<Badge variant="primary">Standard</Badge>}
                >
                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>Language</div>
                    <div>
                      <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value)}
                        style={styles.select}
                        aria-label="Language"
                      >
                        <option value="en">English</option>
                        <option value="zh">Chinese (中文)</option>
                        <option value="ms">Malay (Bahasa Melayu)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ ...styles.fieldGrid, borderBottom: "none" }}>
                    <div style={styles.label}>Timezone</div>
                    <div>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        style={styles.select}
                        aria-label="Timezone"
                      >
                        <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                        <option value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur (GMT+8)</option>
                        <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                        <option value="UTC">UTC (GMT+0)</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <Card
                  title="Appearance & Notifications"
                  subtitle="Display preferences and notification settings."
                  actions={<Badge>System</Badge>}
                >
                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>Theme</div>
                    <div>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        style={styles.select}
                        aria-label="Theme"
                      >
                        <option value="system">System Default</option>
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(226,232,240,0.6)" }}>
                    <Switch
                      checked={reduceMotion}
                      onChange={setReduceMotion}
                      label="Reduce Motion"
                      description="Minimize animations for accessibility."
                    />
                    <Switch
                      checked={inappNotif}
                      onChange={setInappNotif}
                      label="In-App Notifications"
                      description="Show alerts and updates within the application."
                    />
                    <Switch
                      checked={emailNotif}
                      onChange={setEmailNotif}
                      label="Email Notifications"
                      description="Receive important account notifications via email."
                    />
                  </div>

                  <div style={styles.btnRow}>
                    <button
                      style={{
                        ...styles.btnPrimary,
                        opacity: prefsDirty ? 1 : 0.6,
                        cursor: prefsDirty && !savingPrefs ? "pointer" : "not-allowed",
                      }}
                      onClick={savePreferences}
                      disabled={savingPrefs || !prefsDirty}
                      onMouseEnter={(e) => {
                        if (prefsDirty && !savingPrefs) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.4)";
                      }}
                    >
                      {savingPrefs ? "Saving..." : "Save Preferences"}
                    </button>

                    <button
                      style={{
                        ...styles.btn,
                        background: "#fff",
                        color: "#475569",
                        border: "1px solid rgba(203,213,225,0.8)",
                        cursor: prefsDirty && !savingPrefs ? "pointer" : "not-allowed",
                        opacity: prefsDirty ? 1 : 0.6,
                      }}
                      onClick={() => {
                        setLocale(dbProfile?.locale || "en");
                        setTimezone(dbProfile?.timezone || "Asia/Singapore");
                        setTheme(dbProfile?.theme || "system");
                        setEmailNotif(dbProfile?.email_notif ?? true);
                        setInappNotif(dbProfile?.inapp_notif ?? true);
                        setReduceMotion(dbProfile?.reduce_motion ?? false);
                        showToast({ tone: "info", icon: "↩", title: "Changes Discarded", message: "Preferences reset." });
                      }}
                      disabled={savingPrefs || !prefsDirty}
                    >
                      Discard Changes
                    </button>
                  </div>

                  <div style={styles.infoBox}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>Enterprise Feature</div>
                    <div>
                      Save button is disabled until changes are detected to prevent accidental writes and improve audit trail clarity.
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* SECURITY TAB */}
            {tab === "security" && (
              <>
                <Card
                  title="Session Management"
                  subtitle="View and control your active sessions."
                  actions={<Badge variant="success">Active</Badge>}
                >
                  <div style={styles.fieldGrid}>
                    <div style={styles.label}>Last Login</div>
                    <div style={styles.valueText}>{formatDateMaybe(lastSignIn)}</div>
                  </div>

                  <div style={{ ...styles.fieldGrid, borderBottom: "none" }}>
                    <div style={styles.label}>Account Created</div>
                    <div style={styles.valueText}>{formatDateMaybe(createdAt)}</div>
                  </div>

                  <div style={styles.btnRow}>
                    <button
                      style={{
                        ...styles.btn,
                        background: "#fff",
                        color: "#475569",
                        border: "1px solid rgba(203,213,225,0.8)",
                      }}
                      onClick={signOutOtherDevices}
                      disabled={signOutOthersBusy}
                      onMouseEnter={(e) => {
                        if (!signOutOthersBusy) {
                          e.currentTarget.style.background = "#f8fafc";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      {signOutOthersBusy ? "Processing..." : "Sign Out Other Devices"}
                    </button>

                    <button
                      style={{
                        ...styles.btnDanger,
                        opacity: signOutAllBusy ? 0.6 : 1,
                      }}
                      onClick={openConfirmSignoutAll}
                      disabled={signOutAllBusy}
                      onMouseEnter={(e) => {
                        if (!signOutAllBusy) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(239,68,68,0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.4)";
                      }}
                    >
                      Terminate All Sessions
                    </button>
                  </div>

                  <div style={styles.infoBox}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>Security Advisory</div>
                    <div>
                      For enterprise deployments, consider implementing comprehensive audit logs for session management,
                      sign-out events, and password resets to maintain security compliance.
                    </div>
                  </div>
                </Card>

                <Card
                  title="Password Management"
                  subtitle="Reset your password via secure email verification."
                  actions={<Badge variant="primary">Encrypted</Badge>}
                  variant="danger"
                >
                  <div style={{ display: "grid", gap: 16 }}>
                    <button
                      style={{
                        ...styles.btnPrimary,
                        opacity: sendingReset ? 0.6 : 1,
                      }}
                      onClick={sendResetPasswordEmail}
                      disabled={sendingReset}
                      onMouseEnter={(e) => {
                        if (!sendingReset) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.4)";
                      }}
                    >
                      {sendingReset ? "Sending..." : "Send Password Reset Email"}
                    </button>
                    <div style={{ color: "#64748b", fontWeight: 500, fontSize: 13.5, lineHeight: 1.5 }}>
                      You'll receive a secure password reset link in your registered email inbox. The link expires after 1 hour.
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}