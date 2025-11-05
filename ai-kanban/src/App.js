import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import KanbanBoard from "./KanbanBoard";
import {
  createOrganisation,
  joinOrganisation,
  getMyOrganisations,
  getMembers,
  kickMember,
} from "./organisation";

function App() {
  const [user, setUser] = useState(null);
  const [createOrgName, setCreateOrgName] = useState("");
  const [joinOrgName, setJoinOrgName] = useState("");
  const [joinOrgPin, setJoinOrgPin] = useState("");
  const [organisations, setOrganisations] = useState([]);
  const [members, setMembers] = useState({});
  const [copied, setCopied] = useState(false);

  // Get the current Supabase user
  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  const loadUserOrganisations = useCallback(async () => {
    if (!user) return;

    const { data: orgs, error } = await getMyOrganisations(user.id);
    if (error) {
      console.error("Error fetching organisations:", error);
      return;
    }

    setOrganisations(orgs || []);

    const memberData = {};
    for (let org of orgs || []) {
      const { data: orgMembers, error: membersError } = await getMembers(org.id);
      if (!membersError) {
        memberData[org.id] = (orgMembers || []).filter((m) => m.user_id !== org.owner_id);
      }
    }
    setMembers(memberData);
  }, [user]);

  useEffect(() => {
    getCurrentUser().then(setUser);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadUserOrganisations();
  }, [loadUserOrganisations]);

  // --- AUTH ---
  const handleSignup = async () => {
    const email = prompt("Email:");
    const password = prompt("Password:");
    if (!email || !password) return alert("Email and password required.");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("Signed up! Please confirm your email before logging in.");
  };

  const handleLogin = async () => {
    const email = prompt("Email:");
    const password = prompt("Password:");
    if (!email || !password) return alert("Email and password required.");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    setUser(data.user);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return alert(error.message);
    setUser(null);
    setOrganisations([]);
    setMembers({});
  };

  // --- ORG CREATION ---
  const handleCreateOrg = async () => {
    if (!user) return alert("Please log in first.");
    if (!createOrgName) return alert("Enter an organisation name.");

    const { data, error } = await createOrganisation(createOrgName, user.id);
    if (error) return alert(error.message);

    alert(`Organisation "${createOrgName}" created! Your PIN: ${data.pin}`);
    setCreateOrgName("");
    loadUserOrganisations();
  };

  // --- JOIN ORG ---
  const handleJoinOrg = async () => {
    if (!user) return alert("Please log in first.");
    if (!joinOrgName || !joinOrgPin) return alert("Enter both name and PIN.");

    const { error } = await joinOrganisation(joinOrgName, joinOrgPin, user.id);
    if (error) return alert(error.message);

    alert(`Joined organisation "${joinOrgName}" successfully!`);
    setJoinOrgName("");
    setJoinOrgPin("");
    loadUserOrganisations();
  };

  // --- KICK MEMBER ---
  const handleKick = async (orgId, memberId) => {
    if (!orgId || !memberId) return alert("Org ID and member ID are required.");

    const { error } = await kickMember(orgId, memberId, user.id);
    if (error) return alert(error.message);

    alert("Member kicked!");
    loadUserOrganisations();
  };

  // --- COPY PIN ---
  const handleCopyPin = (pin) => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!user)
    return (
      <div style={{ padding: "2rem" }}>
        <h1>AI Kanban Demo</h1>
        <button onClick={handleSignup}>Sign Up</button>
        <button onClick={handleLogin}>Login</button>
      </div>
    );

  return (
    <div style={{ padding: "2rem" }}>
      <h1>AI Kanban Demo</h1>
      <p>Logged in as: {user.email}</p>
      <button onClick={handleLogout}>Logout</button>

      <hr />
      <h2>Create Organisation</h2>
      <input
        placeholder="Organisation Name"
        value={createOrgName}
        onChange={(e) => setCreateOrgName(e.target.value)}
      />
      <button onClick={handleCreateOrg}>Create</button>

      <hr />
      <h2>Join Organisation</h2>
      <input
        placeholder="Organisation Name"
        value={joinOrgName}
        onChange={(e) => setJoinOrgName(e.target.value)}
      />
      <input
        placeholder="Organisation PIN"
        value={joinOrgPin}
        onChange={(e) => setJoinOrgPin(e.target.value)}
      />
      <button onClick={handleJoinOrg}>Join</button>

      <hr />
      <h2>Your Organisations & Members</h2>
      {organisations.length === 0 ? (
        <p>No organisations yet.</p>
      ) : (
        organisations.map((org) => (
          <div
            key={org.id}
            style={{
              border: "1px solid #ccc",
              margin: "1rem 0",
              padding: "0.5rem",
              borderRadius: "8px",
            }}
          >
            <h3>{org.name}</h3>
            {user.id === org.owner_id && (
              <p>
                <strong>PIN:</strong> {org.pin}{" "}
                <button onClick={() => handleCopyPin(org.pin)}>
                  {copied ? "Copied!" : "Copy PIN"}
                </button>
              </p>
            )}
            <p>
              <strong>Owner:</strong> {org.owner_id === user.id ? "You" : org.owner_id}
            </p>
            <strong>Members:</strong>
            <ul>
              {members[org.id]?.length === 0 && <li>No members yet.</li>}
              {members[org.id]?.map((m) => (
                <li key={m.id}>
                  {m.user_id} - {m.role}{" "}
                  {user.id === org.owner_id && (
                    <button onClick={() => handleKick(org.id, m.user_id)}>Kick</button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <hr />
      <h2>Kanban Board</h2>
      <KanbanBoard />
    </div>
  );
}

export default App;
