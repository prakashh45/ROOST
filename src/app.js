/* ─────────────────────────────────────────────────────────────────────────
   src/app.js — Express application bootstrap
───────────────────────────────────────────────────────────────────────── */
const cors = require("cors");
const express       = require("express");
const routes        = require("./routes");
const errorHandler  = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

// Fix BigInt JSON serialization globally
BigInt.prototype.toJSON = function () { return this.toString(); };
const cors = require("cors");

const app = express();

/* ── Global Middleware ── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy headers when behind ALB
app.set("trust proxy", 1);

app.use(requestLogger);

/* ── Health check (ALB target group) ── */
app.get("/", (_req, res) => res.json({ success: true, message: "ROOST Backend is running", version: "1.0.0" }));
app.get("/api/v1/health", (_req, res) => res.json({ success: true, status: "ok", ts: new Date().toISOString() }));

/* ── API Routes ── */
app.use("/api/v1", routes);

/* ── 404 catch-all ── */
app.use((_req, res) => {
    res.status(404).json({ success: false, code: "NOT_FOUND", message: "Route not found" });
});

/* ── Central Error Handler (must be last) ── */
app.use(errorHandler);

module.exports = app;