// const Permit = require("../models/Permit");
// const WorkArea = require("../models/WorkArea");
// const SafetyOfficer = require("../models/SafetyOfficer");

// // Show create permit form
// exports.showCreateForm = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const workArea = await WorkArea.findById(workAreaId).populate("worksite");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     res.render("permits/create", {
//       user: req.user,
//       workArea,
//     });
//   } catch (error) {
//     console.error("Error loading create form:", error);
//     req.flash("error", "Error loading form");
//     res.redirect("/dashboard");
//   }
// };

// // Create new permit
// exports.createPermit = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const {
//       permitType,
//       title,
//       description,
//       workType,
//       specificLocation,
//       validFrom,
//       validTo,
//       workers,
//       hazards,
//       ppeRequirements,
//       preWorkChecklist,
//     } = req.body;

//     const workArea = await WorkArea.findById(workAreaId);
//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     // Parse arrays if provided as JSON strings
//     const parseJSON = (data) => {
//       try {
//         return typeof data === "string" ? JSON.parse(data) : data || [];
//       } catch {
//         return [];
//       }
//     };

//     const newPermit = new Permit({
//       workArea: workAreaId,
//       permitType,
//       title,
//       description,
//       workType,
//       specificLocation: {
//         description: specificLocation,
//       },
//       validFrom: new Date(validFrom),
//       validTo: new Date(validTo),
//       workers: parseJSON(workers),
//       hazards: parseJSON(hazards),
//       ppeRequirements: parseJSON(ppeRequirements),
//       preWorkChecklist: parseJSON(preWorkChecklist),
//       status: "draft",
//       createdBy: req.user.safetyOfficer,
//     });

//     await newPermit.save();

//     // Add to work area's active permits
//     workArea.activePermits.push(newPermit._id);
//     await workArea.save();

//     req.flash("success", "Permit created successfully");
//     res.redirect(`/permits/${newPermit._id}`);
//   } catch (error) {
//     console.error("Error creating permit:", error);
//     req.flash("error", "Error creating permit");
//     res.redirect(`/permits/new/${req.params.workAreaId}`);
//   }
// };

// // View single permit
// exports.getPermit = async (req, res) => {
//   try {
//     const permit = await Permit.findById(req.params.id)
//       .populate("workArea", "name worksite")
//       .populate("createdBy", "name")
//       .populate("authorizations.received.authorizer", "name");

//     if (!permit) {
//       req.flash("error", "Permit not found");
//       return res.redirect("/dashboard");
//     }

//     res.render("permits/view", {
//       user: req.user,
//       permit,
//     });
//   } catch (error) {
//     console.error("Error viewing permit:", error);
//     req.flash("error", "Error loading permit");
//     res.redirect("/dashboard");
//   }
// };

// // Approve permit
// exports.approvePermit = async (req, res) => {
//   try {
//     const permit = await Permit.findById(req.params.id);

//     if (!permit) {
//       req.flash("error", "Permit not found");
//       return res.redirect("/dashboard");
//     }

//     const { comments } = req.body;

//     permit.authorizations.received.push({
//       authorizer: req.user.safetyOfficer || req.user._id,
//       role: req.user.role,
//       date: new Date(),
//       comments,
//     });

//     // Check if all required authorizations are received
//     // This is simplified - you might have a more complex approval workflow
//     permit.status = "issued";

//     await permit.save();

//     req.flash("success", "Permit approved and issued");
//     res.redirect(`/permits/${permit._id}`);
//   } catch (error) {
//     console.error("Error approving permit:", error);
//     req.flash("error", "Error approving permit");
//     res.redirect(`/permits/${req.params.id}`);
//   }
// };

// // Complete permit
// exports.completePermit = async (req, res) => {
//   try {
//     const permit = await Permit.findById(req.params.id);

//     if (!permit) {
//       req.flash("error", "Permit not found");
//       return res.redirect("/dashboard");
//     }

//     const { workCompleted, areaLeftSafe, remarks } = req.body;

