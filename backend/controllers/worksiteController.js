// const Worksite = require("../models/Worksite");
// const WorkArea = require("../models/WorkArea");
// const SafetyOfficer = require("../models/SafetyOfficer");

// // Get all worksites for the logged-in user
// // exports.getMyWorksites = async (req, res) => {
// //   try {
// //     let worksites = [];

// //     // If user is safety officer (solo or enterprise)
// //     if (req.user.safetyOfficer) {
// //       worksites = await Worksite.find({
// //         $or: [
// //           { "assignedSafetyOfficers.officer": req.user.safetyOfficer },
// //           { "ownership.owner": req.user.safetyOfficer },
// //         ],
// //       }).populate("assignedSafetyOfficers.officer", "name email");
// //     }
// //     // If user is admin (enterprise)
// //     else if (req.user.role === "system_admin") {
// //       worksites = await Worksite.find({}).populate(
// //         "assignedSafetyOfficers.officer",
// //         "name email",
// //       );
// //     }

// //     res.render("worksites/list", {
// //       user: req.user,
// //       worksites,
// //     });
// //   } catch (error) {
// //     console.error("Error getting worksites:", error);
// //     req.flash("error", "Error loading worksites");
// //     res.redirect("/dashboard");
// //   }
// // };

// // Get all worksites for the logged-in user (with pagination)
// exports.getMyWorksites = async (req, res) => {
//   try {
//     const { search = "", status = "", page = 1, limit = 9 } = req.query;
//     const query = {};

//     // Build search query
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { location: { $regex: search, $options: "i" } },
//       ];
//     }

//     if (status) {
//       query.status = status;
//     }

//     let worksites = [];
//     let total = 0;

//     // If user is safety officer (solo or enterprise)
//     if (req.user.safetyOfficer) {
//       const officerQuery = {
//         ...query,
//         $or: [
//           { "assignedSafetyOfficers.officer": req.user.safetyOfficer },
//           { "ownership.owner": req.user.safetyOfficer },
//         ],
//       };

//       total = await Worksite.countDocuments(officerQuery);
//       worksites = await Worksite.find(officerQuery)
//         .populate("assignedSafetyOfficers.officer", "name email")
//         .populate("workAreas")
//         .sort({ createdAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit));
//     }
//     // If user is admin (enterprise)
//     else if (req.user.role === "system_admin") {
//       total = await Worksite.countDocuments(query);
//       worksites = await Worksite.find(query)
//         .populate("assignedSafetyOfficers.officer", "name email")
//         .populate("workAreas")
//         .sort({ createdAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit));
//     }

//     res.render("worksites/list", {
//       user: req.user,
//       worksites,
//       search: search, // Always pass search (even if empty)
//       status: status, // Always pass status (even if empty)
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Error getting worksites:", error);
//     req.flash("error", "Error loading worksites");
//     res.redirect("/dashboard");
//   }
// };

// // Show create worksite form
// exports.showCreateWorksiteForm = async (req, res) => {
//   try {
//     // Get available safety officers for assignment (if admin)
//     let safetyOfficers = [];
//     if (req.user.role === "system_admin") {
//       safetyOfficers = await SafetyOfficer.find({
//         verificationStatus: "verified",
//       }).select("name email");
//     }

//     res.render("worksites/create", {
//       user: req.user,
//       safetyOfficers,
//       isSolo: req.user.isDualRole || false,
//     });
//   } catch (error) {
//     console.error("Error loading create form:", error);
//     req.flash("error", "Error loading form");
//     res.redirect("/worksites/my-worksites");
//   }
// };

// // Create new worksite
// // exports.createWorksite = async (req, res) => {
// //   try {
// //     const {
// //       name,
// //       location,
// //       siteType,
// //       description,
// //       clientName,
// //       clientContact,
// //       shifts,
// //       assignedOfficers,
// //     } = req.body;

// //     // Determine ownership based on user type
// //     let ownership = {};
// //     if (req.user.isDualRole || req.user.role === "safety_officer") {
// //       // Solo user or individual officer
// //       ownership = {
// //         type: "individual",
// //         owner: req.user.safetyOfficer,
// //         createdBy: req.user._id,
// //       };
// //     } else {
// //       // Enterprise admin
// //       ownership = {
// //         type: "enterprise",
// //         createdBy: req.user._id,
// //       };
// //     }

// //     // Parse shifts if provided
// //     let shiftsArray = [];
// //     if (shifts) {
// //       try {
// //         shiftsArray = typeof shifts === "string" ? JSON.parse(shifts) : shifts;
// //       } catch (e) {
// //         shiftsArray = [];
// //       }
// //     }

// //     const newWorksite = new Worksite({
// //       name,
// //       location,
// //       siteType,
// //       description,
// //       clientName,
// //       clientContact,
// //       shifts: shiftsArray,
// //       ownership,
// //       status: "active",
// //       createdBy: req.user._id,
// //     });

// //     // Handle officer assignments
// //     if (assignedOfficers && req.user.role === "system_admin") {
// //       // Admin assigning officers
// //       const officers =
// //         typeof assignedOfficers === "string"
// //           ? JSON.parse(assignedOfficers)
// //           : [assignedOfficers];

// //       officers.forEach((officerId) => {
// //         newWorksite.assignedSafetyOfficers.push({
// //           officer: officerId,
// //           role: "assistant",
// //           assignedDate: new Date(),
// //           isActive: true,
// //         });
// //       });
// //     } else if (req.user.safetyOfficer) {
// //       // Solo user assigns themselves
// //       newWorksite.assignedSafetyOfficers.push({
// //         officer: req.user.safetyOfficer,
// //         role: "lead",
// //         isPrimary: true,
// //         assignedDate: new Date(),
// //         isActive: true,
// //       });
// //     }

// //     await newWorksite.save();

// //     // Update safety officers' worksites list
// //     for (const assignment of newWorksite.assignedSafetyOfficers) {
// //       await SafetyOfficer.findByIdAndUpdate(assignment.officer, {
// //         $addToSet: { worksites: newWorksite._id },
// //       });
// //     }

// //     req.flash("success", `Worksite "${name}" created successfully`);
// //     res.redirect(`/worksites/${newWorksite._id}`);
// //   } catch (error) {
// //     console.error("Error creating worksite:", error);
// //     req.flash("error", "Error creating worksite");
// //     res.redirect("/worksites/create");
// //   }
// // };

// // Create new worksite (updated version)
// exports.createWorksite = async (req, res) => {
//   try {
//     const {
//       name,
//       location,
//       siteType,
//       description,
//       clientName,
//       clientContact,
//       siteOverview,
//       knownChallenges,
//       shifts,
//       assignedOfficers,
//     } = req.body;

//     // Determine ownership based on user type
//     let ownership = {};
//     if (req.user.isDualRole || req.user.role === "safety_officer") {
//       ownership = {
//         type: "individual",
//         owner: req.user.safetyOfficer,
//         createdBy: req.user._id,
//       };
//     } else {
//       ownership = {
//         type: "enterprise",
//         createdBy: req.user._id,
//       };
//     }

