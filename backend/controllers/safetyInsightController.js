const SafetyInsight = require("../models/SafetyInsight");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const SafetyObservation = require("../models/SafetyObservation");
const RiskAssessment = require("../models/RiskAssessment");
const JSA = require("../models/JSA");
const SafetyTalk = require("../models/SafetyTalk");
const { OpenAI } = require("openai");
const {
  generateSafetyInsightWordBuffer,
} = require("../utils/safetyInsightWordGenerator");
const { AI_MODEL, AI_MAX_TOKENS } = require("../utils/aiConfig");
const { approveReviewedDocument, ensureReviewable, isApproved, recordRevision, regenerateStructuredOutput, trackAiCompletion } = require("../utils/aiReview");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeText(value, max = 300) {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").substring(0, max);
}

function parseJsonFromAI(text) {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI JSON parse failed:", error.message);

    return {
      title: "AI Safety Insight Report",
      summary:
        "The system generated safety insight content but could not fully parse the structured response.",
      priorityLevel: "medium",
      recommendedFocusAreas: ["General site safety review"],
      safetyConcernsAndObservations: text,
      actionableRecommendations:
        "Safety Officer should review the generated insight and determine priority actions.",
      recommendedDocumentActions: {
        regenerateRiskAssessment: false,
        reviewRiskAssessment: true,
        generateOrReviewJSA: false,
        generateSafetyTalk: true,
        reviewCorrectiveActions: true,
      },
    };
  }
}

