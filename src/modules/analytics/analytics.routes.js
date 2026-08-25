const express = require("express");

const ctrl = require("./analytics.controller");

const {
  authenticate,
  requireRole,
} = require("../../middleware/auth");

const router = express.Router();

router.get(
  "/owner-summary",
  authenticate,
  requireRole("OWNER", "STAFF"),
  ctrl.ownerSummary
);

module.exports = router;
