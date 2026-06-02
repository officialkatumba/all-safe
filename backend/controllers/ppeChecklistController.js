// const PPEChecklist = require("../models/PPEChecklist");
// const WorkArea = require("../models/WorkArea");
// const Incident = require("../models/Incident");
// const SafetyObservation = require("../models/SafetyObservation");
// const RiskAssessment = require("../models/RiskAssessment");
// const SafetyTalk = require("../models/SafetyTalk");
// const { OpenAI } = require("openai");
// const { generatePPEWordBuffer } = require("../utils/ppeWordGenerator");
const { AI_MODEL, AI_MAX_TOKENS } = require("../utils/aiConfig");
const { approveReviewedDocument, ensureReviewable, isApproved, recordRevision, regenerateStructuredOutput, trackAiCompletion } = require("../utils/aiReview");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Generate PPE requirements based on work area data
// exports.generatePPERequirements = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;

//     const workArea = await WorkArea.findById(workAreaId);

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     // Collect all relevant data for AI analysis
//     const recentIncidents = await Incident.find({ workArea: workAreaId })
//       .sort({ createdAt: -1 })
//       .limit(15);

//     const recentObservations = await SafetyObservation.find({
//       workArea: workAreaId,
//     })
//       .sort({ createdAt: -1 })
//       .limit(15);

//     const recentRiskAssessments = await RiskAssessment.find({
//       workArea: workAreaId,
//     })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const recentSafetyTalks = await SafetyTalk.find({
//       targetWorkAreas: workAreaId,
//     })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     // Get active hazards
//     const activeHazards =
//       workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

//     // Get current work types
//     const workTypes =
//       workArea.currentWorkTypes?.map((wt) => wt.workType).join(", ") ||
//       "General";

//     // Build AI prompt
//     const prompt = `You are a senior safety officer creating a PPE (Personal Protective Equipment) requirements checklist for a work area.

// ## WORK AREA CONTEXT:
// - Name: ${workArea.name}
// - Current Work Types: ${workTypes}
// - Status: ${workArea.status}

// ## RECENT INCIDENTS (Last 30 days):
// ${recentIncidents.map((i) => `- ${i.type}: ${i.description?.substring(0, 150)} (Severity: ${i.severity})`).join("\n") || "No recent incidents"}

// ## RECENT SAFETY OBSERVATIONS:
// ${recentObservations.map((o) => `- [${o.type}] ${o.description?.substring(0, 150)}`).join("\n") || "No recent observations"}

// ## ACTIVE HAZARDS:
// ${activeHazards.map((h) => `- ${h.hazard} (Risk: ${h.riskLevel})`).join("\n") || "No active hazards listed"}

// ## RECENT RISK ASSESSMENT FINDINGS:
// ${recentRiskAssessments.map((ra) => `- ${ra.title}: ${ra.overallFindings?.substring(0, 150) || "Review recommended"}`).join("\n") || "No recent risk assessments"}

// ## YOUR TASK:
// Generate a comprehensive PPE requirements checklist based on the data above. Consider:
// 1. Head protection (hard hats)
// 2. Eye and face protection
// 3. Hearing protection
// 4. Respiratory protection
// 5. Hand protection
// 6. Foot protection
// 7. Body protection (vests, suits)
// 8. Fall protection
// 9. Specialized PPE for specific tasks

// ## OUTPUT FORMAT (JSON only):
// {
//   "title": "PPE Requirements - [Work Area Name] - [Date]",
//   "ppeItems": [
//     {
//       "item": "hard_hat",
//       "required": true,
//       "condition": "Good condition, no cracks, suspension intact",
//       "quantity": "[estimated number]",
//       "reason": "[why this PPE is needed based on hazards]"
//     }
//   ],
//   "specialInstructions": "[Any additional PPE instructions or notes]",
//   "inspectionItems": [
//     { "item": "[what to inspect]", "passCriteria": "[what to check for]" }
//   ]
// }

