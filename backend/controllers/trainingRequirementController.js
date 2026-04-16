// const TrainingRequirement = require("../models/TrainingRequirement");
// const WorkArea = require("../models/WorkArea");
// const Incident = require("../models/Incident");
// const RiskAssessment = require("../models/RiskAssessment");
// const SafetyObservation = require("../models/SafetyObservation");
// const User = require("../models/User");
// const { OpenAI } = require("openai");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Show generate form
// exports.showGenerateForm = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const workArea = await WorkArea.findById(workAreaId).populate("worksite");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     res.render("training/generate", {
//       user: req.user,
//       workArea,
//       categories: [
//         { value: "safety_induction", label: "Safety Induction" },
//         { value: "equipment_operation", label: "Equipment Operation" },
//         { value: "hazard_specific", label: "Hazard-Specific Training" },
//         { value: "emergency_response", label: "Emergency Response" },
//         { value: "first_aid", label: "First Aid / CPR" },
//         { value: "legal_compliance", label: "Legal Compliance" },
//         { value: "refresher", label: "Refresher Training" },
//         { value: "supervisory", label: "Supervisory Training" },
//         { value: "specialized", label: "Specialized Skills" },
//       ],
//     });
//   } catch (error) {
//     console.error("Error loading generate form:", error);
//     req.flash("error", "Error loading form");
//     res.redirect("/dashboard");
//   }
// };

// // Generate training requirements using AI
// exports.generateTrainingRequirement = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const { category, title, priority } = req.body;

//     const workArea = await WorkArea.findById(workAreaId)
//       .populate("worksite")
//       .populate("identifiedHazards");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/dashboard");
//     }

//     // Get data for AI context
//     const recentIncidents = await Incident.find({ workArea: workAreaId })
//       .sort({ createdAt: -1 })
//       .limit(15);

//     const recentRiskAssessments = await RiskAssessment.find({
//       workArea: workAreaId,
//     })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const recentObservations = await SafetyObservation.find({
//       workArea: workAreaId,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     const activeHazards =
//       workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

//     // Get worker count
//     const workerCount = await User.countDocuments({
//       role: "worker",
//       workArea: workAreaId,
//       isActive: true,
//     });

//     // Build AI prompt
//     const prompt = `You are a senior safety training specialist. Generate a comprehensive training requirement for a work area.

// ## WORK AREA CONTEXT:
// - Name: ${workArea.name}
// - Worksite: ${workArea.worksite?.name || "N/A"}
// - Work Types: ${workArea.currentWorkTypes?.map((w) => w.workType).join(", ") || "Various"}
// - Worker Count: ${workerCount}

// ## TRAINING CATEGORY: ${category}
// ${title ? `- Custom Title: ${title}` : ""}
// - Priority: ${priority || "medium"}

// ## ACTIVE HAZARDS:
// ${activeHazards.map((h) => `- ${h.hazard} (Risk: ${h.riskLevel})`).join("\n") || "No specific hazards"}

// ## RECENT INCIDENTS (last 30 days):
// ${recentIncidents.map((i) => `- [${i.type}] ${i.description?.substring(0, 100)}`).join("\n") || "No recent incidents"}

// ## RECENT RISK ASSESSMENT FINDINGS:
// ${recentRiskAssessments.map((ra) => `- ${ra.title}: ${ra.overallFindings?.substring(0, 100) || ""}`).join("\n") || "No recent assessments"}

// ## RECENT SAFETY OBSERVATIONS:
// ${recentObservations.map((o) => `- ${o.type}: ${o.description?.substring(0, 100)}`).join("\n") || "No recent observations"}

// ## YOUR TASK:
// Generate a detailed training requirement based on the data above.

// Return ONLY valid JSON with this structure:
// {
//   "title": "Training title",
//   "description": "Detailed description of what this training covers",
//   "requiredForRoles": ["Role 1", "Role 2"],
//   "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
//   "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
//   "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
//   "duration": "X hours/days",
//   "certificationRequired": true,
//   "certificationExpiry": 12,
//   "refresherFrequency": "annually",
//   "regulatoryReference": "OHS Act Section X or ISO Standard"
// }`;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo-16k",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.7,
//       max_tokens: 2000,
//     });

