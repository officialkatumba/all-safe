const express = require("express");
const router = express.Router();

const emergencyProtocolController = require("../controllers/emergencyProtocolController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const EmergencyProtocol = require("../models/EmergencyProtocol");
const ownProtocol = ensureOwnedDocument(EmergencyProtocol);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

router.post(
  "/generate/:workAreaId",
  ownWorkArea,
  emergencyProtocolController.generateEmergencyProtocol,
);

router.get("/:id/download-word", ownProtocol, emergencyProtocolController.downloadWord);
router.post("/:id/regenerate", ownProtocol, emergencyProtocolController.regenerateWithComments);
router.post("/:id/approve", ownProtocol, emergencyProtocolController.approveProtocol);

router.get("/:id", ownProtocol, emergencyProtocolController.getEmergencyProtocol);

module.exports = router;
