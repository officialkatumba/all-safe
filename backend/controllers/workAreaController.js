const WorkArea = require("../models/WorkArea");
const Worksite = require("../models/Worksite");
const SafetyOfficer = require("../models/SafetyOfficer");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyTalk = require("../models/SafetyTalk");
const SafetyObservation = require("../models/SafetyObservation");
const Permit = require("../models/Permit");
const JSA = require("../models/JSA");
const PPEChecklist = require("../models/PPEChecklist");
const User = require("../models/User");
const mongoose = require("mongoose");
const TrainingRequirement = require("../models/TrainingRequirement");
const SafetyInsight = require("../models/SafetyInsight");
const EmergencyProtocol = require("../models/EmergencyProtocol");
const SafetyAuditScorecard = require("../models/SafetyAuditScorecard");
const OHSComplianceAudit = require("../models/OHSComplianceAudit");
const EnvironmentalAssessment = require("../models/EnvironmentalAssessment");

// Helper function to check if user has access to worksite
async function checkWorksiteAccess(user, worksite) {
  if (user.role === "enterprise_admin" || user.role === "system_admin") return true;
  if (user.safetyOfficer) {
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
      ppeItems,
      customPPE,
      hazardDescriptions,
      hazardRiskLevels,
      hazardControls,
      specialConsiderations,
    } = req.body;

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
      workTypesArray = Array.isArray(currentWorkTypes)
        ? currentWorkTypes
        : [currentWorkTypes];
    }

    // Parse shifts
    let activeShiftsArray = [];
    if (shifts) {
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
          notes: "",
        }));
    }

    // Parse PPE items
    let ppeItemsArray = [];
    const validPPEItems = [
      "hard_hat",
      "safety_glasses",
      "ear_plugs",
      "ear_muffs",
      "high_vis_vest",
      "steel_toe_boots",
      "gloves",
      "respirator",
      "harness",
      "face_shield",
      "welding_helmet",
      "chemical_suit",
      "knee_pads",
      "fall_arrest",
      "other",
    ];

    const ppeMapping = {
      hard_hat: "hard_hat",
      safety_glasses: "safety_glasses",
      ear_plugs: "ear_plugs",
      ear_muffs: "ear_muffs",
      ear_protection: "ear_muffs",
      high_vis_vest: "high_vis_vest",
      "high-visibility vest": "high_vis_vest",
      steel_toe_boots: "steel_toe_boots",
      "steel-toed boots": "steel_toe_boots",
      gloves: "gloves",
      respirator: "respirator",
      harness: "harness",
      "fall protection harness": "harness",
      face_shield: "face_shield",
      welding_helmet: "welding_helmet",
      chemical_suit: "chemical_suit",
      knee_pads: "knee_pads",
      fall_arrest: "fall_arrest",
    };

    if (ppeItems) {
      const selectedItems = Array.isArray(ppeItems) ? ppeItems : [ppeItems];
      selectedItems.forEach((item) => {
        const mappedItem = ppeMapping[item] || item;
        if (validPPEItems.includes(mappedItem)) {
          ppeItemsArray.push({
            item: mappedItem,
            customItem: null,
            quantity: 0,
            condition: "good",
          });
        } else {
          ppeItemsArray.push({
            item: "other",
            customItem: item,
            quantity: 0,
            condition: "good",
          });
        }
      });
    }

    if (customPPE) {
      const customLines = customPPE.split("\n");
      customLines.forEach((line) => {
        if (line.trim()) {
          ppeItemsArray.push({
            item: "other",
            customItem: line.trim(),
            quantity: 0,
            condition: "good",
          });
        }
      });
    }

    // Parse hazards
    let hazardsArray = [];
    if (hazardDescriptions && hazardDescriptions.length > 0) {
      const hazardCount = Array.isArray(hazardDescriptions)
        ? hazardDescriptions.length
        : 1;
      const riskLevels = hazardRiskLevels
        ? Array.isArray(hazardRiskLevels)
          ? hazardRiskLevels
          : [hazardRiskLevels]
        : [];
      const controls = hazardControls
        ? Array.isArray(hazardControls)
          ? hazardControls
          : [hazardControls]
        : [];

      for (let i = 0; i < hazardCount; i++) {
        const hazardDesc = hazardDescriptions[i];
        if (hazardDesc && hazardDesc.trim()) {
          hazardsArray.push({
            hazard: hazardDesc.trim(),
            riskLevel: riskLevels[i] || "medium",
            controls: controls[i] || "",
            identifiedDate: new Date(),
            status: "active",
          });
        }
      }
    }

    // Build initial context
    const initialContext = {
      description: initialContextDesc || "",
      submittedBy: req.user.safetyOfficer || null,
      submittedAt: new Date(),
      initialConcerns: concernsArray,
      requiredPPE: ppeItemsArray,
      initialRiskLevel: initialRiskLevel || "medium",
    };

    if (specialConsiderations) {
      initialContext.specialConsiderations = specialConsiderations;
    }

    const newWorkArea = new WorkArea({
      worksite: worksiteId,
      name,
      code: code || `${worksite.name}-${Date.now()}`,
      location: location ? { zone: location } : {},
      description: description || "",
      status: status || "planned",
      plannedStart: plannedStart ? new Date(plannedStart) : null,
      plannedEnd: plannedEnd ? new Date(plannedEnd) : null,
      currentWorkTypes: workTypesArray.map((wt) => ({
        workType: wt,
        startDate: new Date(),
        isActive: true,
      })),
      activeShifts: activeShiftsArray,
      ...(req.user.safetyOfficer && {
        assignedSafetyOfficers: [
          {
            officer: req.user.safetyOfficer,
            shift: "morning",
            isPrimary: true,
            assignedFrom: new Date(),
            isActive: true,
          },
        ],
      }),
      initialContext,
      identifiedHazards: hazardsArray,
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
    worksite.workAreas.push(newWorkArea._id);
    await worksite.save();

    req.flash("success", `Work area "${name}" created successfully!`);
    res.redirect(`/work-areas/${newWorkArea._id}`);
  } catch (error) {
    console.error("Error creating work area:", error);
    req.flash("error", `Error creating work area: ${error.message}`);
    res.redirect("/work-areas/create");
  }
};