// Generate AI Safety Insight for one work area
exports.generateSafetyInsight = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const workArea = await WorkArea.findById(workAreaId);

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const incidents = await Incident.find({
      workArea: workAreaId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const safetyObservations = await SafetyObservation.find({
      workArea: workAreaId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate("observedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(30);

    const riskAssessments = await RiskAssessment.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const jsas = await JSA.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const safetyTalks = await SafetyTalk.find({
      targetWorkAreas: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const activeHazards =
      workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

    const nearMisses = incidents.filter((i) => i.type === "near_miss");
    const actualIncidents = incidents.filter((i) => i.type === "incident");
    const highSeverityIncidents = incidents.filter((i) =>
      ["high", "critical", "fatality"].includes(i.severity),
    );

    const atRiskObservations = safetyObservations.filter(
      (obs) => obs.type === "at_risk" || obs.type === "condition",
    );

    const positiveObservations = safetyObservations.filter(
      (obs) => obs.type === "positive",
    );

    const prompt = `
You are an experienced Health, Safety and Environment Manager. You are generating a fully AI-created Safety Insight Report for a work area.

This document must not ask for human input. It should identify emerging patterns, repeated issues, weak controls, positive trends, and areas requiring attention.

WORK AREA:
Name: ${workArea.name}
Location: ${workArea.location?.zone || "N/A"}
Status: ${workArea.status || "N/A"}
Description: ${safeText(workArea.description, 500)}
Current Work Types: ${
      workArea.currentWorkTypes?.map((w) => w.workType || w).join(", ") ||
      "Not specified"
    }

ACTIVE HAZARDS:
${
  activeHazards.length > 0
    ? activeHazards
        .map((h) => `- ${h.hazard} | Risk Level: ${h.riskLevel || "N/A"}`)
        .join("\n")
    : "No active hazards listed."
}

RECENT INCIDENTS AND NEAR MISSES - LAST 90 DAYS:
${
  incidents.length > 0
    ? incidents
        .map(
          (i) => `
- Incident #${i.incidentNumber || "N/A"}
  Type: ${i.type}
  Severity: ${i.severity}
  Status: ${i.status}
  Work Type: ${i.workTypeAtTime || "N/A"}
  Location: ${i.location || "N/A"}
  Description: ${safeText(i.description, 300)}
  Immediate Action: ${safeText(i.immediateAction, 200)}
  Root Cause: ${safeText(i.investigation?.rootCause, 200)}
  Findings: ${safeText(i.investigation?.findings, 250)}
  Lessons Learned: ${safeText(i.lessonsLearned, 250)}
`,
        )
        .join("\n")
    : "No recent incidents or near misses recorded."
}

RECENT SAFETY OBSERVATIONS - LAST 90 DAYS:
${
  safetyObservations.length > 0
    ? safetyObservations
        .map(
          (obs) => `
- Observation Type: ${obs.type}
  Status: ${obs.status}
  Description: ${safeText(obs.description, 300)}
  Recommendation: ${safeText(obs.recommendations, 250)}
  Corrective Action: ${safeText(obs.correctiveActions, 250)}
`,
        )
        .join("\n")
    : "No recent safety observations recorded."
}

RECENT RISK ASSESSMENTS:
${
  riskAssessments.length > 0
    ? riskAssessments
        .map(
          (ra) => `
- ${ra.title}
  Status: ${ra.status}
  Date: ${ra.assessmentDate ? new Date(ra.assessmentDate).toDateString() : "N/A"}
  Summary: ${safeText(ra.summary || ra.overallFindings, 300)}
`,
        )
        .join("\n")
    : "No recent risk assessments found."
}

RECENT JSAs:
${
  jsas.length > 0
    ? jsas
        .map(
          (j) => `
- ${j.jobTask || j.title}
  Status: ${j.status}
  Date: ${j.date ? new Date(j.date).toDateString() : "N/A"}
`,
        )
        .join("\n")
    : "No recent JSAs found."
}

RECENT SAFETY TALKS:
${
  safetyTalks.length > 0
    ? safetyTalks
        .map(
          (t) => `
- ${t.title}
  Status: ${t.status}
  Date: ${t.date ? new Date(t.date).toDateString() : "N/A"}
  Topics: ${t.topics?.join(", ") || "N/A"}
`,
        )
        .join("\n")
    : "No recent safety talks found."
}

DATA COUNTS:
- Total incidents/near misses: ${incidents.length}
- Actual incidents: ${actualIncidents.length}
- Near misses: ${nearMisses.length}
- High severity incidents: ${highSeverityIncidents.length}
- Safety observations: ${safetyObservations.length}
- At-risk/condition observations: ${atRiskObservations.length}
- Positive observations: ${positiveObservations.length}
- Risk assessments: ${riskAssessments.length}
- JSAs: ${jsas.length}
- Safety talks: ${safetyTalks.length}

TASK:
Generate a management-level Safety Insight Report with exactly two major parts:

PART 1: Comprehensive Site-Wide Safety Concerns and Observations
- Identify emerging patterns
- Identify repeated unsafe conditions or behaviors
- Identify weak controls
- Identify positive safety indicators if any
- Mention whether the current safety state appears stable, deteriorating, or improving
- Focus on practical safety management interpretation

PART 2: Actionable Recommendations
- Give clear recommended actions
- State areas requiring immediate attention
- State whether a risk assessment should be reviewed or regenerated
- State whether a JSA should be reviewed or created
- State whether a safety talk should be generated
- State whether corrective actions should be escalated
- Keep recommendations practical and simple

Return ONLY valid JSON in this exact shape:
{
  "title": "string",
  "summary": "string",
  "priorityLevel": "low | medium | high | critical",
  "recommendedFocusAreas": ["string"],
  "safetyConcernsAndObservations": "string",
  "actionableRecommendations": "string",
  "recommendedDocumentActions": {
    "regenerateRiskAssessment": true/false,
    "reviewRiskAssessment": true/false,
    "generateOrReviewJSA": true/false,
    "generateSafetyTalk": true/false,
    "reviewCorrectiveActions": true/false
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: AI_MAX_TOKENS.safetyInsight,
    });

    const aiText = completion.choices[0].message.content;
    const parsed = parseJsonFromAI(aiText);

    const insight = new SafetyInsight({
      workArea: workAreaId,
      title:
        parsed.title ||
        `AI Safety Insight - ${workArea.name} - ${new Date().toLocaleDateString()}`,
      summary: parsed.summary || "",
      priorityLevel: parsed.priorityLevel || "medium",
      recommendedFocusAreas: parsed.recommendedFocusAreas || [],
      safetyConcernsAndObservations:
        parsed.safetyConcernsAndObservations || "No safety concerns generated.",
      actionableRecommendations:
        parsed.actionableRecommendations || "No recommendations generated.",
      recommendedDocumentActions: {
        regenerateRiskAssessment:
          parsed.recommendedDocumentActions?.regenerateRiskAssessment || false,
        reviewRiskAssessment:
          parsed.recommendedDocumentActions?.reviewRiskAssessment || false,
        generateOrReviewJSA:
          parsed.recommendedDocumentActions?.generateOrReviewJSA || false,
        generateSafetyTalk:
          parsed.recommendedDocumentActions?.generateSafetyTalk || false,
        reviewCorrectiveActions:
          parsed.recommendedDocumentActions?.reviewCorrectiveActions || false,
      },
      evidenceUsed: {
        incidents: incidents.map((i) => i._id),
        safetyObservations: safetyObservations.map((o) => o._id),
        riskAssessments: riskAssessments.map((r) => r._id),
        jsas: jsas.map((j) => j._id),
        safetyTalks: safetyTalks.map((t) => t._id),
      },
      dataCounts: {
        incidents: incidents.length,
        nearMisses: nearMisses.length,
        observations: safetyObservations.length,
        atRiskObservations: atRiskObservations.length,
        positiveObservations: positiveObservations.length,
        riskAssessments: riskAssessments.length,
        jsas: jsas.length,
        safetyTalks: safetyTalks.length,
      },
      periodCovered: {
        startDate,
        endDate,
        label: "Last 90 days",
      },
      generatedBy: req.user._id,
      aiGenerated: true,
      aiModel: AI_MODEL,
      status: "generated",
    });

    await insight.save();
    await trackAiCompletion({
      completion,
      user: req.user._id,
      workArea: workAreaId,
      module: "safety_insight",
      description: "AI safety insight generated",
      relatedModel: "SafetyInsight",
      relatedId: insight._id,
      maxTokens: AI_MAX_TOKENS.safetyInsight,
    });

    req.flash("success", "AI Safety Insight generated successfully.");
    return res.redirect(`/work-areas/${workAreaId}#insights`);
  } catch (error) {
    console.error("Error generating safety insight:", error);
    req.flash("error", "Failed to generate safety insight: " + error.message);
    return res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// Optional: view a full insight document
exports.getSafetyInsight = async (req, res) => {
  try {
    const insight = await SafetyInsight.findById(req.params.id)
      .populate("workArea", "name")
      .populate("generatedBy", "name")
      .populate("evidenceUsed.incidents", "incidentNumber type severity status")
      .populate("evidenceUsed.safetyObservations", "type status description")
      .populate("evidenceUsed.riskAssessments", "assessmentNumber title status")
      .populate("evidenceUsed.jsas", "jsaNumber jobTask status")
      .populate("evidenceUsed.safetyTalks", "talkNumber title status");

    if (!insight) {
      req.flash("error", "Safety insight not found");
      return res.redirect("/dashboard");
    }

    res.render("safety-insights/view", {
      user: req.user,
      insight,
    });
  } catch (error) {
    console.error("Error viewing safety insight:", error);
    req.flash("error", "Error loading safety insight.");
    res.redirect("/dashboard");
  }
};

exports.regenerateWithComments = async (req, res) => {
  try {
    const insight = await SafetyInsight.findById(req.params.id);
    if (!insight) return res.status(404).send("Safety insight not found");

    ensureReviewable(insight);
    const previousOutput = {
      title: insight.title,
      summary: insight.summary,
      priorityLevel: insight.priorityLevel,
      recommendedFocusAreas: insight.recommendedFocusAreas,
      safetyConcernsAndObservations: insight.safetyConcernsAndObservations,
      actionableRecommendations: insight.actionableRecommendations,
      recommendedDocumentActions: insight.recommendedDocumentActions,
    };
    const revision = await regenerateStructuredOutput({
      currentOutput: previousOutput,
      comments: req.body.reviewComments,
      documentType: "safety insight report",
      maxTokens: AI_MAX_TOKENS.safetyInsight,
      user: req.user._id,
      workArea: insight.workArea,
      relatedModel: "SafetyInsight",
      relatedId: insight._id,
    });

    Object.assign(insight, revision.output);
    insight.aiModel = AI_MODEL;
    insight.status = "generated";
    recordRevision(insight, {
      comments: revision.comments,
      previousOutput,
      submittedBy: req.user._id,
    });
    await insight.save();
    await trackAiCompletion({
      completion,
      user: req.user._id,
      workArea: workAreaId,
      module: "safety_insight",
      description: "Safety insight generated",
      relatedModel: "SafetyInsight",
      relatedId: insight._id,
      maxTokens: AI_MAX_TOKENS.safetyInsight,
    });

    req.flash("success", "Safety insight regenerated for review");
    return res.redirect(`/safety-insights/${insight._id}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/safety-insights/${req.params.id}`);
  }
};

exports.approveInsight = async (req, res) => {
  try {
    const insight = await SafetyInsight.findById(req.params.id);
    if (!insight) return res.status(404).send("Safety insight not found");
    approveReviewedDocument(insight, req.user._id);
    insight.status = "reviewed";
    await insight.save();
    req.flash("success", "Safety insight approved and locked");
    return res.redirect(`/safety-insights/${insight._id}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/safety-insights/${req.params.id}`);
  }
};

exports.downloadWord = async (req, res) => {
  try {
    const { id } = req.params;

    const insight = await SafetyInsight.findById(id)
      .populate("workArea", "name")
      .populate("generatedBy", "name")
      .populate("evidenceUsed.incidents", "incidentNumber type severity status")
      .populate("evidenceUsed.safetyObservations", "type status description")
      .populate("evidenceUsed.riskAssessments", "assessmentNumber title status")
      .populate("evidenceUsed.jsas", "jsaNumber jobTask status")
      .populate("evidenceUsed.safetyTalks", "talkNumber title status");

    if (!insight) {
      return res.status(404).send("Safety insight not found");
    }

    if (!isApproved(insight)) {
      req.flash("error", "Approve the final safety insight before downloading it");
      return res.redirect(`/safety-insights/${insight._id}`);
    }

    const buffer = await generateSafetyInsightWordBuffer({ insight });

    const safeNumber = insight.insightNumber || Date.now();
    const fileName = `ai_safety_insight_${safeNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading Safety Insight Word document:", error);
    return res
      .status(500)
      .send("Error generating Safety Insight Word document");
  }
};

