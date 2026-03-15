// const WorkArea = require("../models/WorkArea");
// const Worksite = require("../models/Worksite");
// const SafetyOfficer = require("../models/SafetyOfficer");
// const Incident = require("../models/Incident");
// const RiskAssessment = require("../models/RiskAssessment");
// const SafetyTalk = require("../models/SafetyTalk");

// // Show create work area form
// exports.showCreateWorkAreaForm = async (req, res) => {
//   try {
//     const { worksiteId } = req.query;

//     let worksites = [];
//     if (worksiteId) {
//       const worksite = await Worksite.findById(worksiteId);
//       if (worksite) worksites = [worksite];
//     } else {
//       // Get worksites user has access to
//       worksites = await Worksite.find({
//         $or: [
//           { "assignedSafetyOfficers.officer": req.user.safetyOfficer },
//           { "ownership.owner": req.user.safetyOfficer },
//         ],
//       });
//     }

//     res.render("work-areas/create", {
//       user: req.user,
//       worksites,
//       preselectedWorksite: worksiteId,
//     });
//   } catch (error) {
//     console.error("Error loading create form:", error);
//     req.flash("error", "Error loading form");
//     res.redirect("/dashboard");
//   }
// };

// // Create new work area
// exports.createWorkArea = async (req, res) => {
//   try {
//     const {
//       worksiteId,
//       name,
//       code,
//       location,
//       description,
//       status,
//       plannedStart,
//       plannedEnd,
//       currentWorkTypes,
//       shifts,
//     } = req.body;

//     // Verify user has access to worksite
//     const worksite = await Worksite.findById(worksiteId);
//     if (!worksite) {
//       req.flash("error", "Worksite not found");
//       return res.redirect("/work-areas/create");
//     }

//     const hasAccess = await checkWorksiteAccess(req.user, worksite);
//     if (!hasAccess) {
//       req.flash("error", "You don't have access to this worksite");
//       return res.redirect("/work-areas/create");
//     }

//     // Parse work types
//     let workTypesArray = [];
//     if (currentWorkTypes) {
//       try {
//         workTypesArray =
//           typeof currentWorkTypes === "string"
//             ? JSON.parse(currentWorkTypes)
//             : currentWorkTypes;
//       } catch (e) {
//         workTypesArray = [];
//       }
//     }

//     // Parse shifts
//     let shiftsArray = [];
//     if (shifts) {
//       try {
//         shiftsArray = typeof shifts === "string" ? JSON.parse(shifts) : shifts;
//       } catch (e) {
//         shiftsArray = [];
//       }
//     }

//     const newWorkArea = new WorkArea({
//       worksite: worksiteId,
//       name,
//       code: code || `${worksite.name}-${Date.now()}`,
//       location,
//       description,
//       status: status || "planned",
//       plannedStart,
//       plannedEnd,
//       currentWorkTypes: workTypesArray.map((wt) => ({
//         ...wt,
//         startDate: wt.startDate || new Date(),
//         isActive: true,
//       })),
//       activeShifts: shiftsArray,
//       assignedSafetyOfficers: [
//         {
//           officer: req.user.safetyOfficer,
//           shift: "all",
//           isPrimary: true,
//           assignedFrom: new Date(),
//           isActive: true,
//         },
//       ],
//       statistics: {
//         incidents: 0,
//         nearMisses: 0,
//         safetyScore: 100,
//         daysWithoutIncident: 0,
//       },
//     });

//     await newWorkArea.save();

//     // Add to worksite's work areas
//     worksite.workAreas.push(newWorkArea._id);
//     await worksite.save();

//     req.flash("success", `Work area "${name}" created successfully`);
//     res.redirect(`/work-areas/${newWorkArea._id}`);
//   } catch (error) {
//     console.error("Error creating work area:", error);
//     req.flash("error", "Error creating work area");
//     res.redirect("/work-areas/create");
//   }
// };

// // View single work area
// exports.getWorkArea = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id)
//       .populate("worksite", "name location")
//       .populate("assignedSafetyOfficers.officer", "name email")
//       .populate("activePermits");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     // Get recent incidents
//     const recentIncidents = await Incident.find({ workArea: workArea._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     // Get active risk assessments
//     const activeAssessments = await RiskAssessment.find({
//       workArea: workArea._id,
//       status: "active",
//     }).limit(5);

