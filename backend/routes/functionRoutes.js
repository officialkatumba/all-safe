const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");

// Admin Functions Page
router.get("/admin-functions", ensureAuthenticated, (req, res) => {
  // Check if user has admin privileges (solo or enterprise admin)
  if (
    !req.user.isDualRole &&
    req.user.role !== "enterprise_admin" &&
    req.user.role !== "system_admin"
  ) {
    req.flash("error", "Access denied - Admin privileges required");
    return res.redirect("/dashboard/solo");
  }
  // Updated path to reflect new folder structure
  res.render("safety-officer/functions/admin-functions", {
    user: req.user,
  });
});

// Safety Officer Functions Page
router.get("/safety-officer-functions", ensureAuthenticated, (req, res) => {
  // Check if user has safety officer privileges (solo or enterprise officer)
  if (!req.user.isDualRole && req.user.role !== "safety_officer") {
    req.flash("error", "Access denied - Safety officer privileges required");
    return res.redirect("/dashboard/solo");
  }
  // Updated path to reflect new folder structure
  res.render("safety-officer/functions/safety-officer-functions", {
    user: req.user,
  });
});

module.exports = router;