//     // Parse shifts
//     let shiftsArray = [];
//     if (shifts) {
//       shiftsArray = Array.isArray(shifts) ? shifts : [shifts];
//     }

//     // Parse known challenges
//     let challengesArray = [];
//     if (knownChallenges) {
//       challengesArray = knownChallenges.split(",").map((c) => c.trim());
//     }

//     const newWorksite = new Worksite({
//       name,
//       location,
//       siteType,
//       description,
//       clientName,
//       clientContact,
//       shifts: shiftsArray.map((shift) => ({
//         name: shift,
//         startTime: "08:00",
//         endTime: "17:00",
//       })),
//       ownership,
//       siteContext: {
//         overview: siteOverview || "",
//         knownChallenges: challengesArray,
//         strategicPriorities: [],
//         managementContacts: [],
//       },
//       status: "active",
//       createdBy: req.user._id,
//     });

//     // Handle officer assignments
//     if (assignedOfficers && req.user.role === "system_admin") {
//       const officers = Array.isArray(assignedOfficers)
//         ? assignedOfficers
//         : [assignedOfficers];

//       officers.forEach((officerId) => {
//         newWorksite.assignedSafetyOfficers.push({
//           officer: officerId,
//           role: "assistant",
//           assignedDate: new Date(),
//           isActive: true,
//         });
//       });
//     } else if (req.user.safetyOfficer) {
//       // Solo user assigns themselves
//       newWorksite.assignedSafetyOfficers.push({
//         officer: req.user.safetyOfficer,
//         role: "lead",
//         isPrimary: true,
//         assignedDate: new Date(),
//         isActive: true,
//       });
//     }

//     await newWorksite.save();

//     // Update safety officers' worksites list
//     for (const assignment of newWorksite.assignedSafetyOfficers) {
//       await SafetyOfficer.findByIdAndUpdate(assignment.officer, {
//         $addToSet: { worksites: newWorksite._id },
//       });
//     }

//     req.flash(
//       "success",
//       `Worksite "${name}" created successfully! You can now add work areas.`,
//     );
//     res.redirect(`/worksites/${newWorksite._id}`);
//   } catch (error) {
//     console.error("Error creating worksite:", error);
//     req.flash("error", "Error creating worksite");
//     res.redirect("/worksites/create");
//   }
// };

// // View single worksite
// exports.getWorksite = async (req, res) => {
//   try {
//     const worksite = await Worksite.findById(req.params.id)
//       .populate("assignedSafetyOfficers.officer", "name email")
//       .populate("workAreas")
//       .populate("teamMembers.officer", "name email");

//     if (!worksite) {
//       req.flash("error", "Worksite not found");
//       return res.redirect("/worksites/my-worksites");
//     }

//     // Check access
//     const hasAccess = await checkWorksiteAccess(req.user, worksite);
//     if (!hasAccess) {
//       req.flash("error", "You don't have access to this worksite");
//       return res.redirect("/worksites/my-worksites");
//     }

//     // Get work areas for this worksite
//     const workAreas = await WorkArea.find({ worksite: worksite._id }).populate(
//       "assignedSafetyOfficers.officer",
//       "name email",
//     );

//     res.render("worksites/view", {
//       user: req.user,
//       worksite,
//       workAreas,
//     });
//   } catch (error) {
//     console.error("Error viewing worksite:", error);
//     req.flash("error", "Error loading worksite");
//     res.redirect("/worksites/my-worksites");
//   }
// };

// // Show edit worksite form
// exports.showEditWorksiteForm = async (req, res) => {
//   try {
//     const worksite = await Worksite.findById(req.params.id);

//     if (!worksite) {
//       req.flash("error", "Worksite not found");
//       return res.redirect("/worksites/my-worksites");
//     }

//     // Check edit permission
//     const canEdit = await checkWorksiteEditPermission(req.user, worksite);
//     if (!canEdit) {
//       req.flash("error", "You don't have permission to edit this worksite");
//       return res.redirect(`/worksites/${worksite._id}`);
//     }

//     const safetyOfficers = await SafetyOfficer.find({
//       verificationStatus: "verified",
//     }).select("name email");

//     res.render("worksites/edit", {
//       user: req.user,
//       worksite,
//       safetyOfficers,
//     });
//   } catch (error) {
//     console.error("Error loading edit form:", error);
//     req.flash("error", "Error loading form");
//     res.redirect("/worksites/my-worksites");
//   }
// };

// // Update worksite
// exports.updateWorksite = async (req, res) => {
//   try {
//     const worksite = await Worksite.findById(req.params.id);

//     if (!worksite) {
//       req.flash("error", "Worksite not found");
//       return res.redirect("/worksites/my-worksites");
//     }

//     // Update fields
//     const {
//       name,
//       location,
//       siteType,
//       description,
//       clientName,
//       clientContact,
//       status,
//     } = req.body;

//     worksite.name = name || worksite.name;
//     worksite.location = location || worksite.location;
//     worksite.siteType = siteType || worksite.siteType;
//     worksite.description = description || worksite.description;
//     worksite.clientName = clientName || worksite.clientName;
//     worksite.clientContact = clientContact || worksite.clientContact;
//     worksite.status = status || worksite.status;

//     await worksite.save();

//     req.flash("success", "Worksite updated successfully");
//     res.redirect(`/worksites/${worksite._id}`);
//   } catch (error) {
//     console.error("Error updating worksite:", error);
//     req.flash("error", "Error updating worksite");
//     res.redirect(`/worksites/${req.params.id}/edit`);
//   }
// };

// // Share worksite with another officer (for solo users)
// exports.shareWorksite = async (req, res) => {
//   try {
//     const { worksiteId } = req.params;
//     const { officerEmail, role } = req.body;

//     const worksite = await Worksite.findById(worksiteId);

//     // Verify solo ownership
//     if (
//       worksite.ownership.owner.toString() !== req.user.safetyOfficer.toString()
//     ) {
//       return res.status(403).json({ error: "Not authorized" });
//     }

//     const officer = await SafetyOfficer.findOne({ email: officerEmail });
//     if (!officer) {
//       return res.status(404).json({ error: "Officer not found" });
//     }

//     // Check if already shared
//     const alreadyShared = worksite.teamMembers.some(
//       (m) => m.officer.toString() === officer._id.toString(),
//     );

//     if (alreadyShared) {
//       return res.status(400).json({ error: "Officer already has access" });
//     }

//     worksite.teamMembers.push({
//       officer: officer._id,
//       role: role || "viewer",
//       addedBy: req.user.safetyOfficer,
//       addedAt: new Date(),
//     });

//     await worksite.save();

//     // Add to officer's worksites
//     officer.worksites.push(worksite._id);
//     await officer.save();

//     req.flash("success", `Worksite shared with ${officer.name}`);
//     res.redirect(`/worksites/${worksiteId}`);
//   } catch (error) {
//     console.error("Error sharing worksite:", error);
//     req.flash("error", "Error sharing worksite");
//     res.redirect(`/worksites/${req.params.worksiteId}`);
//   }
// };

