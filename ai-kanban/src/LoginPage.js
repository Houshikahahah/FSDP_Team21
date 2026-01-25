import React, { useEffect, useState } from "react";
import "./LoginPage.css";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

const slides = [
  { img: "/kanban1.svg", title: "Plan with Clarity", desc: "To Do → In Progress → Done, at a glance." },
  { img: "/chat.svg", title: "AI Assist", desc: "Generate subtasks, summaries, and next steps instantly." },
  { img: "/dashboard.svg", title: "Track Progress", desc: "Stay on top of your work with a clean dashboard view." },
];

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setSlideIndex((prev) => (prev + 1) % slides.length),
      4500
    );
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate("/organisations");
  };

  return (
    <div className="login-page">
      {/* ✅ This layer FORCE overrides any global dark background */}
      <div className="login-bg" aria-hidden="true"></div>

      <div className="login-card">
        {/* LEFT */}
        <div className="login-left">
          <div className="login-brand">
            <span className="login-logo">KIRO</span>
            <span className="login-badge">AI Kanban</span>
          </div>

          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label">
              <span>Email</span>
              <input
                type="email"
                className="login-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="login-label">
              <span>Password</span>
              <div className="login-password">
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && <div className="login-error">{error}</div>}

            <button className="login-primary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div className="login-divider">
              <span />
              <p>or</p>
              <span />
            </div>

            <Link to="/signup" className="login-outline">
              Create Account
            </Link>

            <p className="login-footnote">
              Tip: Use AI to auto-split big tasks into smaller ones.
            </p>
          </form>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <div className="right-inner">
            {slides.map((s, i) => (
              <div key={i} className={`right-slide ${i === slideIndex ? "active" : ""}`}>
                <img src={s.img} alt={s.title} />
                <h2>{s.title}</h2>
                <p>{s.desc}</p>
              </div>
            ))}

            <div className="right-dots">
              {slides.map((_, i) => (
                <span key={i} className={`right-dot ${i === slideIndex ? "active" : ""}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
