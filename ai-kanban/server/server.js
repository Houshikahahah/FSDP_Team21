// ====================== ENV & IMPORTS ======================
require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// ====================== SUPABASE ======================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ====================== AI via OpenRouter ======================
async function processTaskWithClaude(taskTitle) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Aether Kanban AI Agent",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            {
              role: "system",
              content: "You are an expert AI coding agent. Be concise.",
            },
            {
              role: "user",
              content: `Task: ${taskTitle}. Provide a short progress update.`,
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "No response.";
    return { output, modelUsed: data.model || "claude-3-haiku" };
  } catch (error) {
    console.error("Claude error:", error);
    return { output: "AI error", modelUsed: "claude-3-haiku" };
  }
}

// ====================== TASK HELPERS ======================
async function getTasks(socket) {
  const { orgId, userId, board } = socket;

  // MAIN BOARD: all tasks in org
  if (board === "main") {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, profiles:profiles(id, username, avatar_color)")
      .eq("organisation_id", orgId);

    if (error) console.error(error);
    return data || [];
  }

  // PERSONAL BOARD: only user's tasks
  const { data, error } = await supabase
    .from("tasks")
    .select("*, profiles:profiles(id, username, avatar_color)")
    .eq("organisation_id", orgId)
    .eq("user_id", userId);

  if (error) console.error(error);
  return data || [];
}


async function updateTask(taskId, updates) {
  const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
  if (error) console.error("Update error:", error);
}

// ====================== EXPRESS + SOCKET ======================
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
  },
});

// ====================== SOCKET EVENTS ======================
io.on("connection", async (socket) => {
  const { orgId, userId, board } = socket.handshake.query;

  socket.orgId = orgId;
  socket.userId = userId;
  socket.board = board || "personal";

  // Join board-level room
  socket.join(`${orgId}:${socket.board}`);

  console.log(
    `🔗 User ${socket.id} joined Org ${orgId}, Board = ${socket.board}`
  );

  socket.emit("loadTasks", await getTasks(socket));

  // ========= SWITCH BOARD =========
  socket.on("switchBoard", async ({ board }) => {
    socket.leave(`${socket.orgId}:${socket.board}`);

    socket.board = board;
    socket.join(`${socket.orgId}:${board}`);

    io.to(socket.id).emit("boardSwitched", await getTasks(socket));
  });

  // ========= ADD TASK =========
  socket.on("addTask", async ({ title }) => {
    const isMain = socket.board === "main";

    await supabase.from("tasks").insert([
      {
        title,
        status: "todo",
        organisation_id: socket.orgId,
        user_id: socket.userId,
        is_main_board: isMain,
      },
    ]);

    io.to(`${socket.orgId}:${socket.board}`).emit(
      "updateTasks",
      await getTasks(socket)
    );
  });

  // ========= MOVE TASK =========
  socket.on("taskMoved", async ({ taskId, newStatus }) => {
    await updateTask(taskId, {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    io.to(`${socket.orgId}:${socket.board}`).emit(
      "updateTasks",
      await getTasks(socket)
    );
  });

  // ========= RENAME TASK =========
  socket.on("renameTask", async ({ taskId, newTitle }) => {
    await updateTask(taskId, { title: newTitle });

    io.to(`${socket.orgId}:${socket.board}`).emit(
      "updateTasks",
      await getTasks(socket)
    );
  });

  // ========= DELETE TASK =========
  socket.on("deleteTask", async ({ taskId }) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) console.error("Delete error:", error);

    io.to(`${socket.orgId}:${socket.board}`).emit(
      "updateTasks",
      await getTasks(socket)
    );
  });

  socket.on("disconnect", () =>
    console.log("❌ User disconnected:", socket.id)
  );
});

// ====================== AI TASK AUTO LOOP ======================
setInterval(async () => {
  const now = Date.now();

  // 1️⃣ Finish old progress tasks
  const { data: progressTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "progress");

  if (progressTasks && progressTasks.length > 0) {
    for (const task of progressTasks) {
      const lastUpdate = new Date(task.updated_at || task.created_at).getTime();

      if (now - lastUpdate > 10000) {
        const { output, modelUsed } = await processTaskWithClaude(task.title);

        await updateTask(task.id, {
          status: "done",
          ai_output: output,
          ai_agent: modelUsed,
        });
      }
    }
  } else {
    // 2️⃣ Pick next todo
    const { data: todo } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "todo")
      .limit(1)
      .single();

    if (todo) {
      await updateTask(todo.id, {
        status: "progress",
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Broadcast updates to all rooms
  io.sockets.sockets.forEach(async (socket) => {
    socket.emit("updateTasks", await getTasks(socket));
  });
}, 7000);

// ====================== START SERVER ======================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
