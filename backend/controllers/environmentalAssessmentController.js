const EnvironmentalAssessment = require("../models/EnvironmentalAssessment");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const SafetyObservation = require("../models/SafetyObservation");
const { OpenAI } = require("openai");
const {
  professionalSafetyGuidance,
  miningContextGuidance,
} = require("../utils/aiPromptGuidance");
const { trackUsage } = require("../utils/usageTracker");
const {
  generateEnvironmentalAssessmentWordBuffer,
} = require("../utils/environmentalAssessmentWordGenerator");
const { AI_MODEL, AI_MAX_TOKENS } = require("../utils/aiConfig");
const { approveReviewedDocument, ensureReviewable, isApproved, recordRevision, regenerateStructuredOutput } = require("../utils/aiReview");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeText(value, max = 250) {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").substring(0, max);
}

function parseAIJson(text) {
  try {
    return JSON.parse(
      text.replace(/```json/g, "").replace(/```/g, "").trim(),
    );
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return {};
  }
}

exports.showGenerateForm = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.workAreaId);

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard/officer");
    }

    res.render("environmental-assessments/generate", {
      user: req.user,
      workArea,
    });
  } catch (error) {
    console.error("Error loading environmental form:", error);
    req.flash("error", "Error loading environmental assessment form");
    res.redirect("/dashboard/officer");
  }
};