//     permit.completion = {
//       completedAt: new Date(),
//       completedBy: req.user.safetyOfficer,
//       workCompleted: workCompleted === "true",
//       areaLeftSafe: areaLeftSafe === "true",
//       remarks,
//     };

//     permit.status = "completed";

//     await permit.save();

//     req.flash("success", "Permit completed successfully");
//     res.redirect(`/permits/${permit._id}`);
//   } catch (error) {
//     console.error("Error completing permit:", error);
//     req.flash("error", "Error completing permit");
//     res.redirect(`/permits/${req.params.id}`);
//   }
// };

// // Cancel permit
// exports.cancelPermit = async (req, res) => {
//   try {
//     const permit = await Permit.findById(req.params.id);

//     if (!permit) {
//       req.flash("error", "Permit not found");
//       return res.redirect("/dashboard");
//     }

//     const { reason } = req.body;

//     permit.cancellation = {
//       cancelledAt: new Date(),
//       cancelledBy: req.user.safetyOfficer || req.user._id,
//       reason,
//     };

//     permit.status = "cancelled";

//     await permit.save();

//     req.flash("success", "Permit cancelled");
//     res.redirect(`/permits/${permit._id}`);
//   } catch (error) {
//     console.error("Error cancelling permit:", error);
//     req.flash("error", "Error cancelling permit");
//     res.redirect(`/permits/${req.params.id}`);
//   }
// };

// const Permit = require("../models/Permit");
// const WorkArea = require("../models/WorkArea");
// const Incident = require("../models/Incident");
// const RiskAssessment = require("../models/RiskAssessment");
// const SafetyObservation = require("../models/SafetyObservation");
// const { OpenAI } = require("openai");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Show generate permit form
// exports.showGenerateForm = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const workArea = await WorkArea.findById(workAreaId).populate("worksite");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     res.render("permits/generate", {
//       user: req.user,
//       workArea,
//       permitTypes: [
//         { value: "hot_work", label: "Hot Work (Welding, Cutting, Grinding)" },
//         { value: "cold_work", label: "Cold Work (Non-sparking activities)" },
//         { value: "confined_space", label: "Confined Space Entry" },
//         { value: "height_work", label: "Work at Height" },
//         { value: "excavation", label: "Excavation/Trenching" },
//         { value: "electrical", label: "Electrical Work" },
//         { value: "lifting", label: "Lifting Operations" },
//         { value: "chemical", label: "Chemical Handling" },
//         { value: "demolition", label: "Demolition" },
//       ],
//     });
//   } catch (error) {
//     console.error("Error loading generate form:", error);
//     req.flash("error", "Error loading form");
//     res.redirect("/dashboard");
//   }
// };

// // Generate permit using AI
// exports.generatePermit = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const {
//       permitType,
//       title,
//       workDescription,
//       validFrom,
//       validTo,
//       specificLocation,
//     } = req.body;

//     const workArea = await WorkArea.findById(workAreaId)
//       .populate("worksite")
//       .populate("identifiedHazards");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     // Get recent incidents for context
//     const recentIncidents = await Incident.find({ workArea: workAreaId })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // Get recent observations
//     const recentObservations = await SafetyObservation.find({
//       workArea: workAreaId,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // Get active hazards
//     const activeHazards =
//       workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

//     // Build AI prompt
//     const prompt = `You are a senior safety officer creating a ${permitType.replace("_", " ").toUpperCase()} PERMIT.

// ## WORK AREA CONTEXT:
// - Work Area: ${workArea.name}
// - Worksite: ${workArea.worksite?.name || "N/A"}
// - Location: ${specificLocation || workArea.location?.zone || "Not specified"}
// - Current Status: ${workArea.status}

// ## PERMIT DETAILS:
// - Type: ${permitType}
// - Title: ${title}
// - Work Description: ${workDescription}
// - Valid From: ${validFrom}
// - Valid To: ${validTo}

// ## ACTIVE HAZARDS IN THIS AREA:
// ${activeHazards.map((h) => `- ${h.hazard} (Risk: ${h.riskLevel})`).join("\n") || "No specific hazards listed"}

