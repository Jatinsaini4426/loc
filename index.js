import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// ES module safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Global manual CORS headers (no external package)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Import all APIs
import gltAPI from "./api/GLT.js";
import helloAPI from "./api/hello.js";
import meaowAPI from "./api/meaow.js";
import sendEmailAPI from "./api/send-email.js";

// ✅ Mount routes
app.use("/api/glt", gltAPI);
app.use("/api/hello", helloAPI);
app.use("/api/meaow", meaowAPI);
app.use("/api/send-email", sendEmailAPI);

// ✅ Health check
app.get("/", (req, res) => res.send("✅ Server running fine! 🚀"));

// ✅ Catch-all 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
