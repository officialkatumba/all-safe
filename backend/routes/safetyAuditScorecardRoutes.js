const express = require("express");
const router = express.Router();

const safetyAuditScorecardController = require("../controllers/safetyAuditScorecardController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const SafetyAuditScorecard = require("../models/SafetyAuditScorecard");
const ownAudit = ensureOwnedDocument(SafetyAuditScorecard);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

router.post(
  "/generate/:workAreaId",
  ownWorkArea,
  safetyAuditScorecardController.generateAuditQuestions,
);

router.get("/:id/interview", ownAudit, safetyAuditScorecardController.showAuditInterview);

router.post(
  "/:id/submit-responses",
  ownAudit,
  safetyAuditScorecardController.submitResponsesAndGenerateScore,
);

router.get("/:id/download-word", ownAudit, safetyAuditScorecardController.downloadWord);
router.post("/:id/regenerate", ownAudit, safetyAuditScorecardController.regenerateWithComments);
router.post("/:id/approve", ownAudit, safetyAuditScorecardController.approveAudit);

router.get("/:id", ownAudit, safetyAuditScorecardController.viewScorecard);

module.exports = router;
