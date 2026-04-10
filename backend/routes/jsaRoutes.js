const express = require("express");
const router = express.Router();
const jsaController = require("../controllers/jsaController");
const { ensureAuthenticated } = require("../middlewares/auth");

router.use(ensureAuthenticated);

// Create routes
router.get("/new/:workAreaId", jsaController.showCreateForm);
router.post("/new/:workAreaId", jsaController.createJSA);

// View routes
router.get("/:id", jsaController.getJSA);

// Edit routes
router.get("/:id/edit", jsaController.showEditForm);
router.post("/:id/edit", jsaController.updateJSA);

// Section routes
router.get("/:id/section/:sectionKey/content", jsaController.getSectionContent);
router.get("/:id/ai-section/:sectionKey", jsaController.getAISection);
router.post("/:id/enhance/:sectionKey", jsaController.enhanceSection);
router.post("/:id/confirm/:sectionKey", jsaController.confirmSection);

// Approval
router.post("/:id/approve", jsaController.approveJSA);

// Consolidated report
router.post("/:id/generate-consolidated", jsaController.generateConsolidated);
router.get("/:id/download-pdf", jsaController.downloadPDF);

module.exports = router;