//     res.render("work-areas/view", {
//       user: req.user,
//       workArea,
//       recentIncidents,
//       activeAssessments,
//     });
//   } catch (error) {
//     console.error("Error viewing work area:", error);
//     req.flash("error", "Error loading work area");
//     res.redirect("/dashboard");
//   }
// };

// // Show edit work area form
// exports.showEditWorkAreaForm = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id).populate(
//       "worksite",
//     );

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     res.render("work-areas/edit", {
//       user: req.user,
//       workArea,
//     });
//   } catch (error) {
//     console.error("Error loading edit form:", error);
//     req.flash("error", "Error loading form");
//     res.redirect("/dashboard");
//   }
// };

// // Update work area
// exports.updateWorkArea = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id);

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     const {
//       name,
//       location,
//       description,
//       status,
//       currentWorkTypes,
//       identifiedHazards,
//     } = req.body;

//     workArea.name = name || workArea.name;
//     workArea.location = location || workArea.location;
//     workArea.description = description || workArea.description;
//     workArea.status = status || workArea.status;

//     if (currentWorkTypes) {
//       try {
//         workArea.currentWorkTypes =
//           typeof currentWorkTypes === "string"
//             ? JSON.parse(currentWorkTypes)
//             : currentWorkTypes;
//       } catch (e) {}
//     }

//     if (identifiedHazards) {
//       try {
//         workArea.identifiedHazards =
//           typeof identifiedHazards === "string"
//             ? JSON.parse(identifiedHazards)
//             : identifiedHazards;
//       } catch (e) {}
//     }

//     await workArea.save();

//     req.flash("success", "Work area updated successfully");
//     res.redirect(`/work-areas/${workArea._id}`);
//   } catch (error) {
//     console.error("Error updating work area:", error);
//     req.flash("error", "Error updating work area");
//     res.redirect(`/work-areas/${req.params.id}/edit`);
//   }
// };

// // Get incidents for a work area
// exports.getAreaIncidents = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id);
//     if (!workArea) {
//       return res.status(404).json({ error: "Work area not found" });
//     }

//     const incidents = await Incident.find({ workArea: workArea._id }).sort({
//       createdAt: -1,
//     });

//     res.json(incidents);
//   } catch (error) {
//     console.error("Error getting area incidents:", error);
//     res.status(500).json({ error: "Error loading incidents" });
//   }
// };

// // Get risk assessments for a work area
// exports.getAreaRiskAssessments = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id);
//     if (!workArea) {
//       return res.status(404).json({ error: "Work area not found" });
//     }

//     const assessments = await RiskAssessment.find({
//       workArea: workArea._id,
//     }).sort({ createdAt: -1 });

//     res.json(assessments);
//   } catch (error) {
//     console.error("Error getting risk assessments:", error);
//     res.status(500).json({ error: "Error loading assessments" });
//   }
// };

// // Get safety talks for a work area
// exports.getAreaSafetyTalks = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id);
//     if (!workArea) {
//       return res.status(404).json({ error: "Work area not found" });
//     }

//     const talks = await SafetyTalk.find({
//       targetWorkAreas: workArea._id,
//     }).sort({ date: -1 });

//     res.json(talks);
//   } catch (error) {
//     console.error("Error getting safety talks:", error);
//     res.status(500).json({ error: "Error loading safety talks" });
//   }
// };

const WorkArea = require("../models/WorkArea");
const Worksite = require("../models/Worksite");
const SafetyOfficer = require("../models/SafetyOfficer");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyTalk = require("../models/SafetyTalk");

// const WorkArea = require("../models/WorkArea");
// const Worksite = require("../models/Worksite");
// const SafetyOfficer = require("../models/SafetyOfficer");
// const Incident = require("../models/Incident");
// const RiskAssessment = require("../models/RiskAssessment");
// const SafetyTalk = require("../models/SafetyTalk");
const Permit = require("../models/Permit");
const JSA = require("../models/JSA"); // Add this
const PPEChecklist = require("../models/PPEChecklist"); // Add this

// Helper function to check if user has access to worksite
async function checkWorksiteAccess(user, worksite) {
  if (user.role === "system_admin") return true;
  if (user.safetyOfficer) {
    // Check if assigned as safety officer or owner
    return (
      worksite.assignedSafetyOfficers?.some(
        (a) => a.officer.toString() === user.safetyOfficer.toString(),
      ) ||
      worksite.ownership?.owner?.toString() === user.safetyOfficer.toString()
    );
  }
  return false;
}

// Show create work area form
exports.showCreateWorkAreaForm = async (req, res) => {
  try {
    const { worksiteId } = req.query;

    let worksites = [];
    if (worksiteId) {
      const worksite = await Worksite.findById(worksiteId);
      if (worksite) worksites = [worksite];
    } else {
      // Get worksites user has access to
      worksites = await Worksite.find({
        $or: [
          { "assignedSafetyOfficers.officer": req.user.safetyOfficer },
          { "ownership.owner": req.user.safetyOfficer },
        ],
      });
    }

    res.render("work-areas/create", {
      user: req.user,
      worksites,
      preselectedWorksite: worksiteId,
    });
  } catch (error) {
    console.error("Error loading create form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

// Create new work area
// exports.createWorkArea = async (req, res) => {
//   try {
//     const {
//       worksiteId,
//       name,
//       code,
//       location,
//       description,
//       status,
//       plannedStart,
//       plannedEnd,
//       currentWorkTypes,
//       shifts,
//     } = req.body;

//     // Verify user has access to worksite
//     const worksite = await Worksite.findById(worksiteId);
//     if (!worksite) {
//       req.flash("error", "Worksite not found");
//       return res.redirect("/work-areas/create");
//     }

//     const hasAccess = await checkWorksiteAccess(req.user, worksite);
//     if (!hasAccess) {
//       req.flash("error", "You don't have access to this worksite");
//       return res.redirect("/work-areas/create");
//     }

//     // Parse work types
//     let workTypesArray = [];
//     if (currentWorkTypes) {
//       try {
//         workTypesArray =
//           typeof currentWorkTypes === "string"
//             ? JSON.parse(currentWorkTypes)
//             : currentWorkTypes;
//       } catch (e) {
//         workTypesArray = [];
//       }
//     }

//     // Parse shifts
//     let shiftsArray = [];
//     if (shifts) {
//       try {
//         shiftsArray = typeof shifts === "string" ? JSON.parse(shifts) : shifts;
//       } catch (e) {
//         shiftsArray = [];
//       }
//     }

//     const newWorkArea = new WorkArea({
//       worksite: worksiteId,
//       name,
//       code: code || `${worksite.name}-${Date.now()}`,
//       location,
//       description,
//       status: status || "planned",
//       plannedStart,
//       plannedEnd,
//       currentWorkTypes: workTypesArray.map((wt) => ({
//         ...wt,
//         startDate: wt.startDate || new Date(),
//         isActive: true,
//       })),
//       activeShifts: shiftsArray,
//       assignedSafetyOfficers: [
//         {
//           officer: req.user.safetyOfficer,
//           shift: "all",
//           isPrimary: true,
//           assignedFrom: new Date(),
//           isActive: true,
//         },
//       ],
//       statistics: {
//         incidents: 0,
//         nearMisses: 0,
//         safetyScore: 100,
//         daysWithoutIncident: 0,
//       },
//     });

//     await newWorkArea.save();

//     // Add to worksite's work areas
//     worksite.workAreas.push(newWorkArea._id);
//     await worksite.save();

//     req.flash("success", `Work area "${name}" created successfully`);
//     res.redirect(`/work-areas/${newWorkArea._id}`);
//   } catch (error) {
//     console.error("Error creating work area:", error);
//     req.flash("error", "Error creating work area");
//     res.redirect("/work-areas/create");
//   }
// };

// Create new work area
exports.createWorkArea = async (req, res) => {
  try {
    const {
      worksiteId,
      name,
      code,
      location,
      description,
      status,
      plannedStart,
      plannedEnd,
      currentWorkTypes,
      shifts,
      initialContextDesc,
      initialConcerns,
      initialRiskLevel,
      requiredPPEItems,
    } = req.body;

    // Verify user has access to worksite
    const worksite = await Worksite.findById(worksiteId);
    if (!worksite) {
      req.flash("error", "Worksite not found");
      return res.redirect("/work-areas/create");
    }

    const hasAccess = await checkWorksiteAccess(req.user, worksite);
    if (!hasAccess) {
      req.flash("error", "You don't have access to this worksite");
      return res.redirect("/work-areas/create");
    }

    // Parse work types
    let workTypesArray = [];
    if (currentWorkTypes) {
      try {
        workTypesArray = Array.isArray(currentWorkTypes)
          ? currentWorkTypes
          : [currentWorkTypes];
      } catch (e) {
        workTypesArray = [];
      }
    }

    // Parse shifts - FIXED: Convert to proper objects for activeShifts
    let activeShiftsArray = [];
    if (shifts) {
      try {
        const shiftValues = Array.isArray(shifts) ? shifts : [shifts];
        activeShiftsArray = shiftValues.map((shift) => ({
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
      } catch (e) {
        activeShiftsArray = [];
      }
    }

    // Parse initial concerns
    let concernsArray = [];
    if (initialConcerns) {
      concernsArray = initialConcerns
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => ({
          concern: line.trim(),
          category: "site_conditions",
          severity: initialRiskLevel || "medium",
        }));
    }

    // Parse required PPE items
    let ppeArray = [];
    if (requiredPPEItems) {
      ppeArray = requiredPPEItems
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((item) => ({
          item: "other",
          customItem: item.trim(),
          quantity: 0,
          condition: "good",
        }));
    }

    // Build initial context
    const initialContext = {
      description: initialContextDesc || "",
      submittedBy: req.user.safetyOfficer || null,
      submittedAt: new Date(),
      initialConcerns: concernsArray,
      requiredPPE: ppeArray,
      initialRiskLevel: initialRiskLevel || "medium",
    };

    const newWorkArea = new WorkArea({
      worksite: worksiteId,
      name,
      code: code || `${worksite.name}-${Date.now()}`,
      location: location ? { zone: location } : {},
      description,
      status: status || "planned",
      plannedStart,
      plannedEnd,
      currentWorkTypes: workTypesArray.map((wt) => ({
        workType: wt,
        startDate: new Date(),
        isActive: true,
      })),
      // FIXED: activeShifts now uses objects, not strings
      activeShifts: activeShiftsArray,
      // FIXED: Only add assignedSafetyOfficers if user has a safety officer
      ...(req.user.safetyOfficer && {
        assignedSafetyOfficers: [
          {
            officer: req.user.safetyOfficer,
            shift: "morning", // Use a valid enum value
            isPrimary: true,
            assignedFrom: new Date(),
            isActive: true,
          },
        ],
      }),
      initialContext,
      statistics: {
        incidents: 0,
        nearMisses: 0,
        safetyObservations: 0,
        openConcerns: concernsArray.length,
        resolvedConcerns: 0,
        safetyScore: 100,
        daysWithoutIncident: 0,
        ppeComplianceScore: 100,
      },
    });

    // Add initial concerns to concerns register
    if (concernsArray.length > 0) {
      concernsArray.forEach((concern) => {
        newWorkArea.concernsRegister.push({
          concern: concern.concern,
          source: "initial",
          category: "hazard",
          riskAssessment: {
            severity: concern.severity,
            likelihood: "possible",
            riskLevel: concern.severity,
          },
          mitigation: [],
          status: "active",
          identifiedBy: req.user.safetyOfficer || null,
          identifiedAt: new Date(),
        });
      });
    }

    await newWorkArea.save();

    // Add to worksite's work areas
    worksite.workAreas.push(newWorkArea._id);
    await worksite.save();

    req.flash("success", `Work area "${name}" created successfully`);
    res.redirect(`/work-areas/${newWorkArea._id}`);
  } catch (error) {
    console.error("Error creating work area:", error);
    req.flash("error", "Error creating work area");
    res.redirect("/work-areas/create");
  }
};

// Rest of your controller remains the same...
// View single work area
// exports.getWorkArea = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id)
//       .populate("worksite", "name location")
//       .populate("assignedSafetyOfficers.officer", "name email")
//       .populate("activePermits");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     // Get recent incidents
//     const recentIncidents = await Incident.find({ workArea: workArea._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     // Get active risk assessments
//     const activeAssessments = await RiskAssessment.find({
//       workArea: workArea._id,
//       status: "active",
//     }).limit(5);

//     res.render("work-areas/view", {
//       user: req.user,
//       workArea,
//       recentIncidents,
//       activeAssessments,
//     });
//   } catch (error) {
//     console.error("Error viewing work area:", error);
//     req.flash("error", "Error loading work area");
//     res.redirect("/dashboard");
//   }
// };

exports.getWorkArea = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.id)
      .populate("worksite", "name location")
      .populate("assignedSafetyOfficers.officer", "name email")
      .populate("activePermits");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    // Get recent incidents
    const recentIncidents = await Incident.find({ workArea: workArea._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get active risk assessments
    const activeAssessments = await RiskAssessment.find({
      workArea: workArea._id,
      status: "active",
    }).limit(5);

    // ADD THESE VARIABLES FOR THE TABS
    // Get all risk assessments (for the Risk Assessments tab)
    const riskAssessments = await RiskAssessment.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get safety talks
    const safetyTalks = await SafetyTalk.find({
      targetWorkAreas: workArea._id,
    })
      .sort({ date: -1 })
      .limit(10);

    // Get permits
    const permits = await Permit.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get JSA (Job Safety Analysis)
    const JSA = require("../models/JSA");
    const jsa = await JSA.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get PPE Checklists
    const PPEChecklist = require("../models/PPEChecklist");
    const ppeChecklists = await PPEChecklist.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.render("work-areas/view", {
      user: req.user,
      workArea,
      recentIncidents,
      activeAssessments,
      // New variables for tabs
      riskAssessments,
      safetyTalks,
      permits,
      jsa,
      ppeChecklists,
    });
  } catch (error) {
    console.error("Error viewing work area:", error);
    req.flash("error", "Error loading work area");
    res.redirect("/dashboard");
  }
};

// Show edit work area form
exports.showEditWorkAreaForm = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.id).populate(
      "worksite",
    );

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    res.render("work-areas/edit", {
      user: req.user,
      workArea,
    });
  } catch (error) {
    console.error("Error loading edit form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

// Update work area
// exports.updateWorkArea = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id);

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     const {
//       name,
//       location,
//       description,
//       status,
//       currentWorkTypes,
//       identifiedHazards,
//     } = req.body;

//     workArea.name = name || workArea.name;
//     workArea.location = location || workArea.location;
//     workArea.description = description || workArea.description;
//     workArea.status = status || workArea.status;

//     if (currentWorkTypes) {
//       try {
//         workArea.currentWorkTypes =
//           typeof currentWorkTypes === "string"
//             ? JSON.parse(currentWorkTypes)
//             : currentWorkTypes;
//       } catch (e) {}
//     }

//     if (identifiedHazards) {
//       try {
//         workArea.identifiedHazards =
//           typeof identifiedHazards === "string"
//             ? JSON.parse(identifiedHazards)
//             : identifiedHazards;
//       } catch (e) {}
//     }

//     await workArea.save();

//     req.flash("success", "Work area updated successfully");
//     res.redirect(`/work-areas/${workArea._id}`);
//   } catch (error) {
//     console.error("Error updating work area:", error);
//     req.flash("error", "Error updating work area");
//     res.redirect(`/work-areas/${req.params.id}/edit`);
//   }
// };

// Update work area
exports.updateWorkArea = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.id);

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    const {
      name,
      location,
      description,
      status,
      currentWorkTypes,
      shifts,
      hazardDescriptions,
      hazardRiskLevels,
      hazardControls,
      hazardNotes,
    } = req.body;

    // Update basic fields
    workArea.name = name || workArea.name;

    // Handle location (could be string or object)
    if (location) {
      if (typeof workArea.location === "object") {
        workArea.location.zone = location;
      } else {
        workArea.location = { zone: location };
      }
    }

    workArea.description = description || workArea.description;
    workArea.status = status || workArea.status;

    // Update work types
    if (currentWorkTypes) {
      const workTypeValues = Array.isArray(currentWorkTypes)
        ? currentWorkTypes
        : [currentWorkTypes];

      workArea.currentWorkTypes = workTypeValues.map((wt) => ({
        workType: wt,
        startDate:
          workArea.currentWorkTypes?.find(
            (existing) => existing.workType === wt,
          )?.startDate || new Date(),
        isActive: true,
      }));
    } else {
      workArea.currentWorkTypes = [];
    }

    // Update shifts
    if (shifts) {
      const shiftValues = Array.isArray(shifts) ? shifts : [shifts];
      workArea.activeShifts = shiftValues.map((shift) => ({
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
    } else {
      workArea.activeShifts = [];
    }

    // Update hazards from user-friendly form
    if (hazardDescriptions && hazardDescriptions.length > 0) {
      const newHazards = [];

      // Filter out empty hazard descriptions
      for (let i = 0; i < hazardDescriptions.length; i++) {
        if (hazardDescriptions[i] && hazardDescriptions[i].trim() !== "") {
          newHazards.push({
            hazardId: new mongoose.Types.ObjectId(),
            hazard: hazardDescriptions[i].trim(),
            riskLevel:
              hazardRiskLevels && hazardRiskLevels[i]
                ? hazardRiskLevels[i]
                : "medium",
            controls:
              hazardControls && hazardControls[i]
                ? hazardControls[i].trim()
                : "",
            notes: hazardNotes && hazardNotes[i] ? hazardNotes[i].trim() : "",
            identifiedDate: new Date(),
            status: "active",
          });
        }
      }

      workArea.identifiedHazards = newHazards;
    } else {
      workArea.identifiedHazards = [];
    }

    await workArea.save();

    req.flash("success", "Work area updated successfully");
    res.redirect(`/work-areas/${workArea._id}`);
  } catch (error) {
    console.error("Error updating work area:", error);
    req.flash("error", "Error updating work area");
    res.redirect(`/work-areas/${req.params.id}/edit`);
  }
};

// Get incidents for a work area
exports.getAreaIncidents = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.id);
    if (!workArea) {
      return res.status(404).json({ error: "Work area not found" });
    }

    const incidents = await Incident.find({ workArea: workArea._id }).sort({
      createdAt: -1,
    });

    res.json(incidents);
  } catch (error) {
    console.error("Error getting area incidents:", error);
    res.status(500).json({ error: "Error loading incidents" });
  }
};

// Get risk assessments for a work area
exports.getAreaRiskAssessments = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.id);
    if (!workArea) {
      return res.status(404).json({ error: "Work area not found" });
    }

    const assessments = await RiskAssessment.find({
      workArea: workArea._id,
    }).sort({ createdAt: -1 });

    res.json(assessments);
  } catch (error) {
    console.error("Error getting risk assessments:", error);
    res.status(500).json({ error: "Error loading assessments" });
  }
};

// Get safety talks for a work area
exports.getAreaSafetyTalks = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.id);
    if (!workArea) {
      return res.status(404).json({ error: "Work area not found" });
    }

    const talks = await SafetyTalk.find({
      targetWorkAreas: workArea._id,
    }).sort({ date: -1 });

    res.json(talks);
  } catch (error) {
    console.error("Error getting safety talks:", error);
    res.status(500).json({ error: "Error loading safety talks" });
  }
};

