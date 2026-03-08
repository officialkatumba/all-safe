const express = require("express");
const router = express.Router();
const safetyOfficerController = require("../controllers/safetyOfficerController");

// GET: Show safety officer registration form
router.get("/register", safetyOfficerController.showRegisterSafetyOfficerForm);

// POST: Handle safety officer registration
router.post("/register", safetyOfficerController.registerSafetyOfficer);

// GET: Safety Officer Dashboard
router.get("/dashboard", (req, res) => {
  if (!req.user) {
    req.flash("error", "Please log in first");
    return res.redirect("/api/users/login");
  }

  if (req.user.role !== "safety_officer") {
    req.flash("error", "Access denied");
    return res.redirect("/api/users/login");
  }

  res.render("safety-officer/dashboard", {
    user: req.user,
  });
});

module.exports = router;
