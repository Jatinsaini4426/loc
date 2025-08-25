import { IncomingForm } from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
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

  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("multipart/form-data")) {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Form parse error" });
      }

      if (!files.photo) {
        return res.status(400).json({ error: "Photo file missing" });
      }

      // Handle formidable file object which can be array or single
      let photoFile;
      if (Array.isArray(files.photo)) photoFile = files.photo[0];
      else photoFile = files.photo;

      try {
        const formData = new FormData();
        formData.append("chat_id", CHAT_ID);
        formData.append("caption", fields.message || "");
        formData.append(
          "photo",
          fs.createReadStream(photoFile.filepath),
          photoFile.originalFilename
        );

        const resp = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
          {
            method: "POST",
            body: formData,
            headers: formData.getHeaders(),
          }
        );

        const data = await resp.json();
        if (!data.ok) throw new Error(data.description);

        return res.status(200).json({ success: true, data });
      } catch (e) {
        console.error("Telegram send error:", e);
        return res.status(500).json({ error: e.message });
      }
    });
  } else if (contentType.includes("application/json")) {
    const { message } = await new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        if (!body) {
          resolve({});
        } else {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        }
      });
      req.on("error", reject);
    });

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
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
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(415).json({ error: "Unsupported Media Type" });
  }
}
