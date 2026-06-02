const express = require("express");
const router = express.Router();
const safetyTalkController = require("../controllers/safetyTalkController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const SafetyTalk = require("../models/SafetyTalk");
const ownTalk = ensureOwnedDocument(SafetyTalk, { workAreaField: "targetWorkAreas" });
const ownWorkArea = ensureOwnedWorkArea();

// All routes require authentication
router.use(ensureAuthenticated);

// Generate safety talk (no form, just click and generate)
router.post("/generate/:workAreaId", ownWorkArea, safetyTalkController.generateSafetyTalk);

// View safety talk
router.get("/:id", ownTalk, safetyTalkController.getSafetyTalk);

// Safety officer review workflow
router.post("/:id/regenerate", ownTalk, safetyTalkController.regenerateWithComments);
router.post("/:id/approve", ownTalk, safetyTalkController.approveSafetyTalk);

// API endpoint for dashboard
router.get("/api/workarea/:workAreaId", ownWorkArea, safetyTalkController.getWorkAreaTalks);

router.get("/:id/download-word", ownTalk, safetyTalkController.downloadWord);

module.exports = router;