// Assign safety officer to work area
exports.assignOfficerToWorkArea = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const { officerId, shift, isPrimary } = req.body;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      return res.status(404).json({
        success: false,
        message: "Work area not found",
      });
    }

    // Check if officer exists
    const officer = await SafetyOfficer.findById(officerId);
    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Safety officer not found",
      });
    }

    // Check if already assigned to this shift and active
    const alreadyAssigned = workArea.assignedSafetyOfficers.some(
      (a) =>
        a.officer.toString() === officerId &&
        a.shift === shift &&
        a.isActive === true,
    );

    if (alreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: "Officer already assigned to this shift",
      });
    }

    // If setting as primary, unset other primaries for this shift
    if (isPrimary) {
      workArea.assignedSafetyOfficers.forEach((a) => {
        if (a.shift === shift) {
          a.isPrimary = false;
        }
      });
    }

    // Add new assignment
    workArea.assignedSafetyOfficers.push({
      officer: officerId,
      shift,
      isPrimary: isPrimary || false,
      assignedFrom: new Date(),
      isActive: true,
    });

    await workArea.save();

    // Also add work area to officer's worksites? (optional - depends on your logic)
    // await SafetyOfficer.findByIdAndUpdate(officerId, {
    //   $addToSet: { workAreas: workAreaId }
    // });

    res.json({
      success: true,
      message: "Officer assigned to work area successfully",
      data: workArea.assignedSafetyOfficers,
    });
  } catch (error) {
    console.error("Error assigning officer to work area:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning officer",
    });
  }
};

