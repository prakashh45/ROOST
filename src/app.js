const express = require("express");

const routes = require("./routes");

const app = express();

app.use(express.json());

// Handle PostgreSQL BIGINT values in JSON responses
BigInt.prototype.toJSON = function () {
    return this.toString();
};

app.use("/api/v1", routes);

app.get("/", (req, res) => {
    res.json({
        message: "ROOST Backend is running"
    });
});

module.exports = app;