// Return ONLY valid JSON, no other text. Base your recommendations on the actual hazards, incidents, and observations provided.`;

//     const completion = await openai.chat.completions.create({
//       model: AI_MODEL,
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.7,
//       max_tokens: 2000,
//     });

//     const aiResponse = completion.choices[0].message.content;

//     // Parse JSON response
//     let ppeData;
//     try {
//       ppeData = JSON.parse(aiResponse);
//     } catch (e) {
//       // Extract JSON from response if wrapped in markdown
//       const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
//       ppeData = jsonMatch ? JSON.parse(jsonMatch[0]) : { ppeItems: [] };
//     }

//     // Create PPE Checklist
//     const ppeChecklist = new PPEChecklist({
//       createdBy: req.user._id,
//       title:
//         ppeData.title ||
//         `PPE Requirements - ${workArea.name} - ${new Date().toLocaleDateString()}`,
//       date: new Date(),
//       applicableTasks: workTypes.split(", "),
//       applicableDepartments: ["All"],
//       applicableShifts: ["all"],
//       ppeItems: (ppeData.ppeItems || []).map((item) => ({
//         item: item.item,
//         customItem: item.item === "other" ? item.customItem : undefined,
//         required: item.required !== false,
//         condition: item.condition || "Good condition",
//         quantity: item.quantity ? parseInt(item.quantity) || 0 : 0,
//         location: "Work area",
//       })),
//       inspectionItems: (ppeData.inspectionItems || []).map((item) => ({
//         item: item.item,
//         passCriteria: item.passCriteria || "Visually acceptable",
//       })),
//       status: "active",
//     });

//     await ppeChecklist.save();

//     // Update work area documents
//     if (!workArea.documents) workArea.documents = {};
//     if (!workArea.documents.ppeChecklists)
//       workArea.documents.ppeChecklists = [];
//     workArea.documents.ppeChecklists.push(ppeChecklist._id);
//     await workArea.save();

//     req.flash("success", "PPE requirements generated successfully!");
//     res.redirect(`/ppe/${ppeChecklist._id}`);
//   } catch (error) {
//     console.error("Error generating PPE requirements:", error);
//     req.flash("error", "Error generating PPE requirements: " + error.message);
//     res.redirect(`/work-areas/${req.params.workAreaId}`);
//   }
// };

// // View PPE Checklist
// exports.getPPEChecklist = async (req, res) => {
//   try {
//     const checklist = await PPEChecklist.findById(req.params.id)
//
//       .populate("createdBy", "name")
//       .populate("workerSignoffs.workerId", "name");

//     if (!checklist) {
//       req.flash("error", "PPE checklist not found");
//       return res.redirect("/dashboard");
//     }

//     res.render("ppe/view", {
//       user: req.user,
//       checklist,
//     });
//   } catch (error) {
//     console.error("Error viewing PPE checklist:", error);
//     req.flash("error", "Error loading checklist");
//     res.redirect("/dashboard");
//   }
// };

// // List PPE Checklists for work area
// exports.getWorkAreaPPEChecklists = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const workArea = await WorkArea.findById(workAreaId);

//     if (!workArea) {
//       return res.status(404).json({ success: false });
//     }

//       .sort({ createdAt: -1 })
//       .limit(10);

//     res.json({ success: true, checklists });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // Mark checklist as completed
// exports.completeChecklist = async (req, res) => {
//   try {
//     const checklist = await PPEChecklist.findById(req.params.id);

//     if (!checklist) {
//       req.flash("error", "Checklist not found");
//       return res.redirect("/dashboard");
//     }

//     checklist.status = "completed";
//     await checklist.save();

//     req.flash("success", "PPE checklist marked as completed!");
//     res.redirect(`/ppe/${checklist._id}`);
//   } catch (error) {
//     console.error("Error completing checklist:", error);
//     req.flash("error", "Error updating checklist");
//     res.redirect(`/ppe/${req.params.id}`);
//   }
// };

