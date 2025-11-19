import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./SignupPage.css";


const slides = [
  {
    img: "/kanban1.svg",
    title: "Visualize Your Workflow",
    desc: "See tasks clearly across every stage.",
  },
  {
    img: "/chat.svg",
    title: "Communicate Effortlessly",
    desc: "Collaborate with teammates in real time.",
  },
  {
    img: "/dashboard.svg",   // ← changed here
    title: "Dashboard Overview",
    desc: "Monitor progress and key project metrics.",
  },
];


function SignupPage() {
  const navigate = useNavigate();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(
    (localStorage.getItem("theme") || "dark") === "dark"
  );
  const [slideIndex, setSlideIndex] = useState(0);


  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [darkMode]);


  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);


  // ------------------ HANDLE SIGNUP ------------------
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");


    if (!email.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }


    setLoading(true);


    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });


      if (error) throw error;


      alert("Account created! Please verify your email before logging in.");


      navigate("/"); // Redirect to login page
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-wrapper">
      <button
        className="theme-toggle"
        onClick={() => setDarkMode((v) => !v)}
        aria-label="Toggle theme"
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>


      <div className="auth-card">
        {/* Left Side: Signup Form */}
        <div className="auth-left">
          <h1 className="brand">Create Account</h1>
          <p className="subtitle">Join Kiro today</p>


          <form onSubmit={handleSignup} className="form">
            <label className="label">
              <span>Email</span>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>


            <label className="label">
              <span>Password</span>
              <div className="password">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>


            {error && <div className="error">{error}</div>}


            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>


            <div className="divider">Already have an account?</div>


            <Link to="/" className="btn btn--outline">
              Back to Login
            </Link>
          </form>
        </div>


        {/* Right Side: Slideshow */}
        <div className="auth-right">
          {slides.map((slide, i) => (
            <div key={i} className={`slide ${i === slideIndex ? "active" : ""}`}>
              <img src={slide.img} alt={slide.title} />
              <h2>{slide.title}</h2>
              <p>{slide.desc}</p>
            </div>
          ))}
          <div className="dots">
            {slides.map((_, i) => (
              <span key={i} className={`dot ${i === slideIndex ? "active" : ""}`}></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


export default SignupPage;



