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

// Generate AI safety insight for a work area
router.post(
  "/generate/:workAreaId",
  safetyInsightController.generateSafetyInsight,
);

// Download editable Word document
router.get("/:id/download-word", safetyInsightController.downloadWord);

// View one AI safety insight
router.get("/:id", safetyInsightController.getSafetyInsight);

module.exports = router;