// View single work area
// exports.getWorkArea = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id)
//       .populate("worksite", "name location")
//       .populate("assignedSafetyOfficers.officer", "name email")
//       .populate("assignedWorkers.worker", "name email")
//       .populate("activePermits");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     const recentIncidents = await Incident.find({ workArea: workArea._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const activeAssessments = await RiskAssessment.find({
//       workArea: workArea._id,
//       status: "active",
//     }).limit(5);

//     const riskAssessments = await RiskAssessment.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const safetyTalks = await SafetyTalk.find({
//       targetWorkAreas: workArea._id,
//     })
//       .sort({ date: -1 })
//       .limit(10);

//     const todaySafetyTalk = await SafetyTalk.findOne({
//       targetWorkAreas: workArea._id,
//       status: { $in: ["published", "conducted"] },
//     })
//       .sort({ date: -1, createdAt: -1 })
//       .limit(1);

//     const permits = await Permit.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const jsa = await JSA.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const ppeChecklists = await PPEChecklist.find({
//       worksite: workArea.worksite._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const safetyObservations = await SafetyObservation.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     res.render("work-areas/view", {
//       user: req.user,
//       workArea,
//       recentIncidents,
//       activeAssessments,
//       riskAssessments,
//       safetyTalks,
//       todaySafetyTalk,
//       permits,
//       jsa,
//       ppeChecklists,
//       safetyObservations,
//     });
//   } catch (error) {
//     console.error("Error viewing work area:", error);
//     req.flash("error", "Error loading work area");
//     res.redirect("/dashboard");
//   }
// };

// exports.getWorkArea = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id)
//       .populate("worksite", "name location")
//       .populate("assignedSafetyOfficers.officer", "name email")
//       .populate("assignedWorkers.worker", "name email")
//       .populate("activePermits");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     const recentIncidents = await Incident.find({ workArea: workArea._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const activeAssessments = await RiskAssessment.find({
//       workArea: workArea._id,
//       status: "active",
//     }).limit(5);

//     const riskAssessments = await RiskAssessment.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const safetyTalks = await SafetyTalk.find({
//       targetWorkAreas: workArea._id,
//     })
//       .sort({ date: -1 })
//       .limit(10);

