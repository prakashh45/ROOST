const express = require("express");

const propertyController = require("./property.controller");
const roomController = require("../room/room.controller");


const router = express.Router();

router.get(
    "/:slug/availability",
    propertyController.getPropertyAvailability
);

router.get(
    "/:slug",
    propertyController.getPropertyBySlug
);

router.post(
    "/:propertyId/rooms",
    roomController.createRoom
);

router.post("/", propertyController.createProperty);

module.exports = router;