// // Helper functions
// async function checkWorksiteAccess(user, worksite) {
//   if (user.role === "system_admin") return true;
//   if (user.safetyOfficer) {
//     // Check if assigned, owner, or team member
//     return (
//       worksite.assignedSafetyOfficers.some(
//         (a) => a.officer.toString() === user.safetyOfficer.toString(),
//       ) ||
//       worksite.ownership.owner?.toString() === user.safetyOfficer.toString() ||
//       worksite.teamMembers?.some(
//         (m) => m.officer.toString() === user.safetyOfficer.toString(),
//       )
//     );
//   }
//   return false;
// }

// async function checkWorksiteEditPermission(user, worksite) {
//   if (user.role === "system_admin") return true;
//   if (user.safetyOfficer) {
//     // Owners and lead officers can edit
//     return (
//       worksite.ownership.owner?.toString() === user.safetyOfficer.toString() ||
//       worksite.assignedSafetyOfficers.some(
//         (a) =>
//           a.officer.toString() === user.safetyOfficer.toString() &&
//           a.role === "lead",
//       )
//     );
//   }
//   return false;
// }

const Worksite = require("../models/Worksite");
const WorkArea = require("../models/WorkArea");
const SafetyOfficer = require("../models/SafetyOfficer");

// ===== HELPER FUNCTIONS - MUST BE DEFINED FIRST =====
async function checkWorksiteAccess(user, worksite) {
  if (user.role === "enterprise_admin" || user.role === "system_admin") {
    return true;
  }
  if (user.safetyOfficer) {
    // Check if assigned as safety officer
    return (
      worksite.assignedSafetyOfficers.some(
        (a) => a.officer.toString() === user.safetyOfficer.toString(),
      ) ||
      worksite.ownership.owner?.toString() === user.safetyOfficer.toString()
    );
  }
  return false;
}

async function checkWorksiteEditPermission(user, worksite) {
  if (user.role === "enterprise_admin" || user.role === "system_admin") {
    return true;
  }
  if (user.safetyOfficer) {
    // Owners and lead officers can edit
    return (
      worksite.ownership.owner?.toString() === user.safetyOfficer.toString() ||
      worksite.assignedSafetyOfficers.some(
        (a) =>
          a.officer.toString() === user.safetyOfficer.toString() &&
          a.role === "lead",
      )
    );
  }
  return false;
}

// ===== CONTROLLER FUNCTIONS =====

// Get all worksites for the logged-in user (with pagination)
exports.getMyWorksites = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 9 } = req.query;
    const query = {};

    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    let worksites = [];
    let total = 0;

    // If user is safety officer (solo or enterprise)
    if (req.user.safetyOfficer) {
      const officerQuery = {
        ...query,
        $or: [
          { "assignedSafetyOfficers.officer": req.user.safetyOfficer },
          { "ownership.owner": req.user.safetyOfficer },
        ],
      };

      total = await Worksite.countDocuments(officerQuery);
      worksites = await Worksite.find(officerQuery)
        .populate("assignedSafetyOfficers.officer", "name email")
        .populate("workAreas")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    }
    // If user is admin (enterprise)
    else if (
      req.user.role === "enterprise_admin" ||
      req.user.role === "system_admin"
    ) {
      total = await Worksite.countDocuments(query);
      worksites = await Worksite.find(query)
        .populate("assignedSafetyOfficers.officer", "name email")
        .populate("workAreas")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    }

    res.render("worksites/list", {
      user: req.user,
      worksites,
      search: search,
      status: status,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting worksites:", error);
    req.flash("error", "Error loading worksites");
    res.redirect("/dashboard");
  }
};

// Show create worksite form
exports.showCreateWorksiteForm = async (req, res) => {
  try {
    // Get available safety officers for assignment (if admin)
    let safetyOfficers = [];
    if (req.user.role === "enterprise_admin" || req.user.role === "system_admin") {
      safetyOfficers = await SafetyOfficer.find({
        verificationStatus: "verified",
      }).select("name email");
    }

    res.render("worksites/create", {
      user: req.user,
      safetyOfficers,
      isSolo: req.user.isDualRole || false,
    });
  } catch (error) {
    console.error("Error loading create form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/worksites/my-worksites");
  }
};

// Create new worksite (updated version)
// exports.createWorksite = async (req, res) => {
//   try {
//     const {
//       name,
//       location,
//       siteType,
//       description,
//       clientName,
//       clientContact,
//       siteOverview,
//       knownChallenges,
//       shifts,
//       assignedOfficers,
//     } = req.body;

//     // Determine ownership based on user type
//     let ownership = {};
//     if (req.user.isDualRole || req.user.role === "safety_officer") {
//       ownership = {
//         type: "individual",
//         owner: req.user.safetyOfficer,
//         createdBy: req.user._id,
//       };
//     } else {
//       ownership = {
//         type: "enterprise",
//         createdBy: req.user._id,
//       };
//     }

//     // Parse shifts
//     let shiftsArray = [];
//     if (shifts) {
//       shiftsArray = Array.isArray(shifts) ? shifts : [shifts];
//     }

//     // Parse known challenges
//     let challengesArray = [];
//     if (knownChallenges) {
//       challengesArray = knownChallenges.split(",").map((c) => c.trim());
//     }

//     const newWorksite = new Worksite({
//       name,
//       location,
//       siteType,
//       description,
//       clientName,
//       clientContact,
//       shifts: shiftsArray.map((shift) => ({
//         name: shift,
//         startTime: "08:00",
//         endTime: "17:00",
//       })),
//       ownership,
//       siteContext: {
//         overview: siteOverview || "",
//         knownChallenges: challengesArray,
//         strategicPriorities: [],
//         managementContacts: [],
//       },
//       status: "active",
//       createdBy: req.user._id,
//     });

//     // Handle officer assignments
//     if (assignedOfficers && req.user.role === "system_admin") {
//       const officers = Array.isArray(assignedOfficers)
//         ? assignedOfficers
//         : [assignedOfficers];

//       officers.forEach((officerId) => {
//         newWorksite.assignedSafetyOfficers.push({
//           officer: officerId,
//           role: "assistant",
//           assignedDate: new Date(),
//           isActive: true,
//         });
//       });
//     } else if (req.user.safetyOfficer) {
//       // Solo user assigns themselves
//       newWorksite.assignedSafetyOfficers.push({
//         officer: req.user.safetyOfficer,
//         role: "lead",
//         isPrimary: true,
//         assignedDate: new Date(),
//         isActive: true,
//       });
//     }

//     await newWorksite.save();

//     // Update safety officers' worksites list
//     for (const assignment of newWorksite.assignedSafetyOfficers) {
//       await SafetyOfficer.findByIdAndUpdate(assignment.officer, {
//         $addToSet: { worksites: newWorksite._id },
//       });
//     }