// Remove safety officer from work area
exports.removeOfficerFromWorkArea = async (req, res) => {
  try {
    const { workAreaId, assignmentId } = req.params;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      return res.status(404).json({
        success: false,
        message: "Work area not found",
      });
    }

    // Find the assignment by its _id
    const assignment = workArea.assignedSafetyOfficers.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Option 1: Hard delete - remove completely
    assignment.remove();

    // Option 2: Soft delete - set isActive to false
    // assignment.isActive = false;
    // assignment.assignedTo = new Date();

    await workArea.save();

    res.json({
      success: true,
      message: "Officer removed from work area successfully",
    });
  } catch (error) {
    console.error("Error removing officer from work area:", error);
    res.status(500).json({
      success: false,
      message: "Error removing officer",
    });
  }
};

// Get all available officers for a work area (for dropdowns)
exports.getAvailableOfficersForWorkArea = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      return res.status(404).json({
        success: false,
        message: "Work area not found",
      });
    }

    // Get all verified safety officers
    const allOfficers = await SafetyOfficer.find({
      verificationStatus: "verified",
    }).select("name email officerNumber");

    // Get currently assigned officer IDs
    const assignedOfficerIds = workArea.assignedSafetyOfficers
      .filter((a) => a.isActive !== false)
      .map((a) => a.officer.toString());

    // Filter out already assigned officers
    const availableOfficers = allOfficers.filter(
      (officer) => !assignedOfficerIds.includes(officer._id.toString()),
    );

    res.json({
      success: true,
      data: {
        availableOfficers,
        assignedOfficers: workArea.assignedSafetyOfficers.filter(
          (a) => a.isActive !== false,
        ),
      },
    });
  } catch (error) {
    console.error("Error getting available officers:", error);
    res.status(500).json({
      success: false,
      message: "Error loading officers",
    });
  }
};

