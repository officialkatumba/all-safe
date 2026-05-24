const express = require("express");
const router = express.Router();
const safetyTalkController = require("../controllers/safetyTalkController");
const { ensureAuthenticated } = require("../middlewares/auth");

// All routes require authentication
router.use(ensureAuthenticated);

// Generate safety talk (no form, just click and generate)
router.post("/generate/:workAreaId", safetyTalkController.generateSafetyTalk);

// View safety talk
router.get("/:id", safetyTalkController.getSafetyTalk);

// Review and confirm draft safety talk
router.post("/:id/review-confirm", safetyTalkController.reviewAndConfirm);

// API endpoint for dashboard
router.get("/api/workarea/:workAreaId", safetyTalkController.getWorkAreaTalks);

router.get("/:id/download-word", safetyTalkController.downloadWord);

module.exports = router;
