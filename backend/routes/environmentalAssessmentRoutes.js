const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const environmentalAssessmentController = require("../controllers/environmentalAssessmentController");

router.get(
  "/generate/:workAreaId",
  ensureAuthenticated,
  environmentalAssessmentController.showGenerateForm,
);
router.post(
  "/generate/:workAreaId",
  ensureAuthenticated,
  environmentalAssessmentController.generateAssessment,
);
router.post(
  "/:id/approve",
  ensureAuthenticated,
  environmentalAssessmentController.approveAssessment,
);
router.get(
  "/:id/download-word",
  ensureAuthenticated,
  environmentalAssessmentController.downloadWord,
);
router.get(
  "/:id",
  ensureAuthenticated,
  environmentalAssessmentController.viewAssessment,
);

module.exports = router;
