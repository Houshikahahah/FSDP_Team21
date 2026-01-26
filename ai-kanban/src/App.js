// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";

import Layout from "./Layout";
import Dashboard from "./Dashboard";
import WorkItems from "./WorkItems";
import OrgBoardPage from "./pages/OrgBoardPage";
import ProfilePage from "./pages/ProfilePage";

// ✅ already here
import { LocaleProvider } from "./LocaleContext";

// ✅ ADD: reset password page import
import ResetPasswordPage from "./pages/ResetPasswordPage";

import TimelineView from "./TimelineView";
// ✅ org page
import OrganisationDashboard from "./pages/OrganisationDashboard";

import { supabase } from "./supabaseClient";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const loadProfile = async (userId) => {
    if (!userId) return setProfile(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) console.error("loadProfile error:", error);
    setProfile(data || null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null;
      setUser(u);
      if (u) loadProfile(u.id);
      else setProfile(null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user || null;
        setUser(u);
        if (u) loadProfile(u.id);
        else setProfile(null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ✅ ADD: Auto-refresh profile when the profiles row changes (locale/timezone/etc)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("profiles-watch")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT/UPDATE/DELETE
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => {
          // When DB updates profile, refresh state so UI updates too
          loadProfile(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // re-subscribe only when user changes

  // ✅ helper: read active org (persist org mode)
  const activeOrgId = window.localStorage.getItem("activeOrgId");

  return (
    <BrowserRouter>
      {/* ✅ ADD ONLY: Provider wrapper (uses profile to set locale/timezone) */}
      <LocaleProvider profile={profile}>
        <Routes>
          {/* LOGIN */}
          <Route
            path="/"
            element={!user ? <LoginPage /> : <Navigate to="/kanban" />}
          />

          {/* SIGNUP */}
          <Route
            path="/signup"
            element={!user ? <SignupPage /> : <Navigate to="/kanban" />}
          />

          {/* ✅ ADD: Reset password page (Supabase redirect comes here) */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ORGANISATIONS PAGE */}
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
            path="/profile"
            element={
              user ? (
                <ProfilePage
                  user={user}
                  profile={profile}
                  onProfileUpdated={() => loadProfile(user.id)}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* PERSONAL KANBAN (HOME) */}
          <Route
            path="/kanban"
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

          {/* ORG WORKITEMS (SHARED BACKLOG) */}
          <Route
            path="/org/:id/workitems"
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

          {/* PERSONAL DASHBOARD */}
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

          {/* ✅ WORKITEMS (STICKY ORG MODE) */}
          <Route
            path="/workitems"
            element={
              user ? (
                activeOrgId ? (
                  <Navigate to={`/org/${activeOrgId}/workitems`} />
                ) : (
                  <Layout>
                    <WorkItems user={user} profile={profile} />
                  </Layout>
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* ✅ TIMELINE */}
          <Route
            path="/timeline"
            element={
              user ? (
                <Layout>
                  <TimelineView user={user} profile={profile} />
                </Layout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* CATCH-ALL */}
          <Route path="*" element={<Navigate to={user ? "/kanban" : "/"} />} />
        </Routes>
      </LocaleProvider>
    </BrowserRouter>
  );
}
