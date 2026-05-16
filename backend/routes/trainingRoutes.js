const express = require("express");
const router = express.Router();
const trainingController = require("../controllers/trainingRequirementController");
const { ensureAuthenticated } = require("../middlewares/auth");

router.use(ensureAuthenticated);

// Generate training
router.get("/generate/:workAreaId", trainingController.showGenerateForm);
router.post(
  "/generate/:workAreaId",
  trainingController.generateTrainingRequirement,
);

// Download Word document
router.get("/:id/download-word", trainingController.downloadWord);

// View training
router.get("/:id", trainingController.getTrainingRequirement);

// Mark complete
router.post("/:id/complete", trainingController.markComplete);

// API endpoint
router.get("/api/workarea/:workAreaId", trainingController.getWorkAreaTraining);

module.exports = router;
