import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import OrganisationDashboard from "./pages/OrganisationDashboard";
import OrgBoardPage from "./pages/OrgBoardPage";
import Dashboard from "./Dashboard";
import Layout from "./Layout";
import WorkItems from "./WorkItems";

import { supabase } from "./supabaseClient";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------
  // SAFE PROFILE LOADER
  // ----------------------------------------------------
  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) console.error("Profile load error:", error);

      setProfile(data || null);
    } catch (err) {
      console.error("Profile fetch failed:", err);
      setProfile(null);
    }
  };

  // ----------------------------------------------------
  // AUTH + TOKEN CORRUPTION AUTO-FIX
  // ----------------------------------------------------
  useEffect(() => {
    let stop = false;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;

        if (stop) return;

        setUser(session?.user || null);

        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch (err) {
        console.error("❌ Supabase session corrupted:", err);

        // 🧨 CORRUPTED TOKEN FIX — DELETE ALL SUPABASE TOKENS
        Object.keys(localStorage).forEach((k) => {
          if (k.includes("auth-token")) {
            console.warn("🔥 Removing broken token:", k);
            localStorage.removeItem(k);
          }
        });

        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
      } finally {
        if (!stop) setLoading(false); // ALWAYS stop loading
      }
    };

    init();

    // ----------------------------------------------------
    // AUTH LISTENER (also safe)
    // ----------------------------------------------------
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) await loadProfile(currentUser.id);
        else setProfile(null);

        setLoading(false);
      }
    );

    return () => {
      stop = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ----------------------------------------------------
  // LOADING SCREEN
  // ----------------------------------------------------
  if (loading) {
    return (
      <div style={{ padding: "3rem", fontSize: "24px", textAlign: "center" }}>
        Initializing…
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTES
  // ----------------------------------------------------
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={!user ? <LoginPage /> : <Navigate to="/organisations" />}
        />

        <Route
          path="/signup"
          element={!user ? <SignupPage /> : <Navigate to="/organisations" />}
        />

        <Route
          path="/organisations"
          element={
            user ? (
              <OrganisationDashboard user={user} profile={profile} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/org/:orgId"
          element={
            user ? (
              <Layout>
                <OrgBoardPage user={user} profile={profile} />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              <Layout>
                <Dashboard user={user} profile={profile} />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/org/:orgId/workitems"
          element={
            user ? (
              <Layout>
                <WorkItems user={user} profile={profile} />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