exports.generateAssessment = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const { title, activityDescription } = req.body;

    const workArea = await WorkArea.findById(workAreaId);

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard/officer");
    }

    const environmentalIncidents = await Incident.find({
      workArea: workAreaId,
      type: "environmental",
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const observations = await SafetyObservation.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(10);

    const activeEnvironmentalConcerns =
      workArea.concernsRegister?.filter(
        (concern) => concern.category === "environmental",
      ) || [];

    const prompt = `
You are an experienced environmental practitioner preparing a practical Environmental Screening and Impact Register for a mining or heavy-industry work area.

${professionalSafetyGuidance}
${miningContextGuidance}

This is a first-launch screening tool, not a final statutory EIA submission. Do not claim regulatory approval. Identify likely impacts, mitigation, monitoring, and evidence gaps for professional review.

WORK AREA:
Name: ${workArea.name}
Location: ${workArea.location?.zone || "N/A"}
Description: ${safeText(workArea.description, 500)}
Activity description: ${safeText(activityDescription, 1200)}

WORK AREA ENVIRONMENTAL CONTEXT:
Known environmental concerns: ${(workArea.concernsRegister || []).filter((concern) => concern.category === "environmental").map((concern) => concern.concern).join("; ") || "None recorded"}
PPE/environmental notes: ${workArea.aiContext?.ppeStatusSummary || "Not specified"}

RECENT ENVIRONMENTAL INCIDENTS:
${
  environmentalIncidents.length
    ? environmentalIncidents
        .map((incident) => `- ${safeText(incident.description, 250)} | Severity: ${incident.severity}`)
        .join("\n")
    : "No environmental incidents recorded."
}

OBSERVATIONS:
${
  observations.length
    ? observations
        .map((obs) => `- ${obs.type}: ${safeText(obs.description, 180)}`)
        .join("\n")
    : "No recent observations recorded."
}

ACTIVE ENVIRONMENTAL CONCERNS:
${
  activeEnvironmentalConcerns.length
    ? activeEnvironmentalConcerns
        .map((concern) => `- ${safeText(concern.concern, 180)} | Risk: ${concern.riskAssessment?.riskLevel || "N/A"}`)
        .join("\n")
    : "No active environmental concerns listed."
}

Return ONLY valid JSON in this exact structure:
{
  "title": "string",
  "receptors": [
    {
      "type": "water | air | soil | biodiversity | noise_vibration | waste | community | heritage | other",
      "description": "string",
      "sensitivity": "low | medium | high | critical"
    }
  ],
  "impacts": [
    {
      "impact": "string",
      "receptor": "string",
      "nature": "negative | positive | mixed",
      "likelihood": "rare | unlikely | possible | likely | almost_certain",
      "severity": "low | medium | high | critical",
      "duration": "short_term | medium_term | long_term | permanent",
      "reversibility": "reversible | partly_reversible | irreversible",
      "riskLevel": "low | medium | high | critical",
      "mitigationMeasures": ["string"],
      "monitoringRequirements": ["string"],
      "responsiblePerson": "string"
    }
  ],
  "aiSummary": {
    "executiveSummary": "string",
    "keyRisks": ["string"],
    "recommendedActions": ["string"],
    "monitoringPlan": ["string"],
    "assumptionsAndGaps": ["string"]
  }
}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35,
      max_tokens: AI_MAX_TOKENS.environmentalAssessment,
    });

    const parsed = parseAIJson(completion.choices[0].message.content);

    const assessment = new EnvironmentalAssessment({
      workArea: workArea._id,
      title: parsed.title || title || `Environmental Screening - ${workArea.name}`,
      activityDescription,
      receptors: parsed.receptors || [],
      impacts: parsed.impacts || [],
      aiSummary: parsed.aiSummary || {},
      aiGenerated: true,
      aiModel: AI_MODEL,
      generatedBy: req.user._id,
      createdBy: req.user._id,
    });

    await assessment.save();

    if (!workArea.documents) workArea.documents = {};
    if (!workArea.documents.environmentalAssessments) {
      workArea.documents.environmentalAssessments = [];
    }
    workArea.documents.environmentalAssessments.push(assessment._id);
    await workArea.save();

    await trackUsage({
      user: req.user._id,
      workArea: assessment.workArea,
      eventType: "environmental_assessment",
      module: "environmental",
      description: "Environmental assessment generated",
      relatedModel: "EnvironmentalAssessment",
      relatedId: assessment._id,
      metadata: {
        model: AI_MODEL,
        maxTokens: AI_MAX_TOKENS.environmentalAssessment,
        usage: completion.usage,
      },
    });

    req.flash(
      "success",
      "Environmental screening draft generated. Please review before use.",
    );
    res.redirect(`/environmental-assessments/${assessment._id}`);
  } catch (error) {
    console.error("Error generating environmental assessment:", error);
    req.flash("error", "Error generating environmental assessment: " + error.message);
    res.redirect(`/environmental-assessments/generate/${req.params.workAreaId}`);
  }
};

exports.viewAssessment = async (req, res) => {
  try {
    const assessment = await EnvironmentalAssessment.findById(req.params.id)
      .populate("workArea", "name")
      .populate("generatedBy", "name")
      .populate("approval.reviewedBy", "name");

    if (!assessment) {
      req.flash("error", "Environmental assessment not found");
      return res.redirect("/dashboard/officer");
    }

    res.render("environmental-assessments/view", {
      user: req.user,
      assessment,
    });
  } catch (error) {
    console.error("Error viewing environmental assessment:", error);
    req.flash("error", "Error loading environmental assessment");
    res.redirect("/dashboard/officer");
  }
};

exports.approveAssessment = async (req, res) => {
  try {
    const assessment = await EnvironmentalAssessment.findById(req.params.id);

    if (!assessment) {
      req.flash("error", "Environmental assessment not found");
      return res.redirect("/dashboard/officer");
    }

    approveReviewedDocument(assessment, req.user._id);
    assessment.approval.status = "approved";
    assessment.approval.reviewedBy = req.user._id;
    assessment.approval.reviewedAt = new Date();
    assessment.approval.comments = req.body?.comments || "";
    await assessment.save();

    req.flash("success", "Environmental assessment approved");
    res.redirect(`/environmental-assessments/${assessment._id}`);
  } catch (error) {
    console.error("Error approving environmental assessment:", error);
    req.flash("error", "Error approving environmental assessment");
    res.redirect(`/environmental-assessments/${req.params.id}`);
  }
};

exports.regenerateWithComments = async (req, res) => {
  try {
    const assessment = await EnvironmentalAssessment.findById(req.params.id);
    if (!assessment) return res.status(404).send("Environmental assessment not found");

    ensureReviewable(assessment);
    const previousOutput = {
      title: assessment.title,
      receptors: assessment.receptors,
      impacts: assessment.impacts,
      aiSummary: assessment.aiSummary,
    };
    const revision = await regenerateStructuredOutput({
      currentOutput: previousOutput,
      comments: req.body.reviewComments,
      documentType: "environmental screening and impact register",
      maxTokens: AI_MAX_TOKENS.environmentalAssessment,
      user: req.user._id,
      workArea: assessment.workArea,
      relatedModel: "EnvironmentalAssessment",
      relatedId: assessment._id,
      extraInstructions:
        "Keep this as a screening tool. Do not claim statutory or regulatory approval.",
    });

    assessment.title = revision.output.title || assessment.title;
    assessment.receptors = revision.output.receptors || assessment.receptors;
    assessment.impacts = revision.output.impacts || assessment.impacts;
    assessment.aiSummary = revision.output.aiSummary || assessment.aiSummary;
    assessment.aiModel = AI_MODEL;
    assessment.approval.status = "changes_required";
    recordRevision(assessment, {
      comments: revision.comments,
      previousOutput,
      submittedBy: req.user._id,
    });
    await assessment.save();

    req.flash("success", "Environmental assessment regenerated for review");
    return res.redirect(`/environmental-assessments/${assessment._id}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/environmental-assessments/${req.params.id}`);
  }
};

exports.downloadWord = async (req, res) => {
  try {
    const assessment = await EnvironmentalAssessment.findById(req.params.id)
      .populate("workArea", "name");

    if (!assessment) {
      return res.status(404).send("Environmental assessment not found");
    }

    if (!isApproved(assessment)) {
      req.flash("error", "Approve the final environmental assessment before downloading it");
      return res.redirect(`/environmental-assessments/${assessment._id}`);
    }

    const buffer = await generateEnvironmentalAssessmentWordBuffer({
      assessment,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="environmental_assessment_${assessment.assessmentNumber || Date.now()}.docx"`,
    );
    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading environmental assessment:", error);
    return res
      .status(500)
      .send("Error generating environmental assessment document");
  }
};