// Update officer assignment (change role, shift, primary status)
exports.updateOfficerAssignment = async (req, res) => {
  try {
    const { workAreaId, assignmentId } = req.params;
    const { shift, isPrimary, isActive } = req.body;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      return res.status(404).json({
        success: false,
        message: "Work area not found",
      });
    }

    const assignment = workArea.assignedSafetyOfficers.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Update fields
    if (shift) assignment.shift = shift;
    if (isActive !== undefined) assignment.isActive = isActive;

    // If setting as primary, unset other primaries for this shift
    if (isPrimary) {
      workArea.assignedSafetyOfficers.forEach((a) => {
        if (a.shift === (shift || assignment.shift)) {
          a.isPrimary = false;
        }
      });
      assignment.isPrimary = true;
    }

    await workArea.save();

    res.json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Error updating officer assignment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating assignment",
    });
  }
};

// Show manage officers page
exports.showManageOfficersPage = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.workAreaId)
      .populate("assignedSafetyOfficers.officer", "name email officerNumber")
      .populate("worksite", "name");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    // Get all verified safety officers
    const availableOfficers = await SafetyOfficer.find({
      verificationStatus: "verified",
    }).select("name email officerNumber");

    res.render("work-areas/manage-officers", {
      user: req.user,
      workArea,
      availableOfficers,
    });
  } catch (error) {
    console.error("Error loading manage officers page:", error);
    req.flash("error", "Error loading page");
    res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};
