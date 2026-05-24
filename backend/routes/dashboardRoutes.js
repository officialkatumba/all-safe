// const express = require("express");
// const router = express.Router();
// const { ensureAuthenticated } = require("../middlewares/auth");

// // Solo Practitioner Dashboard (dual-role)
// router.get("/solo", ensureAuthenticated, (req, res) => {
//   if (!req.user.isDualRole) {
//     req.flash("error", "Access denied - Solo practitioners only");
//     return res.redirect("/api/users/login");
//   }
//   res.render("safety-officer/dashboard-solo", {
//     user: req.user,
//   });
// });

// // Enterprise Safety Officer Dashboard
// router.get("/officer", ensureAuthenticated, (req, res) => {
//   if (req.user.role !== "safety_officer" || req.user.isDualRole) {
//     req.flash("error", "Access denied - Enterprise safety officers only");
//     return res.redirect("/api/users/login");
//   }
//   res.render("safety-officer/dashboard-enterprise", {
//     user: req.user,
//   });
// });

// // Enterprise Admin Dashboard
// router.get("/admin", ensureAuthenticated, (req, res) => {
//   if (
//     req.user.role !== "system_admin" ||
//     req.user.accountType !== "enterprise_admin"
//   ) {
//     req.flash("error", "Access denied - Enterprise admins only");
//     return res.redirect("/api/users/login");
//   }
//   res.render("admin/dashboard", {
//     user: req.user,
//   });
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { ensureAuthenticated } = require("../middlewares/auth");

// // Solo Practitioner Dashboard (dual-role)
// router.get("/solo", ensureAuthenticated, (req, res) => {
//   if (!req.user.isDualRole) {
//     req.flash("error", "Access denied - Solo practitioners only");
//     return res.redirect("/api/users/login");
//   }
//   res.render("safety-officer/dashboard-solo", {
//     user: req.user,
//   });
// });

// // Enterprise Safety Officer Dashboard
// router.get("/officer", ensureAuthenticated, (req, res) => {
//   if (req.user.role !== "safety_officer") {
//     req.flash("error", "Access denied - Safety officers only");
//     return res.redirect("/api/users/login");
//   }
//   res.render("safety-officer/dashboard", {
//     user: req.user,
//   });
// });

// // Enterprise Admin Dashboard - Only check role
// router.get("/admin", ensureAuthenticated, (req, res) => {
//   if (req.user.role !== "system_admin") {
//     req.flash("error", "Access denied - Admins only");
//     return res.redirect("/api/users/login");
//   }
//   res.render("admin/dashboard", {
//     user: req.user,
//   });
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { ensureAuthenticated } = require("../middlewares/auth");
// const SafetyOfficer = require("../models/SafetyOfficer");

// // Enterprise Safety Officer Dashboard
// router.get("/officer", ensureAuthenticated, async (req, res) => {
//   try {
//     if (req.user.role !== "safety_officer") {
//       req.flash("error", "Access denied - Safety officers only");
//       return res.redirect("/api/users/login");
//     }

//     // Fetch the SafetyOfficer profile linked to this user
//     const officer = await SafetyOfficer.findOne({ user: req.user._id })
//       .populate("worksites")
//       .populate("workAreas");

//     if (!officer) {
//       req.flash("error", "Safety officer profile not found");
//       return res.redirect("/api/users/login");
//     }

//     // Get assigned worksites
//     const assignedWorksites = officer.worksites || [];

//     // Get work areas
//     const workAreas = officer.workAreas || [];

//     // Stats
//     const stats = {
//       incidentsReported: officer.incidentsReported || 0,
//       safetyTalks: officer.safetyTalksConducted || 0,
//       riskAssessments: 0, // You can fetch from RiskAssessment model
//       ppeChecks: 0, // You can fetch from PPEChecklist model
//     };

//     // Recent activities (you can fetch from various models)
//     const recentActivities = [];

//     res.render("safety-officer/dashboard", {
//       user: req.user,
//       officer: officer, // Pass the safety officer object
//       assignedWorksites: assignedWorksites,
//       workAreas: workAreas,
//       stats: stats,
//       recentActivities: recentActivities,
//     });
//   } catch (error) {
//     console.error("Error loading safety officer dashboard:", error);
//     req.flash("error", "Error loading dashboard");
//     res.redirect("/api/users/login");
//   }
// });

// // Enterprise Admin Dashboard - Only check role
// router.get("/admin", ensureAuthenticated, (req, res) => {
//   if (req.user.role !== "system_admin") {
//     req.flash("error", "Access denied - Admins only");
//     return res.redirect("/api/users/login");
//   }
//   res.render("admin/dashboard", {
//     user: req.user,
//   });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middlewares/auth");
const SafetyOfficer = require("../models/SafetyOfficer");
const User = require("../models/User");
const WorkArea = require("../models/WorkArea");

// Add these lines with your other requires
const Incident = require("../models/Incident");
const SafetyObservation = require("../models/SafetyObservation");
const SafetyTalk = require("../models/SafetyTalk");

// Enterprise Safety Officer Dashboard
router.get("/officer", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== "safety_officer") {
      req.flash("error", "Access denied - Safety officers only");
      return res.redirect("/api/users/login");
    }

    const officer = await SafetyOfficer.findOne({ user: req.user._id })
      .populate("worksites")
      .populate("workAreas");

    if (!officer) {
      req.flash("error", "Safety officer profile not found");
      return res.redirect("/api/users/login");
    }

    const assignedWorksites = officer.worksites || [];
    const workAreas = officer.workAreas || [];

    const stats = {
      incidentsReported: officer.incidentsReported || 0,
      safetyTalks: officer.safetyTalksConducted || 0,
      riskAssessments: 0,
      ppeChecks: 0,
    };

    const recentActivities = [];

    res.render("safety-officer/dashboard", {
      user: req.user,
      officer: officer,
      assignedWorksites: assignedWorksites,
      workAreas: workAreas,
      stats: stats,
      recentActivities: recentActivities,
    });
  } catch (error) {
    console.error("Error loading safety officer dashboard:", error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/api/users/login");
  }
});

// Worker Dashboard
// router.get("/worker", ensureAuthenticated, async (req, res) => {
//   try {
//     if (req.user.role !== "worker") {
//       req.flash("error", "Access denied - Workers only");
//       return res.redirect("/api/users/login");
//     }

//     // Find company
//     const company = await User.findById(req.user.companyId).select(
//       "companyName",
//     );

//     // Find work area where this worker is assigned
//     const workArea = await WorkArea.findOne({
//       "workers.user": req.user._id,
//       "workers.isActive": true,
//     }).select("name location");

//     // Get worker details from the work area
//     let workerDetails = null;
//     if (workArea) {
//       const worker = workArea.workers.find(
//         (w) => w.user.toString() === req.user._id.toString(),
//       );
//       workerDetails = worker;
//     }

//     const stats = {
//       incidentsReported: 0, // Can fetch from Incident model
//       observations: 0,
//       safetyTalks: 0,
//     };

//     const recentActivities = [];

//     res.render("workers/dashboard", {
//       user: req.user,
//       worker: {
//         name: req.user.name,
//         workerNumber: req.user.workerNumber,
//         shift: workerDetails?.shift || "Morning",
//         position: workerDetails?.position || "General Worker",
//       },
//       company: company || { companyName: "Your Company" },
//       workArea: workArea,
//       stats: stats,
//       recentActivities: recentActivities,
//     });
//   } catch (error) {
//     console.error("Error loading worker dashboard:", error);
//     req.flash("error", "Error loading dashboard");
//     res.redirect("/api/users/login");
//   }
// });

router.get("/worker", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      req.flash("error", "Access denied - Workers only");
      return res.redirect("/api/users/login");
    }

    // Find company
    const company = await User.findById(req.user.companyId).select(
      "companyName",
    );

    // Use the workArea field directly from the user object
    let workArea = null;
    if (req.user.workArea) {
      workArea = await WorkArea.findById(req.user.workArea).populate(
        "worksite",
        "name",
      );
    }

    const stats = {
      incidentsReported: await Incident.countDocuments({
        reportedByUser: req.user._id,
      }),
      observations: await SafetyObservation.countDocuments({
        observedBy: req.user._id,
      }),
      safetyTalks: workArea
        ? await SafetyTalk.countDocuments({ targetWorkAreas: workArea._id })
        : 0,
    };

    const recentActivities = await Incident.find({
      reportedByUser: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.render("workers/dashboard", {
      user: req.user,
      worker: {
        name: req.user.name,
        email: req.user.email,
        workerNumber: req.user.workerNumber,
        shift: req.user.shift || "Morning",
        position: "General Worker",
        phone: req.user.phone,
      },
      company: company || { companyName: "Your Company" },
      workArea: workArea,
      stats: stats,
      recentActivities: recentActivities,
    });
  } catch (error) {
    console.error("Error loading worker dashboard:", error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/api/users/login");
  }
});
// Enterprise Admin Dashboard
router.get("/admin", ensureAuthenticated, (req, res) => {
  if (req.user.role !== "enterprise_admin" && req.user.role !== "system_admin") {
    req.flash("error", "Access denied - Admins only");
    return res.redirect("/api/users/login");
  }
  res.render("admin/dashboard", {
    user: req.user,
  });
});

module.exports = router;
