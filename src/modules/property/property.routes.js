const express = require("express");

const propertyController = require("./property.controller");

const router = express.Router();

router.get(
    "/:slug/availability",
    propertyController.getPropertyAvailability
);

router.get(
    "/:slug",
    propertyController.getPropertyBySlug
);

module.exports = router;