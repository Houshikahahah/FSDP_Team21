// aiChat.js (CommonJS)
console.log("✅ aiChat.js loaded (version: 2026-02-01-1)");

const { runAIAgent } = require("./aiAgent.js");
console.log("✅ runAIAgent type =", typeof runAIAgent);

// In-memory session store
const sessions = new Map();

async function handleAIChat(req, res) {
  const { sessionId, message } = req.body || {};

  if (!message) return res.status(400).json({ error: "Message required" });

  const key = sessionId || "anon";

  const history =
    sessions.get(key) || [
      {
        role: "user",
        parts: [{ text: "You are a helpful AI assistant. Be concise and clear." }],
      },
    ];

  try {
    const reply = await runAIAgent(history, message);

    history.push(
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: reply }] }
    );

    if (history.length > 30) history.splice(1, 10);
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