//     const aiResponse = completion.choices[0].message.content;
//     let trainingData;
//     try {
//       const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
//       trainingData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
//     } catch (e) {
//       trainingData = {};
//     }

//     // Create training requirement
//     const trainingReq = new TrainingRequirement({
//       workArea: workAreaId,
//       title:
//         trainingData.title ||
//         title ||
//         `${category.replace(/_/g, " ")} Training - ${workArea.name}`,
//       description: trainingData.description || "",
//       category,
//       priority: priority || "medium",
//       requiredForRoles: trainingData.requiredForRoles || ["All workers"],
//       prerequisites: trainingData.prerequisites || [],
//       learningObjectives: trainingData.learningObjectives || [],
//       keyTopics: trainingData.keyTopics || [],
//       duration: trainingData.duration || "2 hours",
//       certificationRequired: trainingData.certificationRequired || false,
//       certificationExpiry: trainingData.certificationExpiry || 12,
//       refresherFrequency: trainingData.refresherFrequency || "annually",
//       workerCount,
//       basedOn: {
//         hazards: activeHazards.map((h) => h.hazardId),
//         incidents: recentIncidents.map((i) => i._id),
//         riskAssessments: recentRiskAssessments.map((ra) => ra._id),
//         observations: recentObservations.map((o) => o._id),
//         regulatoryReference: trainingData.regulatoryReference || "",
//         aiReasoning:
//           "Generated based on work area hazards, incidents, and risk assessments",
//       },
//       aiGenerated: true,
//       aiModel: "gpt-3.5-turbo-16k",
//       generatedBy: req.user.safetyOfficer,
//       createdBy: req.user.safetyOfficer,
//       status: "published",
//       targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
//     });

//     await trainingReq.save();

//     req.flash("success", `Training requirement generated successfully!`);
//     res.redirect(`/training/${trainingReq._id}`);
//   } catch (error) {
//     console.error("Error generating training requirement:", error);
//     req.flash(
//       "error",
//       "Error generating training requirement: " + error.message,
//     );
//     res.redirect(`/work-areas/${req.params.workAreaId}`);
//   }
// };

// // View training requirement
// exports.getTrainingRequirement = async (req, res) => {
//   try {
//     const training = await TrainingRequirement.findById(req.params.id)
//       .populate("workArea", "name worksite")
//       .populate("targetWorkers.workerId", "name email workerNumber")
//       .populate("generatedBy", "name")
//       .populate("createdBy", "name");

//     if (!training) {
//       req.flash("error", "Training requirement not found");
//       return res.redirect("/dashboard");
//     }

//     // Calculate compliance rate
//     const totalWorkers = training.workerCount || 1;
//     const completedCount = training.targetWorkers.filter(
//       (w) => w.completed,
//     ).length;
//     training.complianceRate = Math.round((completedCount / totalWorkers) * 100);
//     await training.save();

//     res.render("training/view", {
//       user: req.user,
//       training,
//     });
//   } catch (error) {
//     console.error("Error viewing training requirement:", error);
//     req.flash("error", "Error loading training requirement");
//     res.redirect("/dashboard");
//   }
// };

// // List training requirements for work area
// exports.getWorkAreaTraining = async (req, res) => {
//   try {
//     const { workAreaId } = req.params;
//     const trainings = await TrainingRequirement.find({ workArea: workAreaId })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     res.json({ success: true, trainings });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // Mark worker as completed training
// exports.markComplete = async (req, res) => {
//   try {
//     const training = await TrainingRequirement.findById(req.params.id);
//     if (!training) {
//       req.flash("error", "Training requirement not found");
//       return res.redirect("/dashboard");
//     }

//     const { workerId, workerName, certificateUrl } = req.body;

//     // Check if worker already exists
//     const existingIndex = training.targetWorkers.findIndex(
//       (w) => w.workerId && w.workerId.toString() === workerId,
//     );

//     const expiryDate = new Date();
//     expiryDate.setMonth(
//       expiryDate.getMonth() + (training.certificationExpiry || 12),
//     );

//     const completionData = {
//       workerId: workerId || null,
//       name: workerName,
//       completed: true,
//       completedDate: new Date(),
//       certificateUrl: certificateUrl || "",
//       expiryDate: training.certificationRequired ? expiryDate : null,
//     };

