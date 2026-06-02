const express = require("express");
const router = express.Router();
const safetyObservationController = require("../controllers/safetyObservationController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const SafetyObservation = require("../models/SafetyObservation");

const ownObservation = ensureOwnedDocument(SafetyObservation);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

router.get("/", safetyObservationController.getObservations);
router.get("/create/:workAreaId", ownWorkArea, safetyObservationController.showCreateForm);
router.post(
  "/create/:workAreaId",
  ownWorkArea,
  safetyObservationController.createObservation,
);
router.get("/:id", ownObservation, safetyObservationController.getObservation);
router.post("/:id/update", ownObservation, safetyObservationController.updateObservation);
router.get(
  "/api/workarea/:workAreaId",
  ownWorkArea,
  safetyObservationController.getWorkAreaObservations,
);

module.exports = router;
