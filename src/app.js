const cors = require("cors");
const express = require("express");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

// Fix BigInt JSON serialization globally
BigInt.prototype.toJSON = function () {
    return this.toString();
};

const app = express();

/* ── CORS ── */
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

/* ── Global Middleware ── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy headers when behind ALB
app.set("trust proxy", 1);

app.use(requestLogger);