// const express = require("express");
// const router = express.Router();
// const safetyInsightController = require("../controllers/safetyInsightController");

// // Generate AI insight for a work area
// router.post(
//   "/generate/:workAreaId",
//   safetyInsightController.generateSafetyInsight,
// );

// // View full insight
// router.get("/:id", safetyInsightController.getSafetyInsight);

// module.exports = router;

const express = require("express");
const router = express.Router();

const safetyInsightController = require("../controllers/safetyInsightController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const SafetyInsight = require("../models/SafetyInsight");
const ownInsight = ensureOwnedDocument(SafetyInsight);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

// Generate AI safety insight for a work area
router.post(
  "/generate/:workAreaId",
  ownWorkArea,
  safetyInsightController.generateSafetyInsight,
);

// Download editable Word document
router.get("/:id/download-word", ownInsight, safetyInsightController.downloadWord);
router.post("/:id/regenerate", ownInsight, safetyInsightController.regenerateWithComments);
router.post("/:id/approve", ownInsight, safetyInsightController.approveInsight);

// View one AI safety insight
router.get("/:id", ownInsight, safetyInsightController.getSafetyInsight);

module.exports = router;