// ## RECENT INCIDENTS (for context):
// ${recentIncidents.map((i) => `- ${i.type}: ${i.description?.substring(0, 100)}`).join("\n") || "No recent incidents"}

// ## RECENT SAFETY OBSERVATIONS:
// ${recentObservations.map((o) => `- ${o.type}: ${o.description?.substring(0, 100)}`).join("\n") || "No recent observations"}

// ## YOUR TASK:
// Generate a comprehensive permit with specific requirements for this permit type.

// Return ONLY valid JSON with this structure:
// {
//   "preWorkChecklist": [
//     { "item": "Check item description", "completed": false, "notes": "" }
//   ],
//   "ppeRequirements": [
//     { "item": "hard_hat", "quantity": 5, "condition": "good" }
//   ],
//   "hazards": [
//     { "hazard": "Hazard name", "controls": ["Control 1", "Control 2"], "ppeRequired": ["PPE 1"] }
//   ],
//   "gasTests": ${
//     permitType === "confined_space" || permitType === "hot_work"
//       ? `[
//     { "testTime": "Initial", "required": true, "limits": { "oxygen": "19.5-23.5%", "combustibles": "<10% LEL" } }
//   ]`
//       : "[]"
//   },
//   "emergencyProcedures": "Emergency procedures text here",
//   "specialPrecautions": "Special precautions text here",
//   "workerRequirements": ["Certification 1", "Training 2"]
// }`;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo-16k",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.7,
//       max_tokens: 2500,
//     });

//     const aiResponse = completion.choices[0].message.content;
//     let permitData;
//     try {
//       const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
//       permitData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
//     } catch (e) {
//       console.error("JSON parse error:", e);
//       permitData = {};
//     }

//     // Create permit
//     const permit = new Permit({
//       workArea: workAreaId,
//       permitType,
//       title,
//       description: workDescription,
//       workDescription,
//       specificLocation: {
//         description: specificLocation || workArea.location?.zone,
//       },
//       validFrom: new Date(validFrom),
//       validTo: new Date(validTo),
//       createdBy: req.user.safetyOfficer,
//       status: "pending_approval",
//       preWorkChecklist: (permitData.preWorkChecklist || []).map((item) => ({
//         item: typeof item === "string" ? item : item.item,
//         completed: false,
//       })),
//       ppeRequirements: (permitData.ppeRequirements || []).map((item) => ({
//         item: item.item,
//         quantity: item.quantity || 1,
//         condition: item.condition || "good",
//         issued: false,
//       })),
//       hazards: permitData.hazards || [],
//       gasTests: permitData.gasTests || [],
//       authorizations: {
//         required: [{ role: "Safety Officer", level: 1 }],
//         received: [],
//       },
//     });

//     await permit.save();

//     // Add to work area documents
//     if (!workArea.documents) workArea.documents = {};
//     if (!workArea.documents.permits) workArea.documents.permits = [];
//     workArea.documents.permits.push(permit._id);
//     await workArea.save();

//     req.flash("success", `Permit generated successfully!`);
//     res.redirect(`/permits/${permit._id}`);
//   } catch (error) {
//     console.error("Error generating permit:", error);
//     req.flash("error", "Error generating permit: " + error.message);
//     res.redirect(`/work-areas/${req.params.workAreaId}`);
//   }
// };

// // View permit
// exports.getPermit = async (req, res) => {
//   try {
//     const permit = await Permit.findById(req.params.id)
//       .populate("workArea", "name worksite")
//       .populate("createdBy", "name")
//       .populate("authorizations.received.authorizer", "name")
//       .populate("completion.completedBy", "name");

//     if (!permit) {
//       req.flash("error", "Permit not found");
//       return res.redirect("/dashboard");
//     }

//     res.render("permits/view", {
//       user: req.user,
//       permit,
//     });
//   } catch (error) {
//     console.error("Error viewing permit:", error);
//     req.flash("error", "Error loading permit");
//     res.redirect("/dashboard");
//   }
// };

