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

  // ---------------------------------------
  // Load profile safely
  // ---------------------------------------
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

  // ---------------------------------------
  // AUTH HANDLING — STABLE VERSION
  // ---------------------------------------
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;

        if (isCancelled) return;

        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (!isCancelled) setLoading(false); // ❤️ ALWAYS STOP LOADING
      }
    };

    init();

    // Realtime auth listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser.id);
        } else {
          setProfile(null);
        }

        // ❤️ ALSO STOP LOADING HERE
        setLoading(false);
      }
    );

    return () => {
      isCancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------
  // Loading screen
  // ---------------------------------------
  if (loading) {
    return (
      <div style={{ padding: "3rem", fontSize: "24px", textAlign: "center" }}>
        Initializing…
      </div>
    );
  }

  // ---------------------------------------
  // ROUTES
  // ---------------------------------------
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

        {/* ORGANISATION HOME */}
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

        {/* KANBAN BOARD */}
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

        {/* ANALYTICS */}
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
