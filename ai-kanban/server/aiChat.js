// server/aiChat.js (CommonJS)
console.log("✅ aiChat.js loaded (QWEN version: 2026-02-01-3)");

// ✅ import Qwen agent, and alias it so there is ZERO chance of name collision
const { runAIAgent: runQwenAgent } = require("./aiAgent.js");
console.log("✅ runQwenAgent type =", typeof runQwenAgent);

// In-memory session store
const sessions = new Map();

async function handleAIChat(req, res) {
  const { sessionId, message } = req.body || {};
  if (!message) return res.status(400).json({ error: "Message required" });

  const key = sessionId || "anon";
  const history = sessions.get(key) || [];

  try {
    // ✅ this now calls your Qwen HF router function
    const reply = await runQwenAgent(history, message);

    history.push(
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: reply }] }
    );

    // keep last ~20 turns
    if (history.length > 40) history.splice(0, history.length - 40);

    sessions.set(key, history);
    return res.json({ reply });
  } catch (err) {
    console.error("AI failed:", err);
    return res.status(500).json({
      error: "AI failed",
      details: err?.message || "unknown error",
    });
  }
}

module.exports = { handleAIChat };
