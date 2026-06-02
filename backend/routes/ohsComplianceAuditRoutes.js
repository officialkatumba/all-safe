const express = require("express");
const router = express.Router();

const ohsComplianceAuditController = require("../controllers/ohsComplianceAuditController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const OHSComplianceAudit = require("../models/OHSComplianceAudit");
const ownAudit = ensureOwnedDocument(OHSComplianceAudit);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

router.post(
  "/generate/:workAreaId",
  ownWorkArea,
  ohsComplianceAuditController.generateAudit,
);

router.get("/:id/interview", ownAudit, ohsComplianceAuditController.showInterview);

router.post(
  "/:id/submit-responses",
  ownAudit,
  ohsComplianceAuditController.submitResponsesAndScore,
);

router.get("/:id/download-word", ownAudit, ohsComplianceAuditController.downloadWord);
router.post("/:id/regenerate", ownAudit, ohsComplianceAuditController.regenerateWithComments);
router.post("/:id/approve", ownAudit, ohsComplianceAuditController.approveAudit);

router.get("/:id", ownAudit, ohsComplianceAuditController.viewAudit);

module.exports = router;
