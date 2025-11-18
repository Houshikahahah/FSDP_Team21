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

  // Load user profile from "profiles" table
  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) console.error("Profile load error:", error);

    setProfile(data || null);
  };

  // AUTH SYSTEM — FIXED & STABLE VERSION
  useEffect(() => {
    let ignore = false;

    const init = async () => {
      // ❤️ FIX: getSession() never returns null incorrectly
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!ignore) {
        setUser(session?.user || null);

        if (session?.user) {
          await loadProfile(session.user.id);
        }

        setLoading(false);
      }
    };

    init();

    // Listen for login/logout/refresh events
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (ignore) return;

        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      ignore = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Loading UI (simple, non-blocking)
  if (loading) {
    return (
      <div style={{ padding: "2rem", fontSize: "20px" }}>
        Initializing...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={!user ? <LoginPage /> : <Navigate to="/organisations" />}
        />

        {/* SIGNUP */}
        <Route
          path="/signup"
          element={!user ? <SignupPage /> : <Navigate to="/organisations" />}
        />

        {/* HOME ORG PAGE (no sidebar) */}
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

        {/* KANBAN BOARD (with sidebar) */}
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

        {/* ANALYTICS DASHBOARD (with sidebar) */}
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

        {/* LIST VIEW */}
        <Route
          path="/org/:orgId/workitems"
          element={
            user ? (
              <WorkItems user={user} profile={profile} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
