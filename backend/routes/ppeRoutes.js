// const express = require("express");
// const router = express.Router();
// const ppeController = require("../controllers/ppeController");
// const { ensureAuthenticated } = require("../middlewares/auth");

// router.use(ensureAuthenticated);

// router.get("/checklists/:workAreaId", ppeController.getChecklists);
// router.get(
//   "/checklists/new/:workAreaId",
//   ppeController.showCreateChecklistForm,
// );
// router.post("/checklists/new/:workAreaId", ppeController.createChecklist);
// router.get("/checklists/:id", ppeController.getChecklist);
// router.post("/checklists/:id/sign", ppeController.signChecklist);

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const ppeChecklistController = require("../controllers/ppeChecklistController");
// const { ensureAuthenticated } = require("../middlewares/auth");

// router.use(ensureAuthenticated);

// // Generate PPE requirements (AI-driven)
// router.post(
//   "/generate/:workAreaId",
//   ppeChecklistController.generatePPERequirements,
// );

// router.get("/:id/download-word", ppeController.downloadWord);

// // View PPE checklist
// router.get("/:id", ppeChecklistController.getPPEChecklist);

// // Mark as completed
// router.post("/:id/complete", ppeChecklistController.completeChecklist);

// // API endpoint
// router.get(
//   "/api/workarea/:workAreaId",
//   ppeChecklistController.getWorkAreaPPEChecklists,
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const ppeChecklistController = require("../controllers/ppeChecklistController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const PPEChecklist = require("../models/PPEChecklist");
const ownChecklist = ensureOwnedDocument(PPEChecklist);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

// Generate PPE requirements (AI-driven)
router.post(
  "/generate/:workAreaId",
  ownWorkArea,
  ppeChecklistController.generatePPERequirements,
);

// Download editable Word document
router.get("/:id/download-word", ownChecklist, ppeChecklistController.downloadWord);
router.post("/:id/regenerate", ownChecklist, ppeChecklistController.regenerateWithComments);
router.post("/:id/approve", ownChecklist, ppeChecklistController.approveChecklist);

// API endpoint - keep this before /:id if possible
router.get(
  "/api/workarea/:workAreaId",
  ownWorkArea,
  ppeChecklistController.getWorkAreaPPEChecklists,
);

// View PPE checklist
router.get("/:id", ownChecklist, ppeChecklistController.getPPEChecklist);

// Mark as completed
router.post("/:id/complete", ownChecklist, ppeChecklistController.completeChecklist);

module.exports = router;
