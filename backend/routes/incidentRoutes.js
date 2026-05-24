// const express = require("express");
// const router = express.Router();
// const incidentController = require("../controllers/incidentController");
// const { ensureAuthenticated } = require("../middlewares/auth");

// // Public incident reporting (no login required for workers)
// router.get("/report/:workAreaId", incidentController.showIncidentReportForm);
// router.post("/report/:workAreaId", incidentController.submitIncidentReport);

// // Protected routes
// router.use(ensureAuthenticated);
// router.get("/", incidentController.getMyIncidents);
// router.get("/:id", incidentController.getIncident);
// router.get("/:id/edit", incidentController.showEditIncidentForm);
// router.post("/:id/edit", incidentController.updateIncident);
// router.post("/:id/investigate", incidentController.addInvestigation);

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const incidentController = require("../controllers/incidentController");
// const { ensureAuthenticated } = require("../middlewares/auth");

// // ========== PUBLIC ROUTES (No authentication required) ==========
// router.get("/report/:workAreaId", incidentController.showIncidentReportForm);
// router.post("/report/:workAreaId", incidentController.submitIncidentReport);
// router.get("/thank-you", incidentController.thankYou);

// // ========== SAFETY OFFICER ROUTES (Authentication required) ==========
// router.get("/", ensureAuthenticated, incidentController.getMyIncidents);
// router.get("/:id", ensureAuthenticated, incidentController.getIncident);
// router.get(
//   "/:id/edit",
//   ensureAuthenticated,
//   incidentController.showEditIncidentForm,
// );
// router.post(
//   "/:id/edit",
//   ensureAuthenticated,
//   incidentController.updateIncident,
// );
// router.post(
//   "/:id/investigation",
//   ensureAuthenticated,
//   incidentController.addInvestigation,
// );
// router.post(
//   "/:id/corrective-action",
//   ensureAuthenticated,
//   incidentController.addCorrectiveAction,
// );
// router.post(
//   "/:id/complete-action",
//   ensureAuthenticated,
//   incidentController.completeCorrectiveAction,
// );
// router.post(
//   "/:id/close",
//   ensureAuthenticated,
//   incidentController.closeIncident,
// );

// // API endpoint for dashboard widget
// router.get(
//   "/api/recent/:workAreaId",
//   ensureAuthenticated,
//   incidentController.getRecentIncidents,
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const incidentController = require("../controllers/incidentController");
const { ensureAuthenticated } = require("../middlewares/auth");

// All routes require authentication (safety officers and workers)
router.use(ensureAuthenticated);

// Incident routes
router.get("/", incidentController.getMyIncidents);
router.get("/report/:workAreaId", incidentController.showIncidentReportForm);
router.post("/report/:workAreaId", incidentController.submitIncidentReport);
router.get("/thank-you", incidentController.thankYou);
router.get("/api/recent/:workAreaId", incidentController.getRecentIncidents);
router.get("/:id", incidentController.getIncident);
router.get("/:id/edit", incidentController.showEditIncidentForm);
router.post("/:id/edit", incidentController.updateIncident);
router.post("/:id/investigation", incidentController.addInvestigation);
router.post("/:id/corrective-action", incidentController.addCorrectiveAction);
router.post(
  "/:id/complete-action",
  incidentController.completeCorrectiveAction,
);
router.post("/:id/close", incidentController.closeIncident);

module.exports = router;
