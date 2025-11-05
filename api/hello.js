import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.use(express.json());

// ✅ Allow CORS
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// ✅ POST endpoint
router.post("/", async (req, res) => {
  const { message } = req.body;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: "Missing Telegram credentials" });
  }

  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      }
    );

    const data = await resp.json();
    if (!data.ok) throw new Error(data.description);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Telegram API Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
