const SafetyAuditScorecard = require("../models/SafetyAuditScorecard");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const SafetyObservation = require("../models/SafetyObservation");
const RiskAssessment = require("../models/RiskAssessment");
const JSA = require("../models/JSA");
const PPEChecklist = require("../models/PPEChecklist");
const TrainingRequirement = require("../models/TrainingRequirement");
const EmergencyProtocol = require("../models/EmergencyProtocol");
const SafetyTalk = require("../models/SafetyTalk");
const SafetyInsight = require("../models/SafetyInsight");
const Permit = require("../models/Permit");
const { OpenAI } = require("openai");
const {
  professionalSafetyGuidance,
  miningContextGuidance,
} = require("../utils/aiPromptGuidance");

const {
  generateSafetyAuditWordBuffer,
} = require("../utils/safetyAuditWordGenerator");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeText(value, max = 250) {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").substring(0, max);
}

function parseAIJson(text, fallback = {}) {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : fallback;
    } catch (innerError) {
      console.error("AI JSON parse failed:", innerError.message);
      return fallback;
    }
  }
}

function calculateGrade(score) {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "needs_improvement";
  if (score >= 40) return "weak";
  return "critical_attention_required";
}

function calculateRiskLevel(score) {
  if (score >= 90) return "low";
  if (score >= 75) return "medium";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

async function collectAuditData(workAreaId) {
  const workArea = await WorkArea.findById(workAreaId)
    .populate("activePermits");

  if (!workArea) {
    return null;
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

  const observations = await SafetyObservation.find({
    workArea: workAreaId,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .sort({ createdAt: -1 })
    .limit(30);

  const riskAssessments = await RiskAssessment.find({
    workArea: workAreaId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const jsas = await JSA.find({
    workArea: workAreaId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const ppeChecklists = await PPEChecklist.find({ workArea: workAreaId })
    .sort({ createdAt: -1 })
    .limit(10);

  const trainingRequirements = await TrainingRequirement.find({
    workArea: workAreaId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const emergencyProtocols = await EmergencyProtocol.find({
    workArea: workAreaId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const safetyTalks = await SafetyTalk.find({
    targetWorkAreas: workAreaId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const safetyInsights = await SafetyInsight.find({
    workArea: workAreaId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  const permits = await Permit.find({
    workArea: workAreaId,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    workArea,
    startDate,
    endDate,
    incidents,
    observations,
    riskAssessments,
    jsas,
    ppeChecklists,
    trainingRequirements,
    emergencyProtocols,
    safetyTalks,
    safetyInsights,
    permits,
  };
}

function buildEvidenceSummary(data) {
  const activeHazards =
    data.workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

  return `
WORK AREA:
Name: ${data.workArea.name}
Location: ${data.workArea.location?.zone || "N/A"}
Status: ${data.workArea.status || "N/A"}
Description: ${safeText(data.workArea.description, 500)}
Location: ${data.workArea.location?.zone || data.workArea.location || "N/A"}
Work Types: ${
    data.workArea.currentWorkTypes
      ?.map((w) => w.workType || w)
      .filter(Boolean)
      .join(", ") || "Various"
  }

ACTIVE HAZARDS:
${
  activeHazards.length > 0
    ? activeHazards
        .map((h) => `- ${h.hazard} | Risk: ${h.riskLevel || "N/A"}`)
        .join("\n")
    : "No active hazards listed."
}

INCIDENTS / NEAR MISSES:
${
  data.incidents.length > 0
    ? data.incidents
        .map(
          (i) => `
- Incident #${i.incidentNumber || "N/A"}
  Type: ${i.type}
  Severity: ${i.severity}
  Status: ${i.status}
  Description: ${safeText(i.description, 250)}
  Immediate Action: ${safeText(i.immediateAction, 180)}
  Root Cause: ${safeText(i.investigation?.rootCause, 180)}
  Findings: ${safeText(i.investigation?.findings, 180)}
`,
        )
        .join("\n")
    : "No incidents found in the audit period."
}

SAFETY OBSERVATIONS:
${
  data.observations.length > 0
    ? data.observations
        .map(
          (o) => `
- Type: ${o.type}
  Status: ${o.status}
  Description: ${safeText(o.description, 250)}
  Recommendations: ${safeText(o.recommendations, 180)}
  Corrective Actions: ${safeText(o.correctiveActions, 180)}
`,
        )
        .join("\n")
    : "No safety observations found."
}

RISK ASSESSMENTS:
${
  data.riskAssessments.length > 0
    ? data.riskAssessments
        .map(
          (r) => `
- ${r.title}
  Status: ${r.status}
  Date: ${r.assessmentDate ? new Date(r.assessmentDate).toDateString() : "N/A"}
  Summary: ${safeText(r.summary || r.overallFindings, 250)}
`,
        )
        .join("\n")
    : "No risk assessments found."
}

JSAs:
${
  data.jsas.length > 0
    ? data.jsas
        .map(
          (j) => `
- ${j.jobTask || j.title}
  Status: ${j.status}
  Date: ${j.date ? new Date(j.date).toDateString() : "N/A"}
`,
        )
        .join("\n")
    : "No JSAs found."
}

PPE CHECKLISTS:
${
  data.ppeChecklists.length > 0
    ? data.ppeChecklists
        .map(
          (p) => `
- ${p.title}
  Status: ${p.status}
  PPE Items: ${p.ppeItems?.length || 0}
`,
        )
        .join("\n")
    : "No PPE checklists found."
}

TRAINING REQUIREMENTS:
${
  data.trainingRequirements.length > 0
    ? data.trainingRequirements
        .map(
          (t) => `
- ${t.title}
  Priority: ${t.priority}
  Status: ${t.status}
  Category: ${t.category}
`,
        )
        .join("\n")
    : "No training requirements found."
}

EMERGENCY PROTOCOLS:
${
  data.emergencyProtocols.length > 0
    ? data.emergencyProtocols
        .map(
          (e) => `
- ${e.title}
  Priority: ${e.priorityLevel}
  Summary: ${safeText(e.summary, 220)}
`,
        )
        .join("\n")
    : "No emergency protocols found."
}

SAFETY TALKS:
${
  data.safetyTalks.length > 0
    ? data.safetyTalks
        .map(
          (s) => `
- ${s.title}
  Status: ${s.status}
  Topics: ${s.topics?.join(", ") || "N/A"}
`,
        )
        .join("\n")
    : "No safety talks found."
}

SAFETY INSIGHTS:
${
  data.safetyInsights.length > 0
    ? data.safetyInsights
        .map(
          (s) => `
- ${s.title}
  Priority: ${s.priorityLevel}
  Summary: ${safeText(s.summary, 220)}
`,
        )
        .join("\n")
    : "No safety insights found."
}

PERMITS:
${
  data.permits.length > 0
    ? data.permits
        .map(
          (p) => `
- ${p.title}
  Status: ${p.status}
  Valid To: ${p.validTo ? new Date(p.validTo).toDateString() : "N/A"}
`,
        )
        .join("\n")
    : "No permits found."
}
`;
}

// Stage 1: Generate AI audit interview questions
exports.generateAuditQuestions = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const data = await collectAuditData(workAreaId);

    if (!data) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    const evidenceSummary = buildEvidenceSummary(data);

    const prompt = `
You are an expert Health, Safety and Environment auditor conducting an AI-led work area safety audit interview.

${professionalSafetyGuidance}
${miningContextGuidance}

Your task is to analyze all available safety documents and records, then generate audit interview questions for the safety officer.

Do NOT calculate the safety score yet.

Generate questions grouped by safety area/document type:
- Risk Assessment Concerns
- JSA Concerns
- PPE Concerns
- Training Concerns
- Emergency Preparedness Concerns
- Safety Talks and Communication Concerns
- Incident and Near-Miss Management Concerns
- Safety Observation Concerns
- Permit-to-Work Concerns
- Safety Insight / Management Oversight Concerns

Questions must be based on:
1. Evidence found in the records
2. Missing evidence
3. Repeated concerns
4. Weak or unclear controls
5. Serious risks needing explanation

Keep the questions practical and audit-like.

AVAILABLE SAFETY DATA:
${evidenceSummary}

Return ONLY valid JSON in this exact shape:
{
  "title": "AI Safety Audit Interview - Work Area Name",
  "auditSections": [
    {
      "sectionName": "Risk Assessment Concerns",
      "sectionDescription": "Short description",
      "sourceDocuments": ["Risk Assessments", "Incidents", "Observations"],
      "questions": [
        {
          "questionText": "Question for the safety officer",
          "whyItMatters": "Why this question matters",
          "evidenceFound": "Evidence or gap that triggered this question",
          "concernLevel": "low | medium | high | critical",
          "expectedGoodResponse": "What a strong answer should mention"
        }
      ]
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 3500,
    });

    const aiText = completion.choices[0].message.content;

    const parsed = parseAIJson(aiText, {
      title: `AI Safety Audit Interview - ${data.workArea.name}`,
      auditSections: [],
    });

    const audit = new SafetyAuditScorecard({
      workArea: workAreaId,
      title:
        parsed.title || `AI Safety Audit Interview - ${data.workArea.name}`,
      auditStatus: "questions_generated",
      auditPeriod: {
        startDate: data.startDate,
        endDate: data.endDate,
        label: "Last 90 days",
      },
      auditSections: parsed.auditSections || [],
      evidenceUsed: {
        incidents: data.incidents.map((i) => i._id),
        observations: data.observations.map((o) => o._id),
        riskAssessments: data.riskAssessments.map((r) => r._id),
        jsas: data.jsas.map((j) => j._id),
        ppeChecklists: data.ppeChecklists.map((p) => p._id),
        trainingRequirements: data.trainingRequirements.map((t) => t._id),
        emergencyProtocols: data.emergencyProtocols.map((e) => e._id),
        safetyTalks: data.safetyTalks.map((s) => s._id),
        safetyInsights: data.safetyInsights.map((s) => s._id),
        permits: data.permits.map((p) => p._id),
      },
      dataCounts: {
        incidents: data.incidents.length,
        observations: data.observations.length,
        riskAssessments: data.riskAssessments.length,
        jsas: data.jsas.length,
        ppeChecklists: data.ppeChecklists.length,
        trainingRequirements: data.trainingRequirements.length,
        emergencyProtocols: data.emergencyProtocols.length,
        safetyTalks: data.safetyTalks.length,
        safetyInsights: data.safetyInsights.length,
        permits: data.permits.length,
      },
      aiGenerated: true,
      aiModel: "gpt-3.5-turbo-16k",
      initiatedBy: req.user._id,
    });

    await audit.save();

    req.flash("success", "AI safety audit questions generated successfully.");
    return res.redirect(`/safety-audits/${audit._id}/interview`);
  } catch (error) {
    console.error("Error generating safety audit questions:", error);
    req.flash("error", "Failed to generate safety audit: " + error.message);
    return res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// Stage 2: Show interview form
exports.showAuditInterview = async (req, res) => {
  try {
    const audit = await SafetyAuditScorecard.findById(req.params.id)
      .populate("workArea", "name")
      .populate("initiatedBy", "name");

    if (!audit) {
      req.flash("error", "Safety audit not found");
      return res.redirect("/dashboard");
    }

    res.render("safety-audits/interview", {
      user: req.user,
      audit,
    });
  } catch (error) {
    console.error("Error loading safety audit interview:", error);
    req.flash("error", "Error loading safety audit interview.");
    return res.redirect("/dashboard");
  }
};

// Stage 3: Submit responses and generate AI score
exports.submitResponsesAndGenerateScore = async (req, res) => {
  try {
    const { id } = req.params;

    const audit = await SafetyAuditScorecard.findById(id).populate(
      "workArea",
      "name",
    );

    if (!audit) {
      req.flash("error", "Safety audit not found");
      return res.redirect("/dashboard");
    }

    // Save officer responses
    audit.auditSections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        const base = `responses[${sectionIndex}][${questionIndex}]`;

        const status = req.body[`${base}[status]`] || "not_answered";
        const answerText = req.body[`${base}[answerText]`] || "";
        const evidenceNote = req.body[`${base}[evidenceNote]`] || "";

        question.officerResponse = {
          status,
          answerText,
          evidenceNote,
          respondedAt: new Date(),
        };
      });
    });

    audit.auditStatus = "responses_submitted";
    await audit.save();

    const data = await collectAuditData(audit.workArea._id || audit.workArea);
    const evidenceSummary = data ? buildEvidenceSummary(data) : "";

    const auditQuestionSummary = audit.auditSections
      .map((section) => {
        return `
SECTION: ${section.sectionName}
${section.questions
  .map((q, index) => {
    return `
Question ${index + 1}: ${q.questionText}
Concern Level: ${q.concernLevel}
Evidence Found: ${q.evidenceFound}
Why It Matters: ${q.whyItMatters}
Expected Good Response: ${q.expectedGoodResponse}
Officer Status: ${q.officerResponse?.status || "not_answered"}
Officer Answer: ${q.officerResponse?.answerText || ""}
Officer Evidence Note: ${q.officerResponse?.evidenceNote || ""}
`;
  })
  .join("\n")}
`;
      })
      .join("\n\n");

    const scoringPrompt = `
You are an expert Health, Safety and Environment auditor.

${professionalSafetyGuidance}
${miningContextGuidance}

You must now compute a safety audit score out of 100 based on:
1. The safety documents and records
2. The audit questions generated
3. The safety officer's responses

Be strict, fair, and professional. This is serious safety business.

Scoring guidance:
- 90-100: Excellent
- 75-89: Good
- 60-74: Needs Improvement
- 40-59: Weak
- 0-39: Critical Attention Required

Important score limits:
- Unresolved critical hazards should prevent a score above 60.
- Uninvestigated high severity incidents should prevent a score above 65.
- Missing risk assessment for high-risk work should prevent a score above 70.
- No emergency protocol should prevent a score above 80.
- No JSA for high-risk tasks should prevent a score above 75.
- Weak or vague officer responses should reduce the score.
- Clear completed actions with evidence should improve the score.

AVAILABLE SAFETY DATA:
${evidenceSummary}

AUDIT QUESTIONS AND OFFICER RESPONSES:
${auditQuestionSummary}

Return ONLY valid JSON in this exact shape:
{
  "overallScore": 0,
  "grade": "excellent | good | needs_improvement | weak | critical_attention_required",
  "riskLevel": "low | medium | high | critical",
  "scoreSummary": "string",
  "sectionScores": [
    {
      "sectionName": "string",
      "score": 0,
      "maxScore": 10,
      "percentage": 0,
      "comment": "string"
    }
  ],
  "questionEvaluations": [
    {
      "sectionIndex": 0,
      "questionIndex": 0,
      "responseQuality": "poor | fair | good | excellent | not_applicable",
      "scoreAwarded": 0,
      "maxScore": 10,
      "evaluationComment": "string"
    }
  ],
  "criticalFindings": ["string"],
  "positiveFindings": ["string"],
  "recommendations": ["string"],
  "immediateActions": ["string"],
  "followUpActions": ["string"],
  "managementDecisionAdvice": "string"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: scoringPrompt }],
      temperature: 0.25,
      max_tokens: 3500,
    });

    const aiText = completion.choices[0].message.content;

    const parsed = parseAIJson(aiText, {
      overallScore: 50,
      grade: "weak",
      riskLevel: "high",
      scoreSummary:
        "AI scoring response could not be fully parsed. Manual review recommended.",
      sectionScores: [],
      questionEvaluations: [],
      criticalFindings: [],
      positiveFindings: [],
      recommendations: ["Review audit responses and safety documentation."],
      immediateActions: [],
      followUpActions: [],
      managementDecisionAdvice:
        "Management should review the audit before making operational decisions.",
    });

    const overallScore = Math.max(
      0,
      Math.min(100, Number(parsed.overallScore || 0)),
    );

    audit.finalScore = {
      overallScore,
      grade: parsed.grade || calculateGrade(overallScore),
      riskLevel: parsed.riskLevel || calculateRiskLevel(overallScore),
      scoreSummary: parsed.scoreSummary || "",
      sectionScores: parsed.sectionScores || [],
      criticalFindings: parsed.criticalFindings || [],
      positiveFindings: parsed.positiveFindings || [],
      recommendations: parsed.recommendations || [],
      immediateActions: parsed.immediateActions || [],
      followUpActions: parsed.followUpActions || [],
      managementDecisionAdvice: parsed.managementDecisionAdvice || "",
      scoredAt: new Date(),
    };

    // Save question-level AI evaluations
    if (Array.isArray(parsed.questionEvaluations)) {
      parsed.questionEvaluations.forEach((evaluation) => {
        const section = audit.auditSections[evaluation.sectionIndex];
        if (!section) return;

        const question = section.questions[evaluation.questionIndex];
        if (!question) return;

        question.aiEvaluation = {
          responseQuality: evaluation.responseQuality || "fair",
          scoreAwarded: Number(evaluation.scoreAwarded || 0),
          maxScore: Number(evaluation.maxScore || 10),
          evaluationComment: evaluation.evaluationComment || "",
        };
      });
    }

    audit.auditStatus = "score_generated";

    await audit.save();

    req.flash("success", "AI safety score generated successfully.");
    return res.redirect(`/safety-audits/${audit._id}`);
  } catch (error) {
    console.error("Error scoring safety audit:", error);
    req.flash("error", "Failed to generate safety score: " + error.message);
    return res.redirect(`/safety-audits/${req.params.id}/interview`);
  }
};

// Stage 4: View scorecard
exports.viewScorecard = async (req, res) => {
  try {
    const audit = await SafetyAuditScorecard.findById(req.params.id)
      .populate("workArea", "name")
      .populate("initiatedBy", "name");

    if (!audit) {
      req.flash("error", "Safety audit not found");
      return res.redirect("/dashboard");
    }

    res.render("safety-audits/view", {
      user: req.user,
      audit,
    });
  } catch (error) {
    console.error("Error viewing safety scorecard:", error);
    req.flash("error", "Error loading safety scorecard.");
    return res.redirect("/dashboard");
  }
};

// Word download
exports.downloadWord = async (req, res) => {
  try {
    const audit = await SafetyAuditScorecard.findById(req.params.id)
      .populate("workArea", "name")
      .populate("initiatedBy", "name");

    if (!audit) {
      return res.status(404).send("Safety audit not found");
    }

    const buffer = await generateSafetyAuditWordBuffer({ audit });

    const safeNumber = audit.auditNumber || Date.now();
    const fileName = `safety_audit_scorecard_${safeNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading Safety Audit Word document:", error);
    return res.status(500).send("Error generating Safety Audit Word document");
  }
};