//     const todaySafetyTalk = await SafetyTalk.findOne({
//       targetWorkAreas: workArea._id,
//       status: { $in: ["published", "conducted"] },
//     })
//       .sort({ date: -1, createdAt: -1 })
//       .limit(1);

//     const permits = await Permit.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const jsa = await JSA.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const ppeChecklists = await PPEChecklist.find({
//       worksite: workArea.worksite._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const safetyObservations = await SafetyObservation.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // ========== ADD TRAINING REQUIREMENTS ==========
//     const TrainingRequirement = require("../models/TrainingRequirement");
//     const trainingRequirements = await TrainingRequirement.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);
//     // ===============================================

//     res.render("work-areas/view", {
//       user: req.user,
//       workArea,
//       recentIncidents,
//       activeAssessments,
//       riskAssessments,
//       safetyTalks,
//       todaySafetyTalk,
//       permits,
//       jsa,
//       ppeChecklists,
//       safetyObservations,
//       trainingRequirements, // ADD THIS LINE
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
      .populate("assignedWorkers.worker", "name email")
      .populate("activePermits");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    const safetyAudits = await SafetyAuditScorecard.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const recentIncidents = await Incident.find({ workArea: workArea._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const activeAssessments = await RiskAssessment.find({
      workArea: workArea._id,
      status: "active",
    }).limit(5);

    const riskAssessments = await RiskAssessment.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const safetyTalks = await SafetyTalk.find({
      targetWorkAreas: workArea._id,
    })
      .sort({ date: -1 })
      .limit(10);

    const todaySafetyTalk = await SafetyTalk.findOne({
      targetWorkAreas: workArea._id,
      status: { $in: ["published", "conducted"] },
    }).sort({ date: -1, createdAt: -1 });

    const permits = await Permit.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const jsa = await JSA.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const ppeChecklists = await PPEChecklist.find({
      worksite: workArea.worksite._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const safetyObservations = await SafetyObservation.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const TrainingRequirement = require("../models/TrainingRequirement");
    const trainingRequirements = await TrainingRequirement.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const ohsComplianceAudits = await OHSComplianceAudit.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // ==========  AI SAFETY INSIGHTS ==========
    const SafetyInsight = require("../models/SafetyInsight");

    const safetyInsights = await SafetyInsight.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // ==========  AI emergency protocols ==========

    const emergencyProtocols = await EmergencyProtocol.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const environmentalAssessments = await EnvironmentalAssessment.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // ===========================================

    res.render("work-areas/view", {
      user: req.user,
      workArea,
      recentIncidents,
      activeAssessments,
      riskAssessments,
      safetyTalks,
      todaySafetyTalk,
      permits,
      jsa,
      ppeChecklists,
      safetyObservations,
      trainingRequirements,
      safetyInsights,
      emergencyProtocols,
      environmentalAssessments,
      safetyAudits,
      ohsComplianceAudits,
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

    workArea.name = name || workArea.name;

    if (location) {
      if (typeof workArea.location === "object") {
        workArea.location.zone = location;
      } else {
        workArea.location = { zone: location };
      }
    }

    workArea.description = description || workArea.description;
    workArea.status = status || workArea.status;

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

    if (hazardDescriptions && hazardDescriptions.length > 0) {
      const newHazards = [];
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

// ========== OFFICER MANAGEMENT FUNCTIONS ==========

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

    const officer = await SafetyOfficer.findById(officerId);
    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Safety officer not found",
      });
    }

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

    if (isPrimary) {
      workArea.assignedSafetyOfficers.forEach((a) => {
        if (a.shift === shift) {
          a.isPrimary = false;
        }
      });
    }

    workArea.assignedSafetyOfficers.push({
      officer: officerId,
      shift,
      isPrimary: isPrimary || false,
      assignedFrom: new Date(),
      isActive: true,
    });

    await workArea.save();

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

    const assignment = workArea.assignedSafetyOfficers.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    assignment.remove();
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

// Get available officers for dropdown
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

    const allOfficers = await SafetyOfficer.find({
      verificationStatus: "verified",
    }).select("name email officerNumber");

    const assignedOfficerIds = workArea.assignedSafetyOfficers
      .filter((a) => a.isActive !== false)
      .map((a) => a.officer.toString());

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

// Update officer assignment
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

    if (shift) assignment.shift = shift;
    if (isActive !== undefined) assignment.isActive = isActive;

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

// ========== WORKER MANAGEMENT FUNCTIONS ==========

// Show manage workers page
exports.showManageWorkersPage = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.workAreaId)
      .populate("assignedWorkers.worker", "name email")
      .populate("worksite", "name");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    // Get all workers NOT assigned to any work area
    const availableWorkers = await User.find({
      role: "worker",
      isActive: true,
      workArea: { $eq: null },
    }).select("name email");

    res.render("work-areas/manage-workers", {
      user: req.user,
      workArea,
      availableWorkers,
    });
  } catch (error) {
    console.error("Error loading manage workers page:", error);
    req.flash("error", "Error loading page");
    res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// Assign worker to work area
exports.assignWorkerToWorkArea = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const { workerId, shift, isTeamLead } = req.body;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      return res.status(404).json({
        success: false,
        message: "Work area not found",
      });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // Check if worker already assigned to ANY work area
    if (worker.workArea) {
      return res.status(400).json({
        success: false,
        message: "Worker is already assigned to another work area",
      });
    }

    // Initialize assignedWorkers array if it doesn't exist
    if (!workArea.assignedWorkers) {
      workArea.assignedWorkers = [];
    }

    // Add assignment to work area
    workArea.assignedWorkers.push({
      worker: workerId,
      shift: shift || "morning",
      isTeamLead: isTeamLead || false,
      assignedFrom: new Date(),
      isActive: true,
    });

    await workArea.save();

    // Update worker's workArea and shift fields
    worker.workArea = workAreaId;
    worker.shift = shift || "morning";
    await worker.save();

    res.json({
      success: true,
      message: "Worker assigned to work area successfully",
    });
  } catch (error) {
    console.error("Error assigning worker to work area:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning worker",
    });
  }
};

