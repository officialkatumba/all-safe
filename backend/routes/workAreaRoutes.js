const express = require("express");
const router = express.Router();
const workAreaController = require("../controllers/workAreaController");
const { ensureAuthenticated } = require("../middlewares/auth");

router.use(ensureAuthenticated);

// Create routes
router.get("/create", workAreaController.showCreateWorkAreaForm);
router.post("/create", workAreaController.createWorkArea);

// View routes
router.get("/:id", workAreaController.getWorkArea);

// Edit routes
router.get("/:id/edit", workAreaController.showEditWorkAreaForm);
router.post("/:id/edit", workAreaController.updateWorkArea);

// API routes
router.get("/:id/incidents", workAreaController.getAreaIncidents);
router.get("/:id/risk-assessments", workAreaController.getAreaRiskAssessments);
router.get("/:id/safety-talks", workAreaController.getAreaSafetyTalks);

module.exports = router;
