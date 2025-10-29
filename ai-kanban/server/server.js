require("dotenv").config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // ✅ Fix fetch

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// ====================== AI via CLAUDE (OpenRouter) ======================
async function processTaskWithClaude(taskTitle) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Aether Kanban AI Agent"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          { role: "system", content: "You are an expert AI coding agent. Be concise and technical." },
          { role: "user", content: `Task: ${taskTitle}. Provide a short technical progress update.` }
        ]
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "AI had no response";
  } catch (err) {
    console.error("Claude API Error:", err);
    return "AI error occurred";
  }
}

// ====================== DATABASE (Supabase) ======================
async function getAllTasks() {
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) console.error("❌ Supabase Read Error:", error);
  return data || [];
}

async function insertTask({ id, title }) {
  const { error } = await supabase.from("tasks").insert([{ id, title, status: "todo" }]);
  if (error) console.error("❌ Supabase Insert Error:", error);
}

async function updateTaskStatus(taskId, updates) {
  const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
  if (error) console.error("❌ Supabase Update Error:", error);
}

// ====================== EXPRESS + SOCKET ======================
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

io.on("connection", async (socket) => {
  console.log("✅ User connected:", socket.id);

  const tasks = await getAllTasks();
  socket.emit("loadTasks", tasks);

  socket.on("addTask", async ({ id, title }) => {
    await insertTask({ id, title });
    io.emit("updateTasks", await getAllTasks());
    console.log(`🆕 New task added: ${title}`);
  });

  socket.on("taskMoved", async ({ taskId, newStatus }) => {
    await updateTaskStatus(taskId, { status: newStatus });
    io.emit("updateTasks", await getAllTasks());
    console.log(`📦 Task moved to "${newStatus}"`);
  });

  socket.on("disconnect", () => console.log("❌ User disconnected:", socket.id));
});

// ====================== AI TASK PROCESSOR ======================
setInterval(async () => {
  let { data: progressTask } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "progress")
    .limit(1)
    .single();

  if (progressTask) {
    console.log(`🤖 AI working on: ${progressTask.title}`);
    const aiResponse = await processTaskWithClaude(progressTask.title);
    await updateTaskStatus(progressTask.id, { status: "done", ai_output: aiResponse });
  } else {
    let { data: todoTask } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "todo")
      .limit(1)
      .single();
    if (todoTask) {
      console.log(`🚀 AI starting task: ${todoTask.title}`);
      await updateTaskStatus(todoTask.id, { status: "progress" });
    }
  }

  io.emit("updateTasks", await getAllTasks());
}, 7000);

// ====================== SERVER START ======================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