//     req.flash(
//       "success",
//       `Worksite "${name}" created successfully! You can now add work areas.`,
//     );
//     res.redirect(`/worksites/${newWorksite._id}`);
//   } catch (error) {
//     console.error("Error creating worksite:", error);
//     req.flash("error", "Error creating worksite");
//     res.redirect("/worksites/create");
//   }
// };

// backend/controllers/worksiteController.js
// Update the createWorksite function to handle all the new fields

// backend/controllers/worksiteController.js
// Update the createWorksite function

// backend/controllers/worksiteController.js
// Updated createWorksite function - built on the working version

// backend/controllers/worksiteController.js
// Updated createWorksite function - with proper JSON parsing

exports.createWorksite = async (req, res) => {
  try {
    const body = req.body;

    // Helper function to safely parse JSON data from form
    const safeParseJSON = (data) => {
      if (!data) return null;
      if (typeof data === "object") return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    };

    // Extract and parse fields that might be JSON strings
    const primaryActivities = safeParseJSON(body.primaryActivities);
    const activityDescriptions = safeParseJSON(body.activityDescriptions);
    const shifts = safeParseJSON(body.shifts);
    const assignedOfficers = safeParseJSON(body.assignedOfficers);
    const knownChallenges = safeParseJSON(body.knownChallenges);
    const utilitiesNearby = safeParseJSON(body.utilitiesNearby);
    const voltageLevels = safeParseJSON(body.voltageLevels);
    const fallProtection = safeParseJSON(body.fallProtection);

    // Parse shifts array
    let shiftsArray = [];
    if (shifts) {
      shiftsArray = Array.isArray(shifts) ? shifts : [shifts];
    } else if (body.shifts) {
      shiftsArray = Array.isArray(body.shifts) ? body.shifts : [body.shifts];
    }

    // Parse known challenges
    let challengesArray = [];
    if (knownChallenges && Array.isArray(knownChallenges)) {
      challengesArray = knownChallenges;
    } else if (body.knownChallenges) {
      challengesArray = body.knownChallenges.split(",").map((c) => c.trim());
    }

    // Parse primary activities
    let activitiesArray = [];
    let primaryActivitiesList = primaryActivities || body.primaryActivities;
    let activityDescriptionsList =
      activityDescriptions || body.activityDescriptions;

    if (primaryActivitiesList) {
      const activityNames = Array.isArray(primaryActivitiesList)
        ? primaryActivitiesList
        : [primaryActivitiesList];
      const activityDescs = activityDescriptionsList
        ? Array.isArray(activityDescriptionsList)
          ? activityDescriptionsList
          : [activityDescriptionsList]
        : [];

      activitiesArray = activityNames.map((act, idx) => ({
        activity: act,
        description: activityDescs[idx] || "",
        equipmentUsed: [],
      }));
    }

    // Determine ownership
    let ownership = {};
    if (req.user.isDualRole || req.user.role === "safety_officer") {
      ownership = {
        type: "individual",
        owner: req.user.safetyOfficer,
        createdBy: req.user._id,
      };
    } else {
      ownership = {
        type: "enterprise",
        createdBy: req.user._id,
      };
    }

    // Create the worksite with all fields - using simple assignments, no complex nested arrays
    const newWorksite = new Worksite({
      // Basic fields
      name: body.name,
      location: body.location,
      siteType: body.siteType,
      description: body.description || "",
      clientName: body.clientName || "",
      clientContact: body.clientContact || "",
      clientEmail: body.clientEmail || "",

      // Shifts (using simple format)
      shifts: shiftsArray.map((shift) => ({
        name: shift,
        startTime:
          shift === "morning"
            ? "06:00"
            : shift === "afternoon"
              ? "14:00"
              : "22:00",
        endTime:
          shift === "morning"
            ? "14:00"
            : shift === "afternoon"
              ? "22:00"
              : "06:00",
      })),

      // Ownership
      ownership,

      // Site context
      siteContext: {
        overview: body.siteOverview || "",
        knownChallenges: challengesArray,
        strategicPriorities: [],
        managementContacts: [],
      },

      status: "active",
      createdBy: req.user._id,

      // Project duration
      projectDuration: {
        startDate: body.startDate ? new Date(body.startDate) : null,
        expectedEndDate: body.endDate ? new Date(body.endDate) : null,
        estimatedDurationMonths: body.durationMonths
          ? parseInt(body.durationMonths)
          : null,
      },

      // Workforce
      workforce: {
        estimatedTotalWorkers: body.totalWorkers
          ? parseInt(body.totalWorkers)
          : 0,
        estimatedPeakWorkers: body.peakWorkers ? parseInt(body.peakWorkers) : 0,
        breakdown: {
          contractors: body.contractors ? parseInt(body.contractors) : 0,
        },
        shifts: shiftsArray.map((shift) => ({
          name: shift,
          startTime:
            shift === "morning"
              ? "06:00"
              : shift === "afternoon"
                ? "14:00"
                : "22:00",
          endTime:
            shift === "morning"
              ? "14:00"
              : shift === "afternoon"
                ? "22:00"
                : "06:00",
          workerCount: 0,
        })),
      },

      // Site characteristics
      siteCharacteristics: {
        totalArea: body.siteArea ? parseFloat(body.siteArea) : null,
        terrain: body.terrain || "flat",
        soilType: body.soilType || "unknown",
        proximityToWater: body.waterProximity || "none",
        waterBodyType: body.waterBodyType || "not_applicable",
        protectedAreaProximity: {
          isInProtectedArea:
            body.inProtectedArea === "true" || body.inProtectedArea === true,
          protectedAreaType: "none",
        },
      },

      // Activities - using simple boolean flags only, not complex nested arrays
      activities: {
        primaryActivities: activitiesArray,
        workAtHeights: {
          isPresent:
            body.hasWorkAtHeights === "true" || body.hasWorkAtHeights === true,
          maxHeight: body.maxHeight ? parseFloat(body.maxHeight) : null,
          fallProtectionType: fallProtection
            ? Array.isArray(fallProtection)
              ? fallProtection
              : [fallProtection]
            : [],
        },
        confinedSpaces: {
          isPresent:
            body.hasConfinedSpaces === "true" ||
            body.hasConfinedSpaces === true,
          spaces: [], // Keep empty initially to avoid schema issues
        },
        heavyEquipment: {
          isPresent:
            body.hasHeavyEquipment === "true" ||
            body.hasHeavyEquipment === true,
          equipment: [], // Keep empty initially to avoid schema issues
        },
        hazardousSubstances: {
          isPresent:
            body.hasHazardousSubstances === "true" ||
            body.hasHazardousSubstances === true,
          substances: [],
        },
        excavation: {
          isPresent:
            body.hasExcavation === "true" || body.hasExcavation === true,
          maxDepth: body.excavationDepth
            ? parseFloat(body.excavationDepth)
            : null,
          utilitiesNearby: utilitiesNearby
            ? Array.isArray(utilitiesNearby)
              ? utilitiesNearby
              : [utilitiesNearby]
            : [],
        },
        electricalWork: {
          isPresent:
            body.hasElectricalWork === "true" ||
            body.hasElectricalWork === true,
          voltageLevels: voltageLevels
            ? Array.isArray(voltageLevels)
              ? voltageLevels
              : [voltageLevels]
            : [],
        },
      },

      // Safety resources
      safetyResources: {
        hasSafetyOfficer:
          body.hasSafetyOfficer === "true" || body.hasSafetyOfficer === true,
        safetyOfficerCount: body.safetyOfficerCount
          ? parseInt(body.safetyOfficerCount)
          : 0,
        hasSafetyCommittee:
          body.hasSafetyCommittee === "true" ||
          body.hasSafetyCommittee === true,
        committeeMembers: body.committeeMembers
          ? parseInt(body.committeeMembers)
          : 0,

        firstAid: {
          firstAidBoxes: body.firstAidBoxes ? parseInt(body.firstAidBoxes) : 0,
          trainedFirstAiders: body.trainedFirstAiders
            ? parseInt(body.trainedFirstAiders)
            : 0,
        },

        fireSafety: {
          fireExtinguishers: body.fireExtinguishers
            ? parseInt(body.fireExtinguishers)
            : 0,
          fireHoses: body.fireHoses ? parseInt(body.fireHoses) : 0,
          evacuationPlan:
            body.hasEvacuationPlan === "true" ||
            body.hasEvacuationPlan === true,
          assemblyPoint:
            body.hasAssemblyPoint === "true" || body.hasAssemblyPoint === true,
        },

        medicalFacilities: {
          onSiteClinic:
            body.hasOnSiteClinic === "true" || body.hasOnSiteClinic === true,
          nearestHospital: body.nearestHospital || "",
          emergencyContact: body.emergencyContact || "",
        },
      },
    });

    // Handle officer assignments
    let officersList = assignedOfficers || body.assignedOfficers;
    if (
      officersList &&
      (req.user.role === "enterprise_admin" || req.user.role === "system_admin")
    ) {
      const officers = Array.isArray(officersList)
        ? officersList
        : [officersList];
      officers.forEach((officerId) => {
        if (officerId) {
          newWorksite.assignedSafetyOfficers.push({
            officer: officerId,
            role: "assistant",
            assignedDate: new Date(),
            isActive: true,
          });
        }
      });
    } else if (req.user.safetyOfficer) {
      newWorksite.assignedSafetyOfficers.push({
        officer: req.user.safetyOfficer,
        role: "lead",
        isPrimary: true,
        assignedDate: new Date(),
        isActive: true,
      });
    }

    await newWorksite.save();

    // Update safety officers' worksites list
    for (const assignment of newWorksite.assignedSafetyOfficers) {
      if (assignment.officer) {
        await SafetyOfficer.findByIdAndUpdate(assignment.officer, {
          $addToSet: { worksites: newWorksite._id },
        });
      }
    }

    req.flash(
      "success",
      `Worksite "${newWorksite.name}" created successfully! You can now add work areas.`,
    );
    res.redirect(`/worksites/${newWorksite._id}`);
  } catch (error) {
    console.error("Error creating worksite:", error);
    req.flash("error", `Error creating worksite: ${error.message}`);
    res.redirect("/worksites/create");
  }
};
// View single worksite
// exports.getWorksite = async (req, res) => {
//   try {
//     const worksite = await Worksite.findById(req.params.id)
//       .populate("assignedSafetyOfficers.officer", "name email")
//       .populate("workAreas");