// exports.downloadWord = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const checklist = await PPEChecklist.findById(id)
//
//       .populate("workArea", "name location")
//       .populate("generatedBy", "name");

//     if (!checklist) {
//       return res.status(404).send("PPE checklist not found");
//     }

//     const buffer = await generatePPEWordBuffer({ checklist });

//     const safeNumber = checklist.checklistNumber || Date.now();
//     const fileName = `ppe_checklist_${safeNumber}.docx`;

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     );

//     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

//     return res.send(buffer);
//   } catch (error) {
//     console.error("Error downloading PPE Word document:", error);
//     return res.status(500).send("Error generating PPE Word document");
//   }
// };

const PPEChecklist = require("../models/PPEChecklist");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const SafetyObservation = require("../models/SafetyObservation");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyTalk = require("../models/SafetyTalk");
const { OpenAI } = require("openai");
const { generatePPEWordBuffer } = require("../utils/ppeWordGenerator");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeText(value, max = 150) {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").substring(0, max);
}

function parseAIJson(aiResponse) {
  try {
    const cleaned = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { ppeItems: [] };
    } catch (innerError) {
      console.error("Failed to parse PPE AI JSON:", innerError.message);
      return {
        title: "AI Generated PPE Requirements",
        ppeItems: [],
        inspectionItems: [],
        specialInstructions:
          "The AI response could not be fully parsed. Safety officer should review manually.",
      };
    }
  }
}

