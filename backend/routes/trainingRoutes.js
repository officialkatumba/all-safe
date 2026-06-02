const express = require("express");
const router = express.Router();
const trainingController = require("../controllers/trainingRequirementController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const TrainingRequirement = require("../models/TrainingRequirement");
const ownTraining = ensureOwnedDocument(TrainingRequirement);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

// Generate training
router.get("/generate/:workAreaId", ownWorkArea, trainingController.showGenerateForm);
router.post(
  "/generate/:workAreaId",
  ownWorkArea,
  trainingController.generateTrainingRequirement,
);

// Download Word document
router.get("/:id/download-word", ownTraining, trainingController.downloadWord);
router.post("/:id/regenerate", ownTraining, trainingController.regenerateWithComments);
router.post("/:id/approve", ownTraining, trainingController.approveTraining);

// View training
router.get("/:id", ownTraining, trainingController.getTrainingRequirement);

// Mark complete
router.post("/:id/complete", ownTraining, trainingController.markComplete);

// API endpoint
router.get("/api/workarea/:workAreaId", ownWorkArea, trainingController.getWorkAreaTraining);

module.exports = router;
