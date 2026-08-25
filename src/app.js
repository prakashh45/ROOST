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

