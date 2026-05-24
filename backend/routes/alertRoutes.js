const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const alertController = require("../controllers/alertController");

router.get("/", ensureAuthenticated, alertController.listAlerts);
router.post("/:id/acknowledge", ensureAuthenticated, alertController.acknowledgeAlert);
router.post("/:id/resolve", ensureAuthenticated, alertController.resolveAlert);

module.exports = router;
