const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registrationController");

router.get("/options", (req, res) => res.redirect("/register/safety-officer"));
router.get("/safety-officer", registrationController.showSafetyOfficerForm);
router.post("/safety-officer", registrationController.registerSafetyOfficer);

router.get("/", (req, res) => res.redirect("/register/safety-officer"));
router.get("/solo", (req, res) => res.redirect("/register/safety-officer"));

module.exports = router;
