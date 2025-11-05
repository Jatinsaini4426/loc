import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// ✅ Middleware: parse JSON body
router.use(express.json());

// ✅ POST endpoint for sending email
router.post("/", async (req, res) => {
  try {
    const EMAIL_TO = process.env.CONTACT_EMAIL_TO;
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_PASS = process.env.GMAIL_PASS;
    const API_KEY = process.env.CONTACT_API_KEY;

    // 🔐 Check API key
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== API_KEY) {
      return res.status(401).json({ error: "Unauthorized. Invalid API Key." });
    }

    // 🧾 Validate method
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ error: "Method Not Allowed. POST required." });
    }

    // 🧠 Extract and validate input
    const { name, email, message } = req.body || {};
    if (
      !name ||
      typeof name !== "string" ||
      !email ||
      typeof email !== "string" ||
      !message ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid input. Name, email, and message are required.",
      });
    }

    // 📧 Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });

    // 💌 Format email
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: EMAIL_TO,
      subject: `New Contact Message from ${name}`,
      html: `
        <h2>Contact Form Submission</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <div style="margin-left:15px">${message.replace(/\n/g, "<br>")}</div>
      `,
    };

    // 🚀 Send the email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Send Email Error:", error.message);
    return res.status(500).json({
      error: "Something went wrong. Could not send email.",
      details: error.message,
    });
  }
});

export default router;
