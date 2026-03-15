// const express = require("express");
// const router = express.Router();
// const workAreaController = require("../controllers/workAreaController");
// const { ensureAuthenticated } = require("../middlewares/auth");

// router.use(ensureAuthenticated);

// router.get("/create", workAreaController.showCreateWorkAreaForm);
// router.post("/create", workAreaController.createWorkArea);
// router.get("/:id", workAreaController.getWorkArea);
// router.get("/:id/edit", workAreaController.showEditWorkAreaForm);
// router.post("/:id/edit", workAreaController.updateWorkArea);

// // Area-specific actions
// router.get("/:id/incidents", workAreaController.getAreaIncidents);
// router.get("/:id/risk-assessments", workAreaController.getAreaRiskAssessments);
// router.get("/:id/safety-talks", workAreaController.getAreaSafetyTalks);

// // Officer assignment routes
// router.post(
//   "/:workAreaId/assign-officer",
//   workAreaController.assignOfficerToWorkArea,
// );
// router.delete(
//   "/:workAreaId/assignments/:assignmentId",
//   workAreaController.removeOfficerFromWorkArea,
// );
// router.get(
//   "/:workAreaId/available-officers",
//   workAreaController.getAvailableOfficersForWorkArea,
// );
// router.put(
//   "/:workAreaId/assignments/:assignmentId",
//   workAreaController.updateOfficerAssignment,
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const workAreaController = require("../controllers/workAreaController");
const { ensureAuthenticated } = require("../middlewares/auth");

router.use(ensureAuthenticated);

// IMPORTANT: Place specific routes BEFORE the /:id route
router.get("/create", workAreaController.showCreateWorkAreaForm);
router.post("/create", workAreaController.createWorkArea);

// ✅ NEW: Manage officers page route - place BEFORE /:id
router.get(
  "/:workAreaId/manage-officers",
  workAreaController.showManageOfficersPage,
);

// Officer assignment routes (these use workAreaId param)
router.post(
  "/:workAreaId/assign-officer",
  workAreaController.assignOfficerToWorkArea,
);
router.delete(
  "/:workAreaId/assignments/:assignmentId",
  workAreaController.removeOfficerFromWorkArea,
);
router.get(
  "/:workAreaId/available-officers",
  workAreaController.getAvailableOfficersForWorkArea,
);
router.put(
  "/:workAreaId/assignments/:assignmentId",
  workAreaController.updateOfficerAssignment,
);

// Generic work area routes - place AFTER specific routes
router.get("/:id", workAreaController.getWorkArea);
router.get("/:id/edit", workAreaController.showEditWorkAreaForm);
router.post("/:id/edit", workAreaController.updateWorkArea);

// Area-specific actions
router.get("/:id/incidents", workAreaController.getAreaIncidents);
router.get("/:id/risk-assessments", workAreaController.getAreaRiskAssessments);
router.get("/:id/safety-talks", workAreaController.getAreaSafetyTalks);

module.exports = router;
