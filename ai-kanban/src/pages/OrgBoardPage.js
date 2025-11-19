import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import KanbanBoard from "../KanbanBoard";
import { supabase } from "../supabaseClient";

export default function OrgBoardPage({ user, profile }) {
  const { orgId } = useParams();
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [orgInfo, setOrgInfo] = useState(null);

  const displayName = profile?.username || "User";

  /* -------------------------------------------------------
      LOAD ORG + MEMBERS (SAFE)
  ------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    if (!orgId || orgId === "undefined") return;

    const load = async () => {
      try {
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
      } catch (err) {
        console.error("Load error:", err);
      }
    };

    load();
  }, [user, orgId]);

  /* -------------------------------------------------------
      SOCKET CONNECTION (FULLY FIXED)
  ------------------------------------------------------- */
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

    s.on("connect", () => {
      console.log("🟢 Socket connected:", s.id);
    });

    /* 🛡️ PROTECTED TASK HANDLERS — NEVER WIPE BOARD */
    s.on("loadTasks", (taskList) => {
      if (!Array.isArray(taskList)) return;       // prevent wiping
      console.log("📥 loadTasks:", taskList);
      setTasks(taskList);
    });

    s.on("updateTasks", (taskList) => {
      if (!Array.isArray(taskList)) return;       // prevent wiping
      console.log("🔄 updateTasks:", taskList);
      setTasks(taskList);
    });

    s.on("boardSwitched", (taskList) => {
      if (!Array.isArray(taskList)) return;       // prevent wiping
      console.log("📌 boardSwitched:", taskList);
      setTasks(taskList);
    });

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

      {/* HIDDEN HEADER (optional)
      <h1>{orgInfo?.name || "Workspace"}</h1>
      <p>Logged in as: <strong>{displayName}</strong></p>
      */ }

      {socket ? (
        <KanbanBoard
          socket={socket}
          tasks={tasks}
          user={user}
          orgId={orgId}
        />
      ) : (
        <p>Connecting to board...</p>
      )}
    </div>
  );
}
