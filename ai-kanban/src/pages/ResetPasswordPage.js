import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Optional: if the user opens without token, it still shows UI, but update will fail.
  useEffect(() => {
    setMsg("Enter a new password to finish resetting your account.");
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setMsg("");

    if (password.length < 6) return setMsg("Password must be at least 6 characters.");
    if (password !== confirm) return setMsg("Passwords do not match.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMsg("✅ Password updated! Please login again.");
      // sign out just in case + go login
      await supabase.auth.signOut();
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setMsg(err?.message || "Reset failed. Try opening the reset link again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "grid",
        placeItems: "center",
        background: "#f4f6fb",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <form
        onSubmit={save}
        style={{
          width: "min(520px, 100%)",
          borderRadius: 18,
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(17,24,39,0.14)",
          boxShadow: "0 24px 60px rgba(17,24,39,0.12)",
          padding: 18,
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 950, color: "#111827" }}>Reset Password</h2>
        <p style={{ marginTop: 6, color: "rgba(17,24,39,0.65)", fontWeight: 700, fontSize: 13 }}>
          Set a new password for your KIRO account.
        </p>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 12, color: "rgba(17,24,39,0.58)", textTransform: "uppercase" }}>
            New password
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(17,24,39,0.14)",
              outline: "none",
              fontWeight: 750,
            }}
            placeholder="At least 6 characters"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 12, color: "rgba(17,24,39,0.58)", textTransform: "uppercase" }}>
            Confirm password
          </div>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(17,24,39,0.14)",
              outline: "none",
              fontWeight: 750,
            }}
            placeholder="Repeat password"
          />
        </div>

        {msg && (
          <div style={{ marginTop: 12, fontWeight: 800, fontSize: 13, color: "rgba(17,24,39,0.75)" }}>
            {msg}
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          style={{
            width: "100%",
            marginTop: 14,
            borderRadius: 12,
            border: "none",
            padding: "12px 14px",
            fontWeight: 950,
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            background: loading
              ? "rgba(117,91,234,0.55)"
              : "linear-gradient(90deg, #755bea, #4f7cf7)",
            boxShadow: "0 14px 30px rgba(117,91,234,0.18)",
          }}
        >
          {loading ? "Saving..." : "Update password"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: 10,
            borderRadius: 12,
            border: "1px solid rgba(17,24,39,0.14)",
            padding: "12px 14px",
            fontWeight: 900,
            color: "rgba(17,24,39,0.75)",
            cursor: "pointer",
            background: "rgba(255,255,255,0.9)",
          }}
        >
          Back to Login
        </button>
      </form>
    </div>
  );
}
