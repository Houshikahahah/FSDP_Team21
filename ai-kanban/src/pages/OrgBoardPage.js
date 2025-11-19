
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import KanbanBoard from "../KanbanBoard";
import WorkItems from "../WorkItems";

import Sidebar from "../Sidebar"; 
import { supabase } from "../supabaseClient";

export default function OrgBoardPage({ user, profile }) {
  const { orgId } = useParams();

  const [socket, setSocket] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [orgInfo, setOrgInfo] = useState(null);

  // SAFE DISPLAY NAME
  const displayName = profile?.username || "User";
  // LOAD ORG + MEMBERS
  useEffect(() => {
    if (!orgId || !user) return;

    const load = async () => {
      const { data: org } = await supabase
        .from("organisations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();

      setOrgInfo(org);

      const { data: mem } = await supabase
        .from("organisation_members")
        .select("*, profiles(username)")
        .eq("organisation_id", orgId);

      setMembers(mem || []);
    };
    load();
  }, [orgId, user]);

  // SOCKET
  useEffect(() => {
    if (!user) return;
    if (!orgId || orgId === "undefined") return;   // 🛑 prevents broken socket

    console.log("🔌 Connecting socket with org:", orgId);

    const s = io("http://localhost:5000", {
      transports: ["websocket"],
      query: {
        userId: user.id,
        orgId: orgId,
        board: "personal",
      },
    });

    setSocket(s);

    s.on("loadTasks", (taskList) => setTasks(taskList || []));
    s.on("updateTasks", (taskList) => setTasks(taskList || []));
    s.on("boardSwitched", (taskList) => setTasks(taskList || []));

    s.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    return () => {
      console.log("🧹 Cleaning up socket...");
      s.disconnect();
    };
  }, [user, orgId]);

  /* -------------------------------------------------------
      RENDER
  ------------------------------------------------------- */
  return (
    <div className="org-layout">

      {/* <button
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          marginBottom: "1rem",
          cursor: "pointer",
        }}
        onClick={() => navigate("/organisations")}
      >
        ← Back to Workspaces
      </button> */}
{/* 
      <h1>{orgInfo?.name || "Workspace"}</h1>
      <p>
        Logged in as: <strong>{displayName}</strong>
      </p>
      <div style={{ margin: "1rem 0" }}>
        <h3>Members</h3>
        <ul>
          {members
            .sort((a, b) => (a.role === "owner" ? -1 : 1))
            .map((m) => (
              <li key={m.user_id}>
                {m.profiles?.username || "Unknown"} — {m.role}
              </li>
            ))}
        </ul>
      </div>

      <hr /> */}

      {socket ? (
        <KanbanBoard socket={socket} tasks={tasks} user={user} />
      ) : (
        <p>Connecting to board...</p>
      )}
    </div>
  );
}