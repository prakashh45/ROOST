require("dotenv").config();

const app  = require("./app");
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // Bind to all interfaces — required behind ALB

const server = app.listen(PORT, HOST, () => {
    console.log(JSON.stringify({
        level:   "info",
        event:   "server_started",
        host:    HOST,
        port:    PORT,
        env:     process.env.NODE_ENV || "development",
        ts:      new Date().toISOString(),
    }));
});

// Graceful shutdown
const shutdown = (signal) => {
    console.log(JSON.stringify({ level: "info", event: "shutdown", signal }));
    server.close(() => process.exit(0));
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));