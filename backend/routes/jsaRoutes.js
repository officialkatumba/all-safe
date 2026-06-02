const express = require("express");
const router = express.Router();
const jsaController = require("../controllers/jsaController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const JSA = require("../models/JSA");
const ownJsa = ensureOwnedDocument(JSA);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

// Create routes
router.get("/new/:workAreaId", ownWorkArea, jsaController.showCreateForm);
router.post("/new/:workAreaId", ownWorkArea, jsaController.createJSA);

// View routes
router.get("/:id", ownJsa, jsaController.getJSA);

// Edit routes
router.get("/:id/edit", ownJsa, jsaController.showEditForm);
router.post("/:id/edit", ownJsa, jsaController.updateJSA);

// Section routes
router.get("/:id/section/:sectionKey/content", ownJsa, jsaController.getSectionContent);
router.get("/:id/ai-section/:sectionKey", ownJsa, jsaController.getAISection);
router.post("/:id/enhance/:sectionKey", ownJsa, jsaController.enhanceSection);
router.post("/:id/confirm/:sectionKey", ownJsa, jsaController.confirmSection);

// Approval
router.post("/:id/approve", ownJsa, jsaController.approveJSA);

// Consolidated report
router.post("/:id/generate-consolidated", ownJsa, jsaController.generateConsolidated);
router.get("/:id/download-word", ownJsa, jsaController.downloadWord);

module.exports = router;
