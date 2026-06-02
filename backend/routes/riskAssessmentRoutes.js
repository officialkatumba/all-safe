const express = require("express");
const router = express.Router();
const riskAssessmentController = require("../controllers/riskAssessmentController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const RiskAssessment = require("../models/RiskAssessment");
const ownAssessment = ensureOwnedDocument(RiskAssessment);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

router.get("/new/:workAreaId", ownWorkArea, riskAssessmentController.showCreateForm);
router.post("/new/:workAreaId", ownWorkArea, riskAssessmentController.createRiskAssessment);
router.get("/:id", ownAssessment, riskAssessmentController.getRiskAssessment);
router.get("/:id/edit", ownAssessment, riskAssessmentController.showEditForm);
router.post("/:id/edit", ownAssessment, riskAssessmentController.updateRiskAssessment);
router.post("/:id/approve", ownAssessment, riskAssessmentController.approveAssessment);
router.post(
  "/:id/enhance/:sectionKey",
  ownAssessment,
  riskAssessmentController.enhanceSection,
);
router.post(
  "/:id/confirm/:sectionKey",
  ownAssessment,
  riskAssessmentController.confirmSection,
);
router.get(
  "/:id/section/:sectionKey/content",
  ownAssessment,
  riskAssessmentController.getSectionContent,
);
router.get(
  "/:id/ai-section/:sectionKey",
  ownAssessment,
  riskAssessmentController.getAISection,
);
router.post(
  "/:id/generate-consolidated",
  ownAssessment,
  riskAssessmentController.generateConsolidated,
);
router.get(
  "/:id/download-word",
  ownAssessment,
  riskAssessmentController.downloadConsolidatedWord,
);

module.exports = router;
