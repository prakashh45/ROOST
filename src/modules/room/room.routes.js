const express = require("express");

const roomController = require("./room.controller");

const router = express.Router();

router.post(
    "/properties/:propertyId/rooms",
    roomController.createRoom
);

module.exports = router;