//     if (!worksite) {
//       req.flash("error", "Worksite not found");
//       return res.redirect("/worksites/my-worksites");
//     }

//     // Check access
//     const hasAccess = await checkWorksiteAccess(req.user, worksite);
//     if (!hasAccess) {
//       req.flash("error", "You don't have access to this worksite");
//       return res.redirect("/worksites/my-worksites");
//     }

//     // Get work areas for this worksite with their assigned officers
//     const workAreas = await WorkArea.find({ worksite: worksite._id }).populate(
//       "assignedSafetyOfficers.officer",
//       "name email",
//     );

//     res.render("worksites/view", {
//       user: req.user,
//       worksite,
//       workAreas,
//     });
//   } catch (error) {
//     console.error("Error viewing worksite:", error);
//     req.flash("error", "Error loading worksite");
//     res.redirect("/worksites/my-worksites");
//   }
// };

// In your worksiteController.js, update the getWorksite function

// View single worksite
exports.getWorksite = async (req, res) => {
  try {
    const worksite = await Worksite.findById(req.params.id)
      .populate("assignedSafetyOfficers.officer", "name email")
      .populate("workAreas");

    if (!worksite) {
      req.flash("error", "Worksite not found");
      return res.redirect("/worksites/my-worksites");
    }

    // Check access
    const hasAccess = await checkWorksiteAccess(req.user, worksite);
    if (!hasAccess) {
      req.flash("error", "You don't have access to this worksite");
      return res.redirect("/worksites/my-worksites");
    }

    // Get work areas for this worksite with their assigned officers
    const workAreas = await WorkArea.find({ worksite: worksite._id })
      .populate("assignedSafetyOfficers.officer", "name email")
      .sort({ createdAt: -1 });

    // Calculate overall compliance percentage
    let overallCompliancePercentage = 0;
    if (
      worksite.complianceStatus &&
      worksite.complianceStatus.sections &&
      worksite.complianceStatus.sections.length > 0
    ) {
      const totalProgress = worksite.complianceStatus.sections.reduce(
        (sum, section) => sum + (section.progress || 0),
        0,
      );
      overallCompliancePercentage = Math.round(
        totalProgress / worksite.complianceStatus.sections.length,
      );
    } else {
      // If no compliance status exists yet, initialize default sections
      const defaultSections = [
        {
          sectionNumber: "14",
          title: "Duties of Employer",
          progress: 0,
          status: "not_started",
        },
        {
          sectionNumber: "16",
          title: "Duties of Employee",
          progress: 0,
          status: "not_started",
        },
        {
          sectionNumber: "23",
          title: "Risk Assessment",
          progress: 0,
          status: "not_started",
        },
        {
          sectionNumber: "24-34",
          title: "Medical Examinations",
          progress: 0,
          status: "not_started",
        },
        {
          sectionNumber: "59-60",
          title: "Environmental & Health Protection",
          progress: 0,
          status: "not_started",
        },
        {
          sectionNumber: "64",
          title: "Notification of Accidents",
          progress: 0,
          status: "not_started",
        },
        {
          sectionNumber: "eia_class",
          title: "EIA Project Classification",
          progress: 0,
          status: "not_started",
        },
        {
          sectionNumber: "eia_consult",
          title: "Public Consultation",
          progress: 0,
          status: "not_started",
        },
      ];

      worksite.complianceStatus = {
        overallScore: 0,
        sections: defaultSections,
      };
      // Optionally save the initialized compliance status
      // await worksite.save();
    }

    res.render("worksites/view", {
      user: req.user,
      worksite,
      workAreas,
      overallCompliancePercentage,
    });
  } catch (error) {
    console.error("Error viewing worksite:", error);
    req.flash("error", "Error loading worksite");
    res.redirect("/worksites/my-worksites");
  }
};

// Show edit worksite form
// exports.showEditWorksiteForm = async (req, res) => {
//   try {
//     const worksite = await Worksite.findById(req.params.id);

//     if (!worksite) {
//       req.flash("error", "Worksite not found");
//       return res.redirect("/worksites/my-worksites");
//     }

//     // Check edit permission
//     const canEdit = await checkWorksiteEditPermission(req.user, worksite);
//     if (!canEdit) {
//       req.flash("error", "You don't have permission to edit this worksite");
//       return res.redirect(`/worksites/${worksite._id}`);
//     }

//     const safetyOfficers = await SafetyOfficer.find({
//       verificationStatus: "verified",
//     }).select("name email");

//     res.render("worksites/edit", {
//       user: req.user,
//       worksite,
//       safetyOfficers,
//     });
//   } catch (error) {
//     console.error("Error loading edit form:", error);
//     req.flash("error", "Error loading form");
//     res.redirect("/worksites/my-worksites");
//   }
// };

// // Update worksite
// exports.updateWorksite = async (req, res) => {
//   try {
//     const worksite = await Worksite.findById(req.params.id);

//     if (!worksite) {
//       req.flash("error", "Worksite not found");
//       return res.redirect("/worksites/my-worksites");
//     }

//     // Update fields
//     const {
//       name,
//       location,
//       siteType,
//       description,
//       clientName,
//       clientContact,
//       status,
//       siteOverview,
//       knownChallenges,
//       shifts,
//     } = req.body;

//     // Basic info updates
//     worksite.name = name || worksite.name;
//     worksite.location = location || worksite.location;
//     worksite.siteType = siteType || worksite.siteType;
//     worksite.description = description || worksite.description;
//     worksite.clientName = clientName || worksite.clientName;
//     worksite.clientContact = clientContact || worksite.clientContact;
//     worksite.status = status || worksite.status;

//     // Update site context for AI
//     if (!worksite.siteContext) {
//       worksite.siteContext = {};
//     }

//     if (siteOverview !== undefined) {
//       worksite.siteContext.overview = siteOverview;
//     }

//     if (knownChallenges !== undefined) {
//       // Parse known challenges (split by commas and trim)
//       worksite.siteContext.knownChallenges = knownChallenges
//         ? knownChallenges
//             .split(",")
//             .map((c) => c.trim())
//             .filter((c) => c)
//         : [];
//     }

//     // Update shifts
//     let shiftsArray = [];
//     if (shifts) {
//       shiftsArray = Array.isArray(shifts) ? shifts : [shifts];

//       // Convert to the format expected by the schema
//       worksite.shifts = shiftsArray.map((shift) => ({
//         name: shift,
//         startTime: "08:00",
//         endTime: "17:00",
//       }));
//     } else {
//       // If no shifts selected, clear the array
//       worksite.shifts = [];
//     }

//     await worksite.save();

//     req.flash("success", "Worksite updated successfully");
//     res.redirect(`/worksites/${worksite._id}`);
//   } catch (error) {
//     console.error("Error updating worksite:", error);
//     req.flash("error", "Error updating worksite");
//     res.redirect(`/worksites/${req.params.id}/edit`);
//   }
// };

// backend/controllers/worksiteController.js
// Replace the showEditWorksiteForm and updateWorksite functions

// Show edit worksite form
exports.showEditWorksiteForm = async (req, res) => {
  try {
    const worksite = await Worksite.findById(req.params.id).populate(
      "assignedSafetyOfficers.officer",
      "name email officerNumber",
    );

    if (!worksite) {
      req.flash("error", "Worksite not found");
      return res.redirect("/worksites/my-worksites");
    }

    // Check edit permission
    const canEdit = await checkWorksiteEditPermission(req.user, worksite);
    if (!canEdit) {
      req.flash("error", "You don't have permission to edit this worksite");
      return res.redirect(`/worksites/${worksite._id}`);
    }

    const safetyOfficers = await SafetyOfficer.find({
      verificationStatus: "verified",
    }).select("name email officerNumber");

    // Prepare data for form display
    const formData = {
      // Basic info
      name: worksite.name,
      location: worksite.location,
      siteType: worksite.siteType,
      description: worksite.description || "",
      status: worksite.status,
      clientName: worksite.clientName || "",
      clientContact: worksite.clientContact || "",
      clientEmail: worksite.clientEmail || "",

      // Project duration
      startDate: worksite.projectDuration?.startDate
        ? worksite.projectDuration.startDate.toISOString().split("T")[0]
        : "",
      endDate: worksite.projectDuration?.expectedEndDate
        ? worksite.projectDuration.expectedEndDate.toISOString().split("T")[0]
        : "",
      durationMonths: worksite.projectDuration?.estimatedDurationMonths || "",

      // Workforce
      totalWorkers: worksite.workforce?.estimatedTotalWorkers || "",
      peakWorkers: worksite.workforce?.estimatedPeakWorkers || "",
      contractors: worksite.workforce?.breakdown?.contractors || "",
      shifts: worksite.shifts?.map((s) => s.name) || [],

      // Site characteristics
      siteArea: worksite.siteCharacteristics?.totalArea || "",
      terrain: worksite.siteCharacteristics?.terrain || "flat",
      soilType: worksite.siteCharacteristics?.soilType || "unknown",
      waterProximity: worksite.siteCharacteristics?.proximityToWater || "none",
      waterBodyType:
        worksite.siteCharacteristics?.waterBodyType || "not_applicable",
      inProtectedArea:
        worksite.siteCharacteristics?.protectedAreaProximity
          ?.isInProtectedArea || false,

      // Activities
      siteOverview: worksite.siteContext?.overview || "",
      knownChallenges: worksite.siteContext?.knownChallenges
        ? worksite.siteContext.knownChallenges.join(", ")
        : "",
      primaryActivities: worksite.activities?.primaryActivities || [],
      activityDescriptions:
        worksite.activities?.primaryActivities?.map((a) => a.description) || [],
      hasWorkAtHeights: worksite.activities?.workAtHeights?.isPresent || false,
      maxHeight: worksite.activities?.workAtHeights?.maxHeight || "",
      fallProtection: worksite.activities?.workAtHeights?.fallProtectionType
        ? worksite.activities.workAtHeights.fallProtectionType.join(", ")
        : "",
      hasConfinedSpaces:
        worksite.activities?.confinedSpaces?.isPresent || false,
      confinedSpacesDesc:
        worksite.activities?.confinedSpaces?.spaces?.length > 0
          ? worksite.activities.confinedSpaces.spaces[0].location
          : "",
      hasHeavyEquipment:
        worksite.activities?.heavyEquipment?.isPresent || false,
      equipmentTypes:
        worksite.activities?.heavyEquipment?.equipment?.length > 0
          ? worksite.activities.heavyEquipment.equipment[0].type
          : "",
      hasHazardousSubstances:
        worksite.activities?.hazardousSubstances?.isPresent || false,
      hazardousSubstancesList:
        worksite.activities?.hazardousSubstances?.substances?.length > 0
          ? worksite.activities.hazardousSubstances.substances[0].name
          : "",
      hasExcavation: worksite.activities?.excavation?.isPresent || false,
      excavationDepth: worksite.activities?.excavation?.maxDepth || "",
      utilitiesNearby: worksite.activities?.excavation?.utilitiesNearby
        ? worksite.activities.excavation.utilitiesNearby.join(", ")
        : "",
      hasElectricalWork:
        worksite.activities?.electricalWork?.isPresent || false,
      voltageLevels: worksite.activities?.electricalWork?.voltageLevels
        ? worksite.activities.electricalWork.voltageLevels.join(", ")
        : "",

      // Safety resources
      hasSafetyOfficer: worksite.safetyResources?.hasSafetyOfficer || false,
      safetyOfficerCount: worksite.safetyResources?.safetyOfficerCount || "",
      hasSafetyCommittee: worksite.safetyResources?.hasSafetyCommittee || false,
      committeeMembers: worksite.safetyResources?.committeeMembers || "",
      firstAidBoxes: worksite.safetyResources?.firstAid?.firstAidBoxes || "",
      trainedFirstAiders:
        worksite.safetyResources?.firstAid?.trainedFirstAiders || "",
      hasOnSiteClinic:
        worksite.safetyResources?.medicalFacilities?.onSiteClinic || false,
      nearestHospital:
        worksite.safetyResources?.medicalFacilities?.nearestHospital || "",
      emergencyContact:
        worksite.safetyResources?.medicalFacilities?.emergencyContact || "",
      fireExtinguishers:
        worksite.safetyResources?.fireSafety?.fireExtinguishers || "",
      fireHoses: worksite.safetyResources?.fireSafety?.fireHoses || "",
      hasEvacuationPlan:
        worksite.safetyResources?.fireSafety?.evacuationPlan || false,
      hasAssemblyPoint:
        worksite.safetyResources?.fireSafety?.assemblyPoint || false,
    };

    res.render("worksites/edit", {
      user: req.user,
      worksite,
      worksiteData: formData,
      safetyOfficers,
    });
  } catch (error) {
    console.error("Error loading edit form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/worksites/my-worksites");
  }
};

// Update worksite
exports.updateWorksite = async (req, res) => {
  try {
    const worksite = await Worksite.findById(req.params.id);

    if (!worksite) {
      req.flash("error", "Worksite not found");
      return res.redirect("/worksites/my-worksites");
    }

    const body = req.body;

    // Helper function to parse arrays
    const parseArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === "string") {
        try {
          const parsed = JSON.parse(field);
          if (Array.isArray(parsed)) return parsed;
          return [parsed];
        } catch (e) {
          return field
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item);
        }
      }
      return [field];
    };

    // Update basic fields
    worksite.name = body.name || worksite.name;
    worksite.location = body.location || worksite.location;
    worksite.siteType = body.siteType || worksite.siteType;
    worksite.description = body.description || worksite.description;
    worksite.clientName = body.clientName || worksite.clientName;
    worksite.clientContact = body.clientContact || worksite.clientContact;
    worksite.clientEmail = body.clientEmail || worksite.clientEmail;
    worksite.status = body.status || worksite.status;

    // Update project duration
    if (!worksite.projectDuration) worksite.projectDuration = {};
    worksite.projectDuration.startDate = body.startDate
      ? new Date(body.startDate)
      : null;
    worksite.projectDuration.expectedEndDate = body.endDate
      ? new Date(body.endDate)
      : null;
    worksite.projectDuration.estimatedDurationMonths = body.durationMonths
      ? parseInt(body.durationMonths)
      : null;

    // Update workforce
    if (!worksite.workforce) worksite.workforce = {};
    worksite.workforce.estimatedTotalWorkers = body.totalWorkers
      ? parseInt(body.totalWorkers)
      : 0;
    worksite.workforce.estimatedPeakWorkers = body.peakWorkers
      ? parseInt(body.peakWorkers)
      : 0;
    if (!worksite.workforce.breakdown) worksite.workforce.breakdown = {};
    worksite.workforce.breakdown.contractors = body.contractors
      ? parseInt(body.contractors)
      : 0;

    // Update shifts
    let shiftsArray = [];
    if (body.shifts) {
      shiftsArray = parseArrayField(body.shifts);
      worksite.shifts = shiftsArray.map((shift) => ({
        name: shift,
        startTime:
          shift === "morning"
            ? "06:00"
            : shift === "afternoon"
              ? "14:00"
              : "22:00",
        endTime:
          shift === "morning"
            ? "14:00"
            : shift === "afternoon"
              ? "22:00"
              : "06:00",
      }));

      // Also update workforce shifts
      worksite.workforce.shifts = shiftsArray.map((shift) => ({
        name: shift,
        startTime:
          shift === "morning"
            ? "06:00"
            : shift === "afternoon"
              ? "14:00"
              : "22:00",
        endTime:
          shift === "morning"
            ? "14:00"
            : shift === "afternoon"
              ? "22:00"
              : "06:00",
        workerCount: 0,
      }));
    } else {
      worksite.shifts = [];
      worksite.workforce.shifts = [];
    }

    // Update site characteristics
    if (!worksite.siteCharacteristics) worksite.siteCharacteristics = {};
    worksite.siteCharacteristics.totalArea = body.siteArea
      ? parseFloat(body.siteArea)
      : null;
    worksite.siteCharacteristics.terrain = body.terrain || "flat";
    worksite.siteCharacteristics.soilType = body.soilType || "unknown";
    worksite.siteCharacteristics.proximityToWater =
      body.waterProximity || "none";
    worksite.siteCharacteristics.waterBodyType =
      body.waterBodyType || "not_applicable";
    if (!worksite.siteCharacteristics.protectedAreaProximity)
      worksite.siteCharacteristics.protectedAreaProximity = {};
    worksite.siteCharacteristics.protectedAreaProximity.isInProtectedArea =
      body.inProtectedArea === "true" || body.inProtectedArea === true;

    // Update site context
    if (!worksite.siteContext) worksite.siteContext = {};
    worksite.siteContext.overview = body.siteOverview || "";
    worksite.siteContext.knownChallenges = body.knownChallenges
      ? body.knownChallenges.split(",").map((c) => c.trim())
      : [];

    // Update primary activities
    let activitiesArray = [];
    if (body.primaryActivities) {
      const activityNames = parseArrayField(body.primaryActivities);
      const activityDescs = body.activityDescriptions
        ? parseArrayField(body.activityDescriptions)
        : [];
      activitiesArray = activityNames.map((act, idx) => ({
        activity: act,
        description: activityDescs[idx] || "",
        equipmentUsed: [],
      }));
    }
    if (!worksite.activities) worksite.activities = {};
    worksite.activities.primaryActivities = activitiesArray;

    // Update work at heights
    if (!worksite.activities.workAtHeights)
      worksite.activities.workAtHeights = {};
    worksite.activities.workAtHeights.isPresent =
      body.hasWorkAtHeights === "true" || body.hasWorkAtHeights === true;
    worksite.activities.workAtHeights.maxHeight = body.maxHeight
      ? parseFloat(body.maxHeight)
      : null;
    worksite.activities.workAtHeights.fallProtectionType = body.fallProtection
      ? parseArrayField(body.fallProtection)
      : [];

    // Update confined spaces
    if (!worksite.activities.confinedSpaces)
      worksite.activities.confinedSpaces = {};
    worksite.activities.confinedSpaces.isPresent =
      body.hasConfinedSpaces === "true" || body.hasConfinedSpaces === true;
    if (
      worksite.activities.confinedSpaces.isPresent &&
      body.confinedSpacesDesc
    ) {
      worksite.activities.confinedSpaces.spaces = [
        {
          type: "unspecified",
          location: body.confinedSpacesDesc,
          entryPoints: 1,
          hazards: [],
        },
      ];
    } else {
      worksite.activities.confinedSpaces.spaces = [];
    }

    // Update heavy equipment
    if (!worksite.activities.heavyEquipment)
      worksite.activities.heavyEquipment = {};
    worksite.activities.heavyEquipment.isPresent =
      body.hasHeavyEquipment === "true" || body.hasHeavyEquipment === true;
    if (worksite.activities.heavyEquipment.isPresent && body.equipmentTypes) {
      worksite.activities.heavyEquipment.equipment = [
        {
          type: body.equipmentTypes,
          quantity: 1,
          operators: 1,
          certificationRequired: true,
        },
      ];
    } else {
      worksite.activities.heavyEquipment.equipment = [];
    }

    // Update hazardous substances
    if (!worksite.activities.hazardousSubstances)
      worksite.activities.hazardousSubstances = {};
    worksite.activities.hazardousSubstances.isPresent =
      body.hasHazardousSubstances === "true" ||
      body.hasHazardousSubstances === true;
    if (
      worksite.activities.hazardousSubstances.isPresent &&
      body.hazardousSubstancesList
    ) {
      worksite.activities.hazardousSubstances.substances = [
        {
          name: body.hazardousSubstancesList,
          quantity: "Not specified",
          storageLocation: "Not specified",
          safetyDataSheetAvailable: false,
          ppeRequired: [],
        },
      ];
    } else {
      worksite.activities.hazardousSubstances.substances = [];
    }

    // Update excavation
    if (!worksite.activities.excavation) worksite.activities.excavation = {};
    worksite.activities.excavation.isPresent =
      body.hasExcavation === "true" || body.hasExcavation === true;
    worksite.activities.excavation.maxDepth = body.excavationDepth
      ? parseFloat(body.excavationDepth)
      : null;
    worksite.activities.excavation.utilitiesNearby = body.utilitiesNearby
      ? parseArrayField(body.utilitiesNearby)
      : [];

    // Update electrical work
    if (!worksite.activities.electricalWork)
      worksite.activities.electricalWork = {};
    worksite.activities.electricalWork.isPresent =
      body.hasElectricalWork === "true" || body.hasElectricalWork === true;
    worksite.activities.electricalWork.voltageLevels = body.voltageLevels
      ? parseArrayField(body.voltageLevels)
      : [];

    // Update safety resources
    if (!worksite.safetyResources) worksite.safetyResources = {};
    worksite.safetyResources.hasSafetyOfficer =
      body.hasSafetyOfficer === "true" || body.hasSafetyOfficer === true;
    worksite.safetyResources.safetyOfficerCount = body.safetyOfficerCount
      ? parseInt(body.safetyOfficerCount)
      : 0;
    worksite.safetyResources.hasSafetyCommittee =
      body.hasSafetyCommittee === "true" || body.hasSafetyCommittee === true;
    worksite.safetyResources.committeeMembers = body.committeeMembers
      ? parseInt(body.committeeMembers)
      : 0;

    // Update first aid
    if (!worksite.safetyResources.firstAid)
      worksite.safetyResources.firstAid = {};
    worksite.safetyResources.firstAid.firstAidBoxes = body.firstAidBoxes
      ? parseInt(body.firstAidBoxes)
      : 0;
    worksite.safetyResources.firstAid.trainedFirstAiders =
      body.trainedFirstAiders ? parseInt(body.trainedFirstAiders) : 0;

    // Update fire safety
    if (!worksite.safetyResources.fireSafety)
      worksite.safetyResources.fireSafety = {};
    worksite.safetyResources.fireSafety.fireExtinguishers =
      body.fireExtinguishers ? parseInt(body.fireExtinguishers) : 0;
    worksite.safetyResources.fireSafety.fireHoses = body.fireHoses
      ? parseInt(body.fireHoses)
      : 0;
    worksite.safetyResources.fireSafety.evacuationPlan =
      body.hasEvacuationPlan === "true" || body.hasEvacuationPlan === true;
    worksite.safetyResources.fireSafety.assemblyPoint =
      body.hasAssemblyPoint === "true" || body.hasAssemblyPoint === true;

    // Update medical facilities
    if (!worksite.safetyResources.medicalFacilities)
      worksite.safetyResources.medicalFacilities = {};
    worksite.safetyResources.medicalFacilities.onSiteClinic =
      body.hasOnSiteClinic === "true" || body.hasOnSiteClinic === true;
    worksite.safetyResources.medicalFacilities.nearestHospital =
      body.nearestHospital || "";
    worksite.safetyResources.medicalFacilities.emergencyContact =
      body.emergencyContact || "";

    await worksite.save();

    req.flash("success", "Worksite updated successfully");
    res.redirect(`/worksites/${worksite._id}`);
  } catch (error) {
    console.error("Error updating worksite:", error);
    req.flash("error", `Error updating worksite: ${error.message}`);
    res.redirect(`/worksites/${req.params.id}/edit`);
  }
};