//     if (existingIndex >= 0) {
//       training.targetWorkers[existingIndex] = completionData;
//     } else {
//       training.targetWorkers.push(completionData);
//     }

//     // Update compliance rate
//     const completedCount = training.targetWorkers.filter(
//       (w) => w.completed,
//     ).length;
//     training.complianceRate = Math.round(
//       (completedCount / (training.workerCount || 1)) * 100,
//     );

//     await training.save();

//     req.flash("success", "Training marked as complete!");
//     res.redirect(`/training/${training._id}`);
//   } catch (error) {
//     console.error("Error marking complete:", error);
//     req.flash("error", "Error updating training status");
//     res.redirect(`/training/${req.params.id}`);
//   }
// };

const TrainingRequirement = require("../models/TrainingRequirement");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyObservation = require("../models/SafetyObservation");
const User = require("../models/User");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Show generate form
exports.showGenerateForm = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const workArea = await WorkArea.findById(workAreaId).populate("worksite");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    res.render("training/generate", {
      user: req.user,
      workArea,
      categories: [
        { value: "safety_induction", label: "Safety Induction" },
        { value: "equipment_operation", label: "Equipment Operation" },
        { value: "hazard_specific", label: "Hazard-Specific Training" },
        { value: "emergency_response", label: "Emergency Response" },
        { value: "first_aid", label: "First Aid / CPR" },
        { value: "legal_compliance", label: "Legal Compliance" },
        { value: "refresher", label: "Refresher Training" },
        { value: "supervisory", label: "Supervisory Training" },
        { value: "specialized", label: "Specialized Skills" },
      ],
    });
  } catch (error) {
    console.error("Error loading generate form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

// Generate training requirements using AI
exports.generateTrainingRequirement = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const { category, title, priority } = req.body;

    const workArea = await WorkArea.findById(workAreaId)
      .populate("worksite")
      .populate("identifiedHazards");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    // Get data for AI context
    const recentIncidents = await Incident.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(15);

    const recentRiskAssessments = await RiskAssessment.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentObservations = await SafetyObservation.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const activeHazards =
      workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

    // Get worker count
    const workerCount = await User.countDocuments({
      role: "worker",
      workArea: workAreaId,
      isActive: true,
    });

    // Build AI prompt
    const prompt = `You are a senior safety training specialist. Generate a comprehensive training requirement for a work area.

## WORK AREA CONTEXT:
- Name: ${workArea.name}
- Worksite: ${workArea.worksite?.name || "N/A"}
- Work Types: ${workArea.currentWorkTypes?.map((w) => w.workType).join(", ") || "Various"}
- Worker Count: ${workerCount}

## TRAINING CATEGORY: ${category}
${title ? `- Custom Title: ${title}` : ""}
- Priority: ${priority || "medium"}

## ACTIVE HAZARDS:
${activeHazards.map((h) => `- ${h.hazard} (Risk: ${h.riskLevel})`).join("\n") || "No specific hazards"}

## RECENT INCIDENTS (last 30 days):
${recentIncidents.map((i) => `- [${i.type}] ${i.description?.substring(0, 100)}`).join("\n") || "No recent incidents"}

## RECENT RISK ASSESSMENT FINDINGS:
${recentRiskAssessments.map((ra) => `- ${ra.title}: ${ra.overallFindings?.substring(0, 100) || ""}`).join("\n") || "No recent assessments"}

## RECENT SAFETY OBSERVATIONS:
${recentObservations.map((o) => `- ${o.type}: ${o.description?.substring(0, 100)}`).join("\n") || "No recent observations"}

## YOUR TASK:
Generate a detailed training requirement based on the data above.

Return ONLY valid JSON with this structure:
{
  "title": "Training title",
  "description": "Detailed description of what this training covers",
  "requiredForRoles": ["Role 1", "Role 2"],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "duration": "X hours/days",
  "certificationRequired": true,
  "certificationExpiry": 12,
  "refresherFrequency": "annually",
  "regulatoryReference": "OHS Act Section X or ISO Standard"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0].message.content;
    let trainingData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      trainingData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      trainingData = {};
    }

    // Create training requirement
    const trainingReq = new TrainingRequirement({
      workArea: workAreaId,
      title:
        trainingData.title ||
        title ||
        `${category.replace(/_/g, " ")} Training - ${workArea.name}`,
      description: trainingData.description || "",
      category,
      priority: priority || "medium",
      requiredForRoles: trainingData.requiredForRoles || ["All workers"],
      prerequisites: trainingData.prerequisites || [],
      learningObjectives: trainingData.learningObjectives || [],
      keyTopics: trainingData.keyTopics || [],
      duration: trainingData.duration || "2 hours",
      certificationRequired: trainingData.certificationRequired || false,
      certificationExpiry: trainingData.certificationExpiry || 12,
      refresherFrequency: trainingData.refresherFrequency || "annually",
      workerCount,
      basedOn: {
        hazards: activeHazards.map((h) => h.hazardId),
        incidents: recentIncidents.map((i) => i._id),
        riskAssessments: recentRiskAssessments.map((ra) => ra._id),
        observations: recentObservations.map((o) => o._id),
        regulatoryReference: trainingData.regulatoryReference || "",
        aiReasoning:
          "Generated based on work area hazards, incidents, and risk assessments",
      },
      aiGenerated: true,
      aiModel: "gpt-3.5-turbo-16k",
      generatedBy: req.user.safetyOfficer,
      createdBy: req.user.safetyOfficer,
      status: "published",
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    await trainingReq.save();

    req.flash("success", `Training requirement generated successfully!`);
    res.redirect(`/training/${trainingReq._id}`);
  } catch (error) {
    console.error("Error generating training requirement:", error);
    req.flash(
      "error",
      "Error generating training requirement: " + error.message,
    );
    res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// View training requirement
exports.getTrainingRequirement = async (req, res) => {
  try {
    const training = await TrainingRequirement.findById(req.params.id)
      .populate("workArea", "name worksite")
      .populate("targetWorkers.workerId", "name email workerNumber")
      .populate("generatedBy", "name")
      .populate("createdBy", "name");

    if (!training) {
      req.flash("error", "Training requirement not found");
      return res.redirect("/dashboard");
    }

    // Calculate compliance rate
    const totalWorkers = training.workerCount || 1;
    const completedCount = training.targetWorkers.filter(
      (w) => w.completed,
    ).length;
    training.complianceRate = Math.round((completedCount / totalWorkers) * 100);
    await training.save();

    res.render("training/view", {
      user: req.user,
      training,
    });
  } catch (error) {
    console.error("Error viewing training requirement:", error);
    req.flash("error", "Error loading training requirement");
    res.redirect("/dashboard");
  }
};

// List training requirements for work area
exports.getWorkAreaTraining = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const trainings = await TrainingRequirement.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, trainings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark worker as completed training
exports.markComplete = async (req, res) => {
  try {
    const training = await TrainingRequirement.findById(req.params.id);
    if (!training) {
      req.flash("error", "Training requirement not found");
      return res.redirect("/dashboard");
    }

    const { workerId, workerName, certificateUrl } = req.body;

    // Check if worker already exists
    const existingIndex = training.targetWorkers.findIndex(
      (w) => w.workerId && w.workerId.toString() === workerId,
    );

    const expiryDate = new Date();
    expiryDate.setMonth(
      expiryDate.getMonth() + (training.certificationExpiry || 12),
    );

    const completionData = {
      workerId: workerId || null,
      name: workerName,
      completed: true,
      completedDate: new Date(),
      certificateUrl: certificateUrl || "",
      expiryDate: training.certificationRequired ? expiryDate : null,
    };

    if (existingIndex >= 0) {
      training.targetWorkers[existingIndex] = completionData;
    } else {
      training.targetWorkers.push(completionData);
    }

    // Update compliance rate
    const completedCount = training.targetWorkers.filter(
      (w) => w.completed,
    ).length;
    training.complianceRate = Math.round(
      (completedCount / (training.workerCount || 1)) * 100,
    );

    await training.save();

    req.flash("success", "Training marked as complete!");
    res.redirect(`/training/${training._id}`);
  } catch (error) {
    console.error("Error marking complete:", error);
    req.flash("error", "Error updating training status");
    res.redirect(`/training/${req.params.id}`);
  }
};
