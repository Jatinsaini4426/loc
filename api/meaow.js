import { IncomingForm } from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";
import os from "os";
import path from "path";

export const config = { api: { bodyParser: false } };
export const runtime = "nodejs";

export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: "Missing TELEGRAM_TOKEN or CHAT_ID" });
  }

  try {
    // 1️⃣ Parse form
    let files;
    try {
      const form = new IncomingForm({
        keepExtensions: true,
        uploadDir: path.join(os.tmpdir()),
      });

      ({ files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) =>
          err ? reject(err) : resolve({ fields, files })
        );
      }));
    } catch (parseErr) {
      console.error("Form parse error:", parseErr.message);
      return res.status(400).json({ error: "Invalid form data" });
    }

    // 2️⃣ Validate file
    let photoFile = files?.photo;
    if (Array.isArray(photoFile)) photoFile = photoFile[0];

    if (!photoFile) {
      return res.status(400).json({ error: "No photo uploaded" });
    }

    let filepath, filename;
    try {
      filepath = photoFile.filepath || photoFile.path;
      filename = photoFile.originalFilename || "snapshot.jpg";

      if (!filepath || !fs.existsSync(filepath)) {
        return res.status(400).json({ error: "Uploaded file not found" });
      }
    } catch (fileErr) {
      console.error("File access error:", fileErr.message);
      return res.status(500).json({ error: "Could not process uploaded file" });
    }

    // 3️⃣ Send to Telegram
    try {
      const tgForm = new FormData();
      tgForm.append("chat_id", CHAT_ID);
      tgForm.append("photo", fs.createReadStream(filepath), filename);

      const response = await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
        tgForm,
        { headers: tgForm.getHeaders() }
      );

      if (!response.data.ok) {
        return res.status(400).json({ error: response.data.description });
      }

      return res.status(200).json({ success: true, data: response.data });
    } catch (telegramErr) {
      console.error(
        "Telegram API error:",
        telegramErr?.response?.data || telegramErr.message
      );
      return res
        .status(500)
        .json({ error: telegramErr?.response?.data || "Telegram API failed" });
    }
  } catch (err) {
    // 4️⃣ Catch any uncaught error
    console.error("Unexpected error:", err.message);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