// Share worksite with another officer (for solo users)
exports.shareWorksite = async (req, res) => {
  try {
    const { worksiteId } = req.params;
    const { officerEmail, role } = req.body;

    const worksite = await Worksite.findById(worksiteId);

    // Verify solo ownership
    if (
      worksite.ownership.owner.toString() !== req.user.safetyOfficer.toString()
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const officer = await SafetyOfficer.findOne({ email: officerEmail });
    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    // Check if already shared
    const alreadyShared = worksite.teamMembers?.some(
      (m) => m.officer.toString() === officer._id.toString(),
    );

    if (alreadyShared) {
      return res.status(400).json({ error: "Officer already has access" });
    }

    worksite.teamMembers.push({
      officer: officer._id,
      role: role || "viewer",
      addedBy: req.user.safetyOfficer,
      addedAt: new Date(),
    });

    await worksite.save();

    // Add to officer's worksites
    officer.worksites.push(worksite._id);
    await officer.save();

    req.flash("success", `Worksite shared with ${officer.name}`);
    res.redirect(`/worksites/${worksiteId}`);
  } catch (error) {
    console.error("Error sharing worksite:", error);
    req.flash("error", "Error sharing worksite");
    res.redirect(`/worksites/${req.params.worksiteId}`);
  }
};
