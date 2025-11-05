import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ✅ ES module safe __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Global middlewares
// app.use(cors()); 
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies

// ✅ Import all APIs
import gltAPI from "./api/GLT.js";  
import helloAPI from "./api/hello.js";
import meaowAPI from "./api/meaow.js";
import sendEmailAPI from "./api/send-email.js";

// ✅ Mount API routes
app.use("/api/glt", gltAPI);
app.use("/api/hello", helloAPI);
app.use("/api/meaow", meaowAPI);
app.use("/api/send-email", sendEmailAPI);

// ✅ Health check route
app.get("/", (req, res) => {
  res.status(200).send("✅ Server running fine! 🚀");
});

// ✅ Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Global error handler (avoid Express crash)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
