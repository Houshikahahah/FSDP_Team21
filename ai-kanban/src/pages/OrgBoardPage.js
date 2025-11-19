import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import KanbanBoard from "../KanbanBoard";
import { supabase } from "../supabaseClient";

export default function OrgBoardPage({ user, profile }) {
  const { orgId } = useParams();

  const [socket, setSocket] = useState(null);
  const [tasks, setTasks] = useState([]);

  // -------------------------------------------------------
  // LOAD ORG — Minimal (no members, you removed it)
  // -------------------------------------------------------
  useEffect(() => {
    if (!orgId || !user) return;

    const load = async () => {
      try {
        await supabase
          .from("organisations")
          .select("*")
          .eq("id", orgId)
          .maybeSingle();
      } catch (err) {
        console.log("Org load error:", err);
      }
    };

    load();
  }, [orgId, user]);

  // -------------------------------------------------------
  // SOCKET CONNECTION
  // -------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    if (!orgId || orgId === "undefined") return;

    const s = io("http://localhost:5000", {
      transports: ["websocket"],
      query: {
        userId: user.id,
        orgId: orgId,
        board: "personal",
      },
    });

    setSocket(s);

    s.on("loadTasks", (taskList) => {
      if (Array.isArray(taskList)) setTasks(taskList);
    });

    s.on("updateTasks", (taskList) => {
      if (Array.isArray(taskList)) setTasks(taskList);
    });

    s.on("boardSwitched", (taskList) => {
      if (Array.isArray(taskList)) setTasks(taskList);
    });

    return () => s.disconnect();
  }, [user, orgId]);

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="org-layout">
      {socket ? (
        <KanbanBoard socket={socket} tasks={tasks} user={user} />
      ) : (
        <p>Connecting to board...</p>
      )}
    </div>
  );
}
