const express = require("express");

const bedController = require("./bed.controller");

const router = express.Router();

router.post(
    "/:roomId/beds",
    bedController.createBed
);

module.exports = router;