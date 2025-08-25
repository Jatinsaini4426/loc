import { IncomingForm } from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = {
  api: { bodyParser: false },
};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Form parse error" });
    }

    if (!files.photo) {
      return res.status(400).json({ error: "Photo file missing" });
    }

    try {
      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("caption", fields.message || "");
      formData.append("photo", fs.createReadStream(files.photo.filepath));

      const resp = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
        { method: "POST", body: formData }
      );

      const data = await resp.json();
      if (!data.ok) throw new Error(data.description);

      res.status(200).json({ success: true, data });
    } catch (e) {
      console.error("Telegram send error:", e);
      res.status(500).json({ error: e.message });
    }
  });
}
