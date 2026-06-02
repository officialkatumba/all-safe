// const express = require("express");
// const router = express.Router();
// const permitController = require("../controllers/permitController");
// const { ensureAuthenticated } = require("../middlewares/auth");

// router.use(ensureAuthenticated);

// router.get("/new/:workAreaId", permitController.showCreateForm);
// router.post("/new/:workAreaId", permitController.createPermit);
// router.get("/:id", permitController.getPermit);
// router.post("/:id/approve", permitController.approvePermit);
// router.post("/:id/complete", permitController.completePermit);
// router.post("/:id/cancel", permitController.cancelPermit);

// module.exports = router;

const express = require("express");
const router = express.Router();
const permitController = require("../controllers/permitController");
const { ensureAuthenticated } = require("../middlewares/auth");
const { ensureOwnedDocument, ensureOwnedWorkArea } = require("../middlewares/ownership");
const Permit = require("../models/Permit");
const ownPermit = ensureOwnedDocument(Permit);
const ownWorkArea = ensureOwnedWorkArea();

router.use(ensureAuthenticated);

// Generate permit
router.get("/generate/:workAreaId", ownWorkArea, permitController.showGenerateForm);
router.post("/generate/:workAreaId", ownWorkArea, permitController.generatePermit);

// View permit
router.get("/:id", ownPermit, permitController.getPermit);

// Approve and manage
router.post("/:id/approve", ownPermit, permitController.approvePermit);
router.post("/:id/activate", ownPermit, permitController.activatePermit);
router.post("/:id/complete", ownPermit, permitController.completePermit);

// API endpoint
router.get("/api/workarea/:workAreaId", ownWorkArea, permitController.getWorkAreaPermits);

module.exports = router;
