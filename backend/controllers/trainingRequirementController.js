const TrainingRequirement = require("../models/TrainingRequirement");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyObservation = require("../models/SafetyObservation");
const User = require("../models/User");
const { OpenAI } = require("openai");
const {
  generateTrainingWordBuffer,
} = require("../utils/trainingWordGenerator");
const { AI_MODEL, AI_MAX_TOKENS } = require("../utils/aiConfig");
const { approveReviewedDocument, ensureReviewable, isApproved, recordRevision, regenerateStructuredOutput, trackAiCompletion } = require("../utils/aiReview");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const trainingCategories = [
  { value: "safety_induction", label: "Safety Induction" },
  { value: "equipment_operation", label: "Equipment Operation" },
  { value: "hazard_specific", label: "Hazard-Specific Training" },
  { value: "emergency_response", label: "Emergency Response" },
  { value: "first_aid", label: "First Aid / CPR" },
  { value: "legal_compliance", label: "Legal Compliance" },
  { value: "refresher", label: "Refresher Training" },
  { value: "supervisory", label: "Supervisory Training" },
  { value: "specialized", label: "Specialized Skills" },
];

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
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (innerError) {
      console.error("Failed to parse training AI JSON:", innerError.message);
      return {};
    }
  }
}

// Show generate form
exports.showGenerateForm = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const workArea = await WorkArea.findById(workAreaId);

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    res.render("training/generate", {
      user: req.user,
      workArea,
      categories: trainingCategories,
    });
  } catch (error) {
    console.error("Error loading generate form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

// Generate AI training requirement
exports.generateTrainingRequirement = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const { title, priority } = req.body;

    let selectedCategories = req.body.categories || req.body.category || [];

    if (!Array.isArray(selectedCategories)) {
      selectedCategories = selectedCategories ? [selectedCategories] : [];
    }

    const selectedCategoryLabels =
      selectedCategories.length > 0
        ? trainingCategories
            .filter((cat) => selectedCategories.includes(cat.value))
            .map((cat) => cat.label)
            .join(", ")
        : "AI to determine based on hazards and safety data";

    const primaryCategory = selectedCategories[0] || "hazard_specific";

    const workArea = await WorkArea.findById(workAreaId)
      .populate("identifiedHazards");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

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

    const workerCount = await User.countDocuments({
      role: "worker",
      workArea: workAreaId,
      isActive: true,
    });

    const workTypes =
      workArea.currentWorkTypes
        ?.map((w) => w.workType || w)
        .filter(Boolean)
        .join(", ") || "Various";

    const prompt = `You are a senior safety training specialist. Generate AI-recommended training requirements for a work area.

WORK AREA CONTEXT:
- Name: ${workArea.name}
- Location: ${workArea.location?.zone || "N/A"}
- Work Types: ${workTypes}
- Worker Count: ${workerCount}
- Selected Categories: ${selectedCategoryLabels}
${title ? `- Custom Title Direction: ${title}` : ""}
- Priority: ${priority || "medium"}

ACTIVE HAZARDS:
${
  activeHazards.length > 0
    ? activeHazards
        .map((h) => `- ${h.hazard} (Risk: ${h.riskLevel || "N/A"})`)
        .join("\n")
    : "No specific hazards"
}

RECENT INCIDENTS:
${
  recentIncidents.length > 0
    ? recentIncidents
        .map((i) => `- [${i.type}] ${safeText(i.description, 160)}`)
        .join("\n")
    : "No recent incidents"
}

RECENT RISK ASSESSMENT FINDINGS:
${
  recentRiskAssessments.length > 0
    ? recentRiskAssessments
        .map(
          (ra) =>
            `- ${ra.title}: ${safeText(ra.overallFindings || ra.summary || "", 160)}`,
        )
        .join("\n")
    : "No recent assessments"
}

RECENT SAFETY OBSERVATIONS:
${
  recentObservations.length > 0
    ? recentObservations
        .map((o) => `- ${o.type}: ${safeText(o.description, 160)}`)
        .join("\n")
    : "No recent observations"
}

TASK:
Generate a practical training requirement document. It should contain a list of all recommended trainings for this work area, not compliance tracking.

Return ONLY valid JSON in this exact structure:
{
  "title": "Training title",
  "description": "Overall description of why these trainings are recommended",
  "category": "one of: safety_induction, equipment_operation, hazard_specific, emergency_response, first_aid, legal_compliance, refresher, supervisory, specialized",
  "requiredForRoles": ["Role 1", "Role 2"],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "learningObjectives": ["Objective 1", "Objective 2"],
  "keyTopics": ["Topic 1", "Topic 2"],
  "duration": "Estimated total training time",
  "certificationRequired": true,
  "certificationExpiry": 12,
  "refresherFrequency": "annually",
  "regulatoryReference": "Applicable regulation or standard if known",
  "recommendedTrainings": [
    {
      "trainingTitle": "Specific recommended training",
      "category": "hazard_specific",
      "priority": "critical | high | medium | low",
      "targetRoles": ["Workers", "Supervisors"],
      "duration": "2 hours",
      "reason": "Why this training is needed",
      "keyTopics": ["Topic A", "Topic B"],
      "verificationMethod": "How officer can confirm training was delivered"
    }
  ],
  "trainingChecklist": [
    {
      "checkItem": "Training item to verify",
      "passCriteria": "What must be confirmed"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: AI_MAX_TOKENS.trainingRequirement,
    });

    const aiResponse = completion.choices[0].message.content;
    const trainingData = parseAIJson(aiResponse);

    const trainingReq = new TrainingRequirement({
      workArea: workAreaId,
      title:
        trainingData.title ||
        title ||
        `Training Requirements - ${workArea.name}`,
      description: trainingData.description || "",
      category: trainingData.category || primaryCategory,
      priority: priority || trainingData.priority || "medium",
      requiredForRoles: trainingData.requiredForRoles || ["All workers"],
      prerequisites: trainingData.prerequisites || [],
      learningObjectives: trainingData.learningObjectives || [],
      keyTopics: trainingData.keyTopics || [],
      duration: trainingData.duration || "To be determined by Safety Officer",
      certificationRequired: trainingData.certificationRequired || false,
      certificationExpiry: trainingData.certificationExpiry || 12,
      refresherFrequency: trainingData.refresherFrequency || "annually",
      workerCount,
      basedOn: {
        hazards: activeHazards.map((h) => h._id).filter(Boolean),
        incidents: recentIncidents.map((i) => i._id),
        riskAssessments: recentRiskAssessments.map((ra) => ra._id),
        observations: recentObservations.map((o) => o._id),
        regulatoryReference: trainingData.regulatoryReference || "",
        aiReasoning:
          "Generated based on selected categories, work area hazards, incidents, observations, and risk assessments.",
      },

      // These two fields work even if your schema is strict:false.
      // If your schema is strict:true and they do not save, add them to the schema below.
      recommendedTrainings: trainingData.recommendedTrainings || [],
      trainingChecklist: trainingData.trainingChecklist || [],

      aiGenerated: true,
      aiModel: AI_MODEL,
      generatedBy: req.user._id,
      createdBy: req.user._id,
      status: "draft",
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await trainingReq.save();
    await trackAiCompletion({
      completion,
      user: req.user._id,
      workArea: workAreaId,
      module: "training_requirement",
      description: "Training requirements generated",
      relatedModel: "TrainingRequirement",
      relatedId: trainingReq._id,
      maxTokens: AI_MAX_TOKENS.trainingRequirement,
    });

    req.flash("success", "Training requirements generated successfully!");
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
      .populate("workArea", "name")
      .populate("targetWorkers.workerId", "name email workerNumber")
      .populate("generatedBy", "name")
      .populate("createdBy", "name");

    if (!training) {
      req.flash("error", "Training requirement not found");
      return res.redirect("/dashboard");
    }

    // No compliance calculation here.
    // This view is now a recommended training list + Word checklist download.

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

// Optional legacy function
exports.markComplete = async (req, res) => {
  try {
    const training = await TrainingRequirement.findById(req.params.id);

    if (!training) {
      req.flash("error", "Training requirement not found");
      return res.redirect("/dashboard");
    }

    training.status = "completed";
    training.completedDate = new Date();

    await training.save();

    req.flash("success", "Training marked as completed!");
    res.redirect(`/training/${training._id}`);
  } catch (error) {
    console.error("Error marking complete:", error);
    req.flash("error", "Error updating training status");
    res.redirect(`/training/${req.params.id}`);
  }
};

exports.regenerateWithComments = async (req, res) => {
  try {
    const training = await TrainingRequirement.findById(req.params.id);
    if (!training) return res.status(404).send("Training requirement not found");

    ensureReviewable(training);
    const previousOutput = {
      title: training.title,
      description: training.description,
      category: training.category,
      priority: training.priority,
      requiredForRoles: training.requiredForRoles,
      prerequisites: training.prerequisites,
      learningObjectives: training.learningObjectives,
      keyTopics: training.keyTopics,
      duration: training.duration,
      certificationRequired: training.certificationRequired,
      certificationExpiry: training.certificationExpiry,
      refresherFrequency: training.refresherFrequency,
      recommendedTrainings: training.recommendedTrainings,
      trainingChecklist: training.trainingChecklist,
    };
    const revision = await regenerateStructuredOutput({
      currentOutput: previousOutput,
      comments: req.body.reviewComments,
      documentType: "training requirements document",
      maxTokens: AI_MAX_TOKENS.trainingRequirement,
      user: req.user._id,
      workArea: training.workArea,
      relatedModel: "TrainingRequirement",
      relatedId: training._id,
    });

    Object.assign(training, revision.output);
    training.aiModel = AI_MODEL;
    training.status = "draft";
    recordRevision(training, {
      comments: revision.comments,
      previousOutput,
      submittedBy: req.user._id,
    });
    await training.save();

    req.flash("success", "Training requirements regenerated for review");
    return res.redirect(`/training/${training._id}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/training/${req.params.id}`);
  }
};

exports.approveTraining = async (req, res) => {
  try {
    const training = await TrainingRequirement.findById(req.params.id);
    if (!training) return res.status(404).send("Training requirement not found");
    approveReviewedDocument(training, req.user._id);
    training.status = "published";
    await training.save();
    req.flash("success", "Training requirements approved and locked");
    return res.redirect(`/training/${training._id}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/training/${req.params.id}`);
  }
};

// Download editable Word checklist
exports.downloadWord = async (req, res) => {
  try {
    const { id } = req.params;

    const training = await TrainingRequirement.findById(id)
      .populate("workArea", "name")
      .populate("generatedBy", "name")
      .populate("createdBy", "name");

    if (!training) {
      return res.status(404).send("Training requirement not found");
    }

    if (!isApproved(training)) {
      req.flash("error", "Approve the final training requirements before downloading them");
      return res.redirect(`/training/${training._id}`);
    }

    const buffer = await generateTrainingWordBuffer({ training });

    const safeNumber = training.requirementNumber || Date.now();
    const fileName = `training_requirements_${safeNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading Training Word document:", error);
    return res.status(500).send("Error generating Training Word document");
  }
};