// Remove worker from work area
exports.removeWorkerFromWorkArea = async (req, res) => {
  try {
    const { workAreaId, assignmentId } = req.params;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      return res.status(404).json({
        success: false,
        message: "Work area not found",
      });
    }

    const assignment = workArea.assignedWorkers?.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const workerId = assignment.worker;

    // Remove from work area
    assignment.remove();
    await workArea.save();

    // Remove workArea reference from worker
    await User.findByIdAndUpdate(workerId, {
      $unset: { workArea: "" },
      shift: "morning",
    });

    res.json({
      success: true,
      message: "Worker removed from work area successfully",
    });
  } catch (error) {
    console.error("Error removing worker from work area:", error);
    res.status(500).json({
      success: false,
      message: "Error removing worker",
    });
  }
};

// Get available workers for dropdown
exports.getAvailableWorkersForWorkArea = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      return res.status(404).json({
        success: false,
        message: "Work area not found",
      });
    }

    const availableWorkers = await User.find({
      role: "worker",
      isActive: true,
      workArea: { $eq: null },
    }).select("name email");

    const assignedWorkers = await User.find({
      _id: { $in: (workArea.assignedWorkers || []).map((a) => a.worker) },
      isActive: true,
    }).select("name email");

    res.json({
      success: true,
      data: {
        availableWorkers,
        assignedWorkers,
      },
    });
  } catch (error) {
    console.error("Error getting available workers:", error);
    res.status(500).json({
      success: false,
      message: "Error loading workers",
    });
  }
};

// Update worker assignment
exports.updateWorkerAssignment = async (req, res) => {
  try {
    const { workAreaId, assignmentId } = req.params;
    const { shift, isTeamLead, isActive } = req.body;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      return res.status(404).json({
        success: false,
        message: "Work area not found",
      });
    }

    const assignment = workArea.assignedWorkers?.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (shift) assignment.shift = shift;
    if (isActive !== undefined) assignment.isActive = isActive;
    if (isTeamLead !== undefined) assignment.isTeamLead = isTeamLead;

    await workArea.save();

    if (shift) {
      await User.findByIdAndUpdate(assignment.worker, { shift });
    }

    res.json({
      success: true,
      message: "Assignment updated successfully",
    });
  } catch (error) {
    console.error("Error updating worker assignment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating assignment",
    });
  }
};

// ========== INCIDENT ROUTES ==========
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
