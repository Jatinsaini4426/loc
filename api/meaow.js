import express from "express";
import { IncomingForm } from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";
import os from "os";
import path from "path";

const router = express.Router();

// Disable Express default body parser for this route
router.use((req, res, next) => {
  next();
});

router.post("/", async (req, res) => {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("Missing TELEGRAM_TOKEN or CHAT_ID");
    return res.status(500).send(false);
  }

  try {
    // Parse incoming form data
    const form = new IncomingForm({
      keepExtensions: true,
      uploadDir: path.join(os.tmpdir()),
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve({ fields, files })
      );
    });

    let photoFile = files?.photo;
    if (Array.isArray(photoFile)) photoFile = photoFile[0];

    if (!photoFile) {
      console.error("No photo uploaded");
      return res.status(400).send(false);
    }

    const filepath = photoFile.filepath || photoFile.path;
    const filename = photoFile.originalFilename || "snapshot.jpg";

    if (!filepath || !fs.existsSync(filepath)) {
      console.error("Uploaded file not found");
      return res.status(400).send(false);
    }

    // Send to Telegram
    const tgForm = new FormData();
    tgForm.append("chat_id", CHAT_ID);
    tgForm.append("photo", fs.createReadStream(filepath), filename);

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
      tgForm,
      { headers: tgForm.getHeaders() }
    );

    if (response.data?.ok) {
      return res.status(200).send(true);
    } else {
      console.error("Telegram API Error:", response.data);
      return res.status(400).send(false);
    }
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).send(false);
  }
});

export default router;