// Generate PPE requirements based on work area data
exports.generatePPERequirements = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const workArea = await WorkArea.findById(workAreaId);

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    // Collect relevant safety data for AI analysis
    const recentIncidents = await Incident.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(15);

    const recentObservations = await SafetyObservation.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(15);

    const recentRiskAssessments = await RiskAssessment.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentSafetyTalks = await SafetyTalk.find({
      targetWorkAreas: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const activeHazards =
      workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

    const workTypes =
      workArea.currentWorkTypes
        ?.map((wt) => wt.workType || wt)
        .filter(Boolean)
        .join(", ") || "General";

    const prompt = `You are a senior safety officer creating a PPE (Personal Protective Equipment) requirements checklist for a work area.

WORK AREA CONTEXT:
- Name: ${workArea.name}
- Location: ${workArea.location?.zone || "N/A"}
- Current Work Types: ${workTypes}
- Status: ${workArea.status || "N/A"}
- Location: ${workArea.location?.zone || workArea.location || "N/A"}
- Description: ${safeText(workArea.description, 400)}

RECENT INCIDENTS:
${
  recentIncidents.length > 0
    ? recentIncidents
        .map(
          (i) =>
            `- ${i.type}: ${safeText(i.description, 180)} (Severity: ${i.severity || "N/A"})`,
        )
        .join("\n")
    : "No recent incidents"
}

RECENT SAFETY OBSERVATIONS:
${
  recentObservations.length > 0
    ? recentObservations
        .map((o) => `- [${o.type}] ${safeText(o.description, 180)}`)
        .join("\n")
    : "No recent observations"
}

ACTIVE HAZARDS:
${
  activeHazards.length > 0
    ? activeHazards
        .map((h) => `- ${h.hazard} (Risk: ${h.riskLevel || "N/A"})`)
        .join("\n")
    : "No active hazards listed"
}

RECENT RISK ASSESSMENT FINDINGS:
${
  recentRiskAssessments.length > 0
    ? recentRiskAssessments
        .map(
          (ra) =>
            `- ${ra.title}: ${safeText(ra.overallFindings || ra.summary || "Review recommended", 180)}`,
        )
        .join("\n")
    : "No recent risk assessments"
}

RECENT SAFETY TALKS:
${
  recentSafetyTalks.length > 0
    ? recentSafetyTalks
        .map(
          (talk) =>
            `- ${talk.title}: ${talk.topics?.join(", ") || "No topics listed"}`,
        )
        .join("\n")
    : "No recent safety talks"
}

TASK:
Generate a practical PPE requirements checklist based on the actual hazards, incidents, observations, and work activities above.

Consider:
1. Head protection
2. Eye and face protection
3. Hearing protection
4. Respiratory protection
5. Hand protection
6. Foot protection
7. Body protection
8. High visibility clothing
9. Fall protection
10. Specialized PPE for specific tasks

Return ONLY valid JSON in this exact shape:
{
  "title": "PPE Requirements - [Work Area Name] - [Date]",
  "ppeItems": [
    {
      "item": "hard_hat",
      "customItem": "",
      "required": true,
      "condition": "Good condition, no cracks, suspension intact",
      "quantity": "As needed",
      "reason": "Why this PPE is needed based on hazards"
    }
  ],
  "specialInstructions": "Any additional PPE instructions or notes",
  "inspectionItems": [
    {
      "item": "Hard hat shell and suspension",
      "passCriteria": "No cracks, dents, broken straps, or expired components"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: AI_MAX_TOKENS.ppeChecklist,
    });

    const aiResponse = completion.choices[0].message.content;
    const ppeData = parseAIJson(aiResponse);

    const ppeChecklist = new PPEChecklist({
      workArea: workArea._id,

      generatedBy: req.user._id,
      title:
        ppeData.title ||
        `PPE Requirements - ${workArea.name} - ${new Date().toLocaleDateString()}`,
      date: new Date(),

      ppeItems: (ppeData.ppeItems || []).map((item) => ({
        item: item.item || "other",
        customItem: item.customItem || "",
        required: item.required !== false,
        condition: item.condition || "Good condition",
        quantity: item.quantity || "As needed",
        reason: item.reason || "",
      })),

      inspectionItems: (ppeData.inspectionItems || []).map((item) => ({
        item: item.item || "General PPE inspection",
        passCriteria:
          item.passCriteria ||
          "PPE must be available, suitable, clean, and in good condition.",
      })),

      status: "draft",
      aiGenerated: true,
      aiModel: AI_MODEL,
      generationPrompt: prompt,
    });

    await ppeChecklist.save();
    await trackAiCompletion({
      completion,
      user: req.user._id,
      workArea: workArea._id,
      module: "ppe_checklist",
      description: "PPE checklist generated",
      relatedModel: "PPEChecklist",
      relatedId: ppeChecklist._id,
      maxTokens: AI_MAX_TOKENS.ppeChecklist,
    });

    // Update work area document references if your WorkArea model supports it
    if (!workArea.documents) workArea.documents = {};
    if (!workArea.documents.ppeChecklists) {
      workArea.documents.ppeChecklists = [];
    }

    workArea.documents.ppeChecklists.push(ppeChecklist._id);
    await workArea.save();

    req.flash("success", "PPE requirements generated successfully!");
    return res.redirect(`/ppe/${ppeChecklist._id}`);
  } catch (error) {
    console.error("Error generating PPE requirements:", error);
    req.flash("error", "Error generating PPE requirements: " + error.message);
    return res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// View PPE Checklist
exports.getPPEChecklist = async (req, res) => {
  try {
    const checklist = await PPEChecklist.findById(req.params.id)
      .populate("workArea", "name location")
      .populate("generatedBy", "name")
      .populate("completedBy", "name");

    if (!checklist) {
      req.flash("error", "PPE checklist not found");
      return res.redirect("/dashboard");
    }

    res.render("ppe/view", {
      user: req.user,
      checklist,
    });
  } catch (error) {
    console.error("Error viewing PPE checklist:", error);
    req.flash("error", "Error loading checklist");
    res.redirect("/dashboard");
  }
};

// List PPE Checklists for work area
exports.getWorkAreaPPEChecklists = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const workArea = await WorkArea.findById(workAreaId);

    if (!workArea) {
      return res.status(404).json({
        success: false,
        error: "Work area not found",
      });
    }

    const checklists = await PPEChecklist.find({ workArea: workArea._id })
      .populate("workArea", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({ success: true, checklists });
  } catch (error) {
    console.error("Error loading work area PPE checklists:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Mark checklist as completed
exports.completeChecklist = async (req, res) => {
  try {
    const checklist = await PPEChecklist.findById(req.params.id);

    if (!checklist) {
      req.flash("error", "Checklist not found");
      return res.redirect("/dashboard");
    }

    if (!isApproved(checklist)) {
      req.flash("error", "Approve the PPE checklist before marking it completed");
      return res.redirect(`/ppe/${checklist._id}`);
    }

    checklist.status = "completed";
    checklist.completedBy = req.user._id;
    checklist.completedAt = new Date();

    await checklist.save();

    req.flash("success", "PPE checklist marked as completed!");
    return res.redirect(`/ppe/${checklist._id}`);
  } catch (error) {
    console.error("Error completing checklist:", error);
    req.flash("error", "Error updating checklist");
    return res.redirect(`/ppe/${req.params.id}`);
  }
};

exports.regenerateWithComments = async (req, res) => {
  try {
    const checklist = await PPEChecklist.findById(req.params.id);
    if (!checklist) return res.status(404).send("PPE checklist not found");

    ensureReviewable(checklist);
    const previousOutput = {
      title: checklist.title,
      ppeItems: checklist.ppeItems,
      inspectionItems: checklist.inspectionItems,
    };
    const revision = await regenerateStructuredOutput({
      currentOutput: previousOutput,
      comments: req.body.reviewComments,
      documentType: "PPE requirements checklist",
      maxTokens: AI_MAX_TOKENS.ppeChecklist,
      user: req.user._id,
      workArea: checklist.workArea,
      relatedModel: "PPEChecklist",
      relatedId: checklist._id,
    });

    checklist.title = revision.output.title || checklist.title;
    checklist.ppeItems = revision.output.ppeItems || checklist.ppeItems;
    checklist.inspectionItems =
      revision.output.inspectionItems || checklist.inspectionItems;
    checklist.aiModel = AI_MODEL;
    recordRevision(checklist, {
      comments: revision.comments,
      previousOutput,
      submittedBy: req.user._id,
    });
    await checklist.save();

    req.flash("success", "PPE checklist regenerated for review");
    return res.redirect(`/ppe/${checklist._id}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/ppe/${req.params.id}`);
  }
};

exports.approveChecklist = async (req, res) => {
  try {
    const checklist = await PPEChecklist.findById(req.params.id);
    if (!checklist) return res.status(404).send("PPE checklist not found");
    approveReviewedDocument(checklist, req.user._id);
    checklist.status = "active";
    await checklist.save();
    req.flash("success", "PPE checklist approved and locked");
    return res.redirect(`/ppe/${checklist._id}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/ppe/${req.params.id}`);
  }
};

// Download editable Word document
exports.downloadWord = async (req, res) => {
  try {
    const { id } = req.params;

    const checklist = await PPEChecklist.findById(id)
      .populate("workArea", "name location")
      .populate("generatedBy", "name")
      .populate("completedBy", "name");

    if (!checklist) {
      return res.status(404).send("PPE checklist not found");
    }

    if (!isApproved(checklist)) {
      req.flash("error", "Approve the final PPE checklist before downloading it");
      return res.redirect(`/ppe/${checklist._id}`);
    }

    const buffer = await generatePPEWordBuffer({ checklist });

    const safeNumber = checklist.checklistNumber || Date.now();
    const fileName = `ppe_checklist_${safeNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading PPE Word document:", error);
    return res.status(500).send("Error generating PPE Word document");
  }
};