// // Approve permit
// exports.approvePermit = async (req, res) => {
//   try {
//     const permit = await Permit.findById(req.params.id);
//     if (!permit) {
//       req.flash("error", "Permit not found");
//       return res.redirect("/dashboard");
//     }

//     permit.status = "issued";
//     permit.authorizations.received.push({
//       authorizer: req.user.safetyOfficer,
//       role: "Safety Officer",
//       date: new Date(),
//       comments: req.body.comments || "",
//     });

//     await permit.save();

//     req.flash("success", "Permit approved and issued!");
//     res.redirect(`/permits/${permit._id}`);
//   } catch (error) {
//     console.error("Error approving permit:", error);
//     req.flash("error", "Error approving permit");
//     res.redirect(`/permits/${req.params.id}`);
//   }
// };

// // Activate permit
// exports.activatePermit = async (req, res) => {
//   try {
//     const permit = await Permit.findById(req.params.id);
//     if (!permit) {
//       req.flash("error", "Permit not found");
//       return res.redirect("/dashboard");
//     }

//     permit.status = "active";
//     await permit.save();

//     req.flash("success", "Permit activated! Work can begin.");
//     res.redirect(`/permits/${permit._id}`);
//   } catch (error) {
//     console.error("Error activating permit:", error);
//     req.flash("error", "Error activating permit");
//     res.redirect(`/permits/${req.params.id}`);
//   }
// };

// // Complete permit
// exports.completePermit = async (req, res) => {
//   try {
//     const permit = await Permit.findById(req.params.id);
//     if (!permit) {
//       req.flash("error", "Permit not found");
//       return res.redirect("/dashboard");
//     }

//     permit.status = "completed";
//     permit.completion = {
//       completedAt: new Date(),
//       completedBy: req.user.safetyOfficer,
//       workCompleted: req.body.workCompleted === "yes",
//       areaLeftSafe: req.body.areaLeftSafe === "yes",
//       equipmentRemoved: req.body.equipmentRemoved === "yes",
//       wasteDisposed: req.body.wasteDisposed === "yes",
//       remarks: req.body.remarks || "",
//     };

//     await permit.save();

//     req.flash("success", "Permit completed successfully!");
//     res.redirect(`/permits/${permit._id}`);
//   } catch (error) {
//     console.error("Error completing permit:", error);
//     req.flash("error", "Error completing permit");
//     res.redirect(`/permits/${req.params.id}`);
//   }
// };

// // List permits for work area
// exports.getWorkAreaPermits = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const permits = await Permit.find({ workArea: workAreaId })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     res.json({ success: true, permits });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

