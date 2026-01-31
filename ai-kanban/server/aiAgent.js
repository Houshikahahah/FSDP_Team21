// server/aiAgent.js (CommonJS)
// Hugging Face Inference Providers via OpenAI-compatible router

const OpenAIModule = require("openai");
const OpenAI = OpenAIModule?.default || OpenAIModule;

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL =
  process.env.HF_MODEL || "Qwen/Qwen2.5-Coder-7B-Instruct:featherless-ai";

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: HF_TOKEN || "MISSING_TOKEN",
});

function toMessages(chatHistory, userMessage) {
  const messages = [];

  messages.push({
    role: "system",
    content: "You are a helpful AI coding assistant. Be concise and correct.",
  });

  for (const h of chatHistory || []) {
    const text =
      h?.parts?.map((p) => p?.text).filter(Boolean).join("\n") || "";
    if (!text) continue;

    if (h.role === "user") messages.push({ role: "user", content: text });
    else messages.push({ role: "assistant", content: text }); // model/assistant => assistant
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}

async function runAIAgent(chatHistory, userMessage) {
  if (!process.env.HF_TOKEN) {
    throw new Error("Missing HF_TOKEN in environment variables");
  }

  const messages = toMessages(chatHistory, userMessage);

  const completion = await client.chat.completions.create({
    model: HF_MODEL,
    messages,
    temperature: 0.4,
    max_tokens: 500,
  });

  return completion.choices?.[0]?.message?.content || "";
}

module.exports = { runAIAgent };
