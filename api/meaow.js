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

  try {
    const form = new IncomingForm({
      keepExtensions: true,
      uploadDir: path.join(os.tmpdir()),
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve({ fields, files })
      );
    });

    let photoFile = files.photo;
    if (Array.isArray(photoFile)) photoFile = photoFile[0];
    if (!photoFile) {
      return res.status(400).json({ error: "No photo uploaded" });
    }

    const filepath = photoFile.filepath || photoFile.path;
    const filename = photoFile.originalFilename || "snapshot.jpg";

    const tgForm = new FormData();
    tgForm.append("chat_id", CHAT_ID);
    tgForm.append("photo", fs.createReadStream(filepath), filename);

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
      tgForm,
      { headers: tgForm.getHeaders() }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Telegram send error:", err?.response?.data || err.message);
    return res.status(500).json({ error: err?.response?.data || err.message });
  }
}
