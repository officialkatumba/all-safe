const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyTalk = require("../models/SafetyTalk");
const PPEChecklist = require("../models/PPEChecklist");

router.get(["/", "/officer"], ensureAuthenticated, async (req, res) => {
  try {
    const workAreas = await WorkArea.find({ officerId: req.user._id }).sort({
      updatedAt: -1,
    });

    const workAreaIds = workAreas.map((area) => area._id);
    const stats = {
      workAreas: workAreas.length,
      incidentsReported: await Incident.countDocuments({ workArea: { $in: workAreaIds } }),
      riskAssessments: await RiskAssessment.countDocuments({ workArea: { $in: workAreaIds } }),
      safetyTalks: await SafetyTalk.countDocuments({ targetWorkAreas: { $in: workAreaIds } }),
      ppeChecks: await PPEChecklist.countDocuments({ workArea: { $in: workAreaIds } }),
    };

    res.render("safety-officer/dashboard", {
      user: req.user,
      officer: req.user,
      workAreas,
      stats,
      recentActivities: [],
    });
  } catch (error) {
    console.error("Error loading officer dashboard:", error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/api/users/login");
  }
});

router.get("/admin", (req, res) => res.redirect("/dashboard/officer"));
router.get("/worker", (req, res) => res.redirect("/dashboard/officer"));

module.exports = router;
