const cors = require("cors");
const express = require("express");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();
app.use(cors({
  origin: [
    'https://roost-frontend-psi.vercel.app',
    'http://localhost:5173' // local dev ke liye
  ],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(requestLogger);

// Service information. These routes make it easy to confirm that the server is
// reachable without needing to know a feature-specific API endpoint.
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "ROOST API is running",
    health: "/api/v1/health",
    basePath: "/api/v1"
  });
});

app.get("/api/v1", (_req, res) => {
  res.json({
    success: true,
    message: "ROOST API is running",
    health: "/api/v1/health"
  });
});

// Health
app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    ts: new Date().toISOString()
  });
});

// API
app.use("/api/v1", routes);

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: "Route not found"
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
