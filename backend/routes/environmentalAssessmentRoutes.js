const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const environmentalAssessmentController = require("../controllers/environmentalAssessmentController");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const EnvironmentalAssessment = require("../models/EnvironmentalAssessment");
const ownAssessment = ensureOwnedDocument(EnvironmentalAssessment);
const ownWorkArea = ensureOwnedWorkArea();

router.get(
  "/generate/:workAreaId",
  ensureAuthenticated,
  ownWorkArea,
  environmentalAssessmentController.showGenerateForm,
);
router.post(
  "/generate/:workAreaId",
  ensureAuthenticated,
  ownWorkArea,
  environmentalAssessmentController.generateAssessment,
);
router.post(
  "/:id/approve",
  ensureAuthenticated,
  ownAssessment,
  environmentalAssessmentController.approveAssessment,
);
router.post(
  "/:id/regenerate",
  ensureAuthenticated,
  ownAssessment,
  environmentalAssessmentController.regenerateWithComments,
);
router.get(
  "/:id/download-word",
  ensureAuthenticated,
  ownAssessment,
  environmentalAssessmentController.downloadWord,
);
router.get(
  "/:id",
  ensureAuthenticated,
  ownAssessment,
  environmentalAssessmentController.viewAssessment,
);

module.exports = router;