const Permit = require("../models/Permit");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyObservation = require("../models/SafetyObservation");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Show generate permit form
exports.showGenerateForm = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const workArea = await WorkArea.findById(workAreaId).populate("worksite");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    res.render("permits/generate", {
      user: req.user,
      workArea,
      permitTypes: [
        { value: "hot_work", label: "Hot Work (Welding, Cutting, Grinding)" },
        { value: "cold_work", label: "Cold Work (Non-sparking activities)" },
        { value: "confined_space", label: "Confined Space Entry" },
        { value: "height_work", label: "Work at Height" },
        { value: "excavation", label: "Excavation/Trenching" },
        { value: "electrical", label: "Electrical Work" },
        { value: "lifting", label: "Lifting Operations" },
        { value: "chemical", label: "Chemical Handling" },
        { value: "demolition", label: "Demolition" },
        { value: "blasting", label: "Blasting/Explosives" }, // ADD THIS
      ],
    });
  } catch (error) {
    console.error("Error loading generate form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

// Generate permit using AI
// exports.generatePermit = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const {
//       permitType,
//       title,
//       workDescription,
//       validFrom,
//       validTo,
//       specificLocation,
//     } = req.body;

//     const workArea = await WorkArea.findById(workAreaId)
//       .populate("worksite")
//       .populate("identifiedHazards");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     // Get recent incidents for context
//     const recentIncidents = await Incident.find({ workArea: workAreaId })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // Get recent observations
//     const recentObservations = await SafetyObservation.find({
//       workArea: workAreaId,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // Get active hazards
//     const activeHazards =
//       workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

//     // Build AI prompt
//     const prompt = `You are a senior safety officer creating a ${permitType.replace("_", " ").toUpperCase()} PERMIT.

// ## WORK AREA CONTEXT:
// - Work Area: ${workArea.name}
// - Worksite: ${workArea.worksite?.name || "N/A"}
// - Location: ${specificLocation || workArea.location?.zone || "Not specified"}
// - Current Status: ${workArea.status}

// ## PERMIT DETAILS:
// - Type: ${permitType}
// - Title: ${title}
// - Work Description: ${workDescription}
// - Valid From: ${validFrom}
// - Valid To: ${validTo}

// ## ACTIVE HAZARDS IN THIS AREA:
// ${activeHazards.map((h) => `- ${h.hazard} (Risk: ${h.riskLevel})`).join("\n") || "No specific hazards listed"}

// ## RECENT INCIDENTS (for context):
// ${recentIncidents.map((i) => `- ${i.type}: ${i.description?.substring(0, 100)}`).join("\n") || "No recent incidents"}

// ## RECENT SAFETY OBSERVATIONS:
// ${recentObservations.map((o) => `- ${o.type}: ${o.description?.substring(0, 100)}`).join("\n") || "No recent observations"}

// ## YOUR TASK:
// Generate a comprehensive permit with specific requirements for this permit type.

// Return ONLY valid JSON with this structure:
// {
//   "preWorkChecklist": [
//     "Check item 1",
//     "Check item 2"
//   ],
//   "ppeRequirements": [
//     { "item": "hard_hat", "quantity": 5, "condition": "good" }
//   ],
//   "hazards": [
//     { "hazard": "Hazard name", "controls": ["Control 1", "Control 2"], "ppeRequired": ["PPE 1"] }
//   ],
//   "gasTestRequirements": ${permitType === "confined_space" || permitType === "hot_work" ? '["Initial test", "Continuous monitoring", "After breaks"]' : "[]"},
//   "emergencyProcedures": "Emergency procedures text here",
//   "specialPrecautions": "Special precautions text here",
//   "workerRequirements": ["Certification 1", "Training 2"]
// }`;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo-16k",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.7,
//       max_tokens: 2500,
//     });

//     const aiResponse = completion.choices[0].message.content;
//     let permitData;
//     try {
//       const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
//       permitData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
//     } catch (e) {
//       console.error("JSON parse error:", e);
//       permitData = {};
//     }

//     // Create permit - FIXED: removed gasTests array that was causing errors
//     const permit = new Permit({
//       workArea: workAreaId,
//       permitType,
//       title,
//       description: workDescription,
//       workDescription,
//       specificLocation: {
//         description: specificLocation || workArea.location?.zone,
//       },
//       validFrom: new Date(validFrom),
//       validTo: new Date(validTo),
//       createdBy: req.user.safetyOfficer,
//       status: "pending_approval",
//       preWorkChecklist: (permitData.preWorkChecklist || []).map((item) => ({
//         item: typeof item === "string" ? item : item.item,
//         completed: false,
//       })),
//       ppeRequirements: (permitData.ppeRequirements || []).map((item) => ({
//         item: item.item,
//         quantity: item.quantity || 1,
//         condition: item.condition || "good",
//         issued: false,
//       })),
//       hazards: permitData.hazards || [],
//       // FIXED: Don't add gasTests array - leave it empty
//       gasTests: [], // Empty array to avoid date casting errors
//       authorizations: {
//         required: [{ role: "Safety Officer", level: 1 }],
//         received: [],
//       },
//       // Store gas test requirements in a separate field or notes
//       notes:
//         permitData.gasTestRequirements?.length > 0
//           ? [
//               {
//                 content: `Gas Test Requirements: ${permitData.gasTestRequirements.join(", ")}`,
//                 createdBy: req.user.safetyOfficer,
//                 type: "reminder",
//               },
//             ]
//           : [],
//     });

//     await permit.save();

//     // Add to work area documents
//     if (!workArea.documents) workArea.documents = {};
//     if (!workArea.documents.permits) workArea.documents.permits = [];
//     workArea.documents.permits.push(permit._id);
//     await workArea.save();

//     req.flash("success", `Permit generated successfully!`);
//     res.redirect(`/permits/${permit._id}`);
//   } catch (error) {
//     console.error("Error generating permit:", error);
//     req.flash("error", "Error generating permit: " + error.message);
//     res.redirect(`/work-areas/${req.params.workAreaId}`);
//   }
// };

// Generate permit using AI - UPDATED with qualification requirements
exports.generatePermit = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const {
      permitType,
      title,
      workDescription,
      validFrom,
      validTo,
      specificLocation,
    } = req.body;

    const workArea = await WorkArea.findById(workAreaId)
      .populate("worksite")
      .populate("identifiedHazards");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    // Get recent incidents for context
    const recentIncidents = await Incident.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent observations
    const recentObservations = await SafetyObservation.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get active hazards
    const activeHazards =
      workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

    // Build AI prompt with qualification requirements based on permit type
    const prompt = `You are a senior safety officer creating a ${permitType.replace("_", " ").toUpperCase()} PERMIT.

## WORK AREA CONTEXT:
- Work Area: ${workArea.name}
- Worksite: ${workArea.worksite?.name || "N/A"}
- Location: ${specificLocation || workArea.location?.zone || "Not specified"}
- Current Status: ${workArea.status}

## PERMIT DETAILS:
- Type: ${permitType}
- Title: ${title}
- Work Description: ${workDescription}
- Valid From: ${validFrom}
- Valid To: ${validTo}

## ACTIVE HAZARDS IN THIS AREA:
${activeHazards.map((h) => `- ${h.hazard} (Risk: ${h.riskLevel})`).join("\n") || "No specific hazards listed"}

## RECENT INCIDENTS (for context):
${recentIncidents.map((i) => `- ${i.type}: ${i.description?.substring(0, 100)}`).join("\n") || "No recent incidents"}

## RECENT SAFETY OBSERVATIONS:
${recentObservations.map((o) => `- ${o.type}: ${o.description?.substring(0, 100)}`).join("\n") || "No recent observations"}

## REQUIRED QUALIFICATIONS/CERTIFICATIONS FOR THIS PERMIT TYPE:

Based on the permit type, the following personnel MUST be present on site with valid certifications:

${
  permitType === "hot_work"
    ? `HOT WORK REQUIREMENTS:
- Hot Work Certification (valid within 12 months) for all welders/cutters
- Fire Watch Certification for assigned fire watch personnel
- Welding certification (AWS or equivalent) for all welding personnel
- Competent Person for fire prevention inspection`
    : ""
}

${
  permitType === "confined_space"
    ? `CONFINED SPACE REQUIREMENTS:
- Confined Space Entry Certification (valid within 12 months)
- Confined Space Rescue Certification for rescue team (minimum 2 persons)
- Gas Tester Certification for atmospheric testing
- Competent Person for confined space evaluation
- First Aid/CPR Certification (valid) for standby person`
    : ""
}

${
  permitType === "height_work"
    ? `WORK AT HEIGHT REQUIREMENTS:
- Working at Height Certification (valid within 3 years)
- Fall Protection Competent Person certification
- Rescue at Height Certification for rescue team
- Harness and lanyard inspection certification (if inspecting equipment)
- First Aid/CPR Certification`
    : ""
}

${
  permitType === "excavation"
    ? `EXCAVATION REQUIREMENTS:
- Excavation Safety Certification (valid within 3 years)
- Competent Person for excavation inspection (daily)
- Utility locating certification (if near underground services)
- Shoring/Shielding installation certification
- First Aid/CPR Certification`
    : ""
}

${
  permitType === "electrical"
    ? `ELECTRICAL WORK REQUIREMENTS:
- Licensed Electrician (valid state license)
- Arc Flash Training certification
- Lock-out/Tag-out (LOTO) Certification
- High Voltage training (if applicable)
- First Aid/CPR Certification`
    : ""
}

${
  permitType === "lifting"
    ? `LIFTING OPERATIONS REQUIREMENTS:
- Certified Crane Operator License (valid)
- Rigger Certification for all rigging personnel
- Signal Person Certification
- Lift Director/Supervisor certification
- Equipment inspection certification`
    : ""
}

${
  permitType === "chemical"
    ? `CHEMICAL HANDLING REQUIREMENTS:
- Hazard Communication (HAZCOM) Certification
- Chemical Spill Response Certification
- PPE selection and use certification
- SDS comprehension training
- First Aid/CPR Certification`
    : ""
}

${
  permitType === "demolition"
    ? `DEMOLITION REQUIREMENTS:
- Demolition Safety Certification
- Competent Person for demolition operations
- Asbestos awareness certification
- Lead safety training (if applicable)
- First Aid/CPR Certification`
    : ""
}

${
  permitType === "blasting"
    ? `BLASTING REQUIREMENTS:
- Valid Blaster's License (state/federal) - MUST be present on site at all times
- Explosives Handler Certification
- Blasting Safety Training (refresher within 3 years)
- Site-specific blast plan approval
- Seismic monitoring certification (if required)
- Emergency response team trained for blast incidents
- First Aid/CPR Certification with trauma training`
    : ""
}

## YOUR TASK:
Generate a comprehensive permit with specific requirements for this permit type.

Return ONLY valid JSON with this structure:
{
  "preWorkChecklist": [
    "Check item 1",
    "Check item 2"
  ],
  "ppeRequirements": [
    { "item": "hard_hat", "quantity": 5, "condition": "good" }
  ],
  "requiredQualifications": [
    { "certification": "Blaster's License", "personnelRole": "Blaster", "mustBeOnSite": true, "validityPeriod": "3 years" },
    { "certification": "Explosives Handler", "personnelRole": "Assistant", "mustBeOnSite": true, "validityPeriod": "3 years" }
  ],
  "onSitePersonnel": [
    { "role": "Qualified Blaster", "minimumNumber": 1, "requiredCertification": "Blaster's License" },
    { "role": "Safety Officer", "minimumNumber": 1, "requiredCertification": "Blasting Safety" }
  ],
  "hazards": [
    { "hazard": "Hazard name", "controls": ["Control 1", "Control 2"], "ppeRequired": ["PPE 1"] }
  ],
  "gasTestRequirements": ${permitType === "confined_space" || permitType === "hot_work" ? '["Initial test", "Continuous monitoring", "After breaks"]' : "[]"},
  "emergencyProcedures": "Emergency procedures text here",
  "specialPrecautions": "Special precautions text here",
  "workerRequirements": ["Certification 1", "Training 2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const aiResponse = completion.choices[0].message.content;
    let permitData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      permitData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error("JSON parse error:", e);
      permitData = {};
    }

    // Create permit with qualification requirements
    const permit = new Permit({
      workArea: workAreaId,
      permitType,
      title,
      description: workDescription,
      workDescription,
      specificLocation: {
        description: specificLocation || workArea.location?.zone,
      },
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      createdBy: req.user.safetyOfficer,
      status: "pending_approval",
      preWorkChecklist: (permitData.preWorkChecklist || []).map((item) => ({
        item: typeof item === "string" ? item : item.item,
        completed: false,
      })),
      ppeRequirements: (permitData.ppeRequirements || []).map((item) => ({
        item: item.item,
        quantity: item.quantity || 1,
        condition: item.condition || "good",
        issued: false,
      })),
      hazards: permitData.hazards || [],
      gasTests: [],
      // Store qualification requirements
      workerRequirements: permitData.workerRequirements || [],
      authorizations: {
        required: [{ role: "Safety Officer", level: 1 }],
        received: [],
      },
      notes: [
        ...(permitData.requiredQualifications?.length > 0
          ? [
              {
                content: `REQUIRED CERTIFICATIONS:\n${permitData.requiredQualifications.map((q) => `- ${q.certification}: ${q.personnelRole} (must be on site: ${q.mustBeOnSite ? "YES" : "NO"})`).join("\n")}`,
                createdBy: req.user.safetyOfficer,
                type: "warning",
              },
            ]
          : []),
        ...(permitData.onSitePersonnel?.length > 0
          ? [
              {
                content: `ON-SITE PERSONNEL REQUIREMENTS:\n${permitData.onSitePersonnel.map((p) => `- ${p.role}: Minimum ${p.minimumNumber} person(s) with ${p.requiredCertification}`).join("\n")}`,
                createdBy: req.user.safetyOfficer,
                type: "warning",
              },
            ]
          : []),
        ...(permitData.gasTestRequirements?.length > 0
          ? [
              {
                content: `Gas Test Requirements: ${permitData.gasTestRequirements.join(", ")}`,
                createdBy: req.user.safetyOfficer,
                type: "reminder",
              },
            ]
          : []),
      ],
    });

    await permit.save();

    // Add to work area documents
    if (!workArea.documents) workArea.documents = {};
    if (!workArea.documents.permits) workArea.documents.permits = [];
    workArea.documents.permits.push(permit._id);
    await workArea.save();

    req.flash(
      "success",
      `Permit generated successfully! Check the notes section for qualification requirements.`,
    );
    res.redirect(`/permits/${permit._id}`);
  } catch (error) {
    console.error("Error generating permit:", error);
    req.flash("error", "Error generating permit: " + error.message);
    res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// View permit
exports.getPermit = async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id)
      .populate("workArea", "name worksite")
      .populate("createdBy", "name")
      .populate("authorizations.received.authorizer", "name")
      .populate("completion.completedBy", "name");

    if (!permit) {
      req.flash("error", "Permit not found");
      return res.redirect("/dashboard");
    }

    res.render("permits/view", {
      user: req.user,
      permit,
    });
  } catch (error) {
    console.error("Error viewing permit:", error);
    req.flash("error", "Error loading permit");
    res.redirect("/dashboard");
  }
};

// Approve permit
exports.approvePermit = async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) {
      req.flash("error", "Permit not found");
      return res.redirect("/dashboard");
    }

    permit.status = "issued";
    permit.authorizations.received.push({
      authorizer: req.user.safetyOfficer,
      role: "Safety Officer",
      date: new Date(),
      comments: req.body.comments || "",
    });

    await permit.save();

    req.flash("success", "Permit approved and issued!");
    res.redirect(`/permits/${permit._id}`);
  } catch (error) {
    console.error("Error approving permit:", error);
    req.flash("error", "Error approving permit");
    res.redirect(`/permits/${req.params.id}`);
  }
};

// Activate permit
exports.activatePermit = async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) {
      req.flash("error", "Permit not found");
      return res.redirect("/dashboard");
    }

    permit.status = "active";
    await permit.save();

    req.flash("success", "Permit activated! Work can begin.");
    res.redirect(`/permits/${permit._id}`);
  } catch (error) {
    console.error("Error activating permit:", error);
    req.flash("error", "Error activating permit");
    res.redirect(`/permits/${req.params.id}`);
  }
};

// Complete permit
exports.completePermit = async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) {
      req.flash("error", "Permit not found");
      return res.redirect("/dashboard");
    }

    permit.status = "completed";
    permit.completion = {
      completedAt: new Date(),
      completedBy: req.user.safetyOfficer,
      workCompleted: req.body.workCompleted === "yes",
      areaLeftSafe: req.body.areaLeftSafe === "yes",
      equipmentRemoved: req.body.equipmentRemoved === "yes",
      wasteDisposed: req.body.wasteDisposed === "yes",
      remarks: req.body.remarks || "",
    };

    await permit.save();

    req.flash("success", "Permit completed successfully!");
    res.redirect(`/permits/${permit._id}`);
  } catch (error) {
    console.error("Error completing permit:", error);
    req.flash("error", "Error completing permit");
    res.redirect(`/permits/${req.params.id}`);
  }
};

// List permits for work area
exports.getWorkAreaPermits = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const permits = await Permit.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, permits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
