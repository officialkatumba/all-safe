const OHSComplianceAudit = require("../models/OHSComplianceAudit");
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
const ohsRequirements = require("../data/compliance/ohsRequirements");
const { OpenAI } = require("openai");
const {
  professionalSafetyGuidance,
  miningContextGuidance,
} = require("../utils/aiPromptGuidance");
const {
  generateOHSComplianceWordBuffer,
} = require("../utils/ohsComplianceWordGenerator");

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
      console.error("OHS compliance AI JSON parse failed:", innerError.message);
      return fallback;
    }
  }
}

function complianceGrade(score) {
  if (score >= 90) return "highly_compliant";
  if (score >= 75) return "compliant";
  if (score >= 60) return "partially_compliant";
  if (score >= 40) return "weak_compliance";
  return "critical_non_compliance";
}

function legalRiskLevel(score) {
  if (score >= 90) return "low";
  if (score >= 75) return "medium";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

async function collectWorkAreaEvidence(workAreaId) {
  const workArea = await WorkArea.findById(workAreaId);

  if (!workArea) return null;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const incidents = await Incident.find({ workArea: workAreaId })
    .sort({ createdAt: -1 })
    .limit(20);
  const observations = await SafetyObservation.find({ workArea: workAreaId })
    .sort({ createdAt: -1 })
    .limit(20);
  const riskAssessments = await RiskAssessment.find({ workArea: workAreaId })
    .sort({ createdAt: -1 })
    .limit(10);
  const jsas = await JSA.find({ workArea: workAreaId })
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

  const safetyTalks = await SafetyTalk.find({ targetWorkAreas: workAreaId })
    .sort({ createdAt: -1 })
    .limit(10);

  const safetyInsights = await SafetyInsight.find({ workArea: workAreaId })
    .sort({ createdAt: -1 })
    .limit(10);

  const permits = await Permit.find({ workArea: workAreaId })
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
Work Types: ${
    data.workArea.currentWorkTypes?.map((w) => w.workType || w).join(", ") ||
    "Not specified"
  }
Estimated exposed persons: ${data.workArea.activeShifts?.reduce((sum, shift) => sum + (shift.workerCount || 0), 0) || "Not specified"}

ACTIVE HAZARDS:
${
  activeHazards.length
    ? activeHazards
        .map((h) => `- ${h.hazard} | Risk: ${h.riskLevel || "N/A"}`)
        .join("\n")
    : "No active hazards listed."
}

INCIDENTS:
${
  data.incidents.length
    ? data.incidents
        .map(
          (i) =>
            `- ${i.type} | Severity: ${i.severity} | Status: ${i.status} | ${safeText(i.description, 180)}`,
        )
        .join("\n")
    : "No incidents found."
}

OBSERVATIONS:
${
  data.observations.length
    ? data.observations
        .map(
          (o) =>
            `- ${o.type} | Status: ${o.status} | ${safeText(o.description, 180)} | Action: ${safeText(o.correctiveActions, 120)}`,
        )
        .join("\n")
    : "No safety observations found."
}

RISK ASSESSMENTS:
${
  data.riskAssessments.length
    ? data.riskAssessments
        .map(
          (r) =>
            `- ${r.title} | Status: ${r.status} | ${safeText(r.summary || r.overallFindings, 180)}`,
        )
        .join("\n")
    : "No risk assessments found."
}

JSAs:
${
  data.jsas.length
    ? data.jsas
        .map((j) => `- ${j.jobTask || j.title} | Status: ${j.status}`)
        .join("\n")
    : "No JSAs found."
}

PPE CHECKLISTS:
${
  data.ppeChecklists.length
    ? data.ppeChecklists
        .map(
          (p) =>
            `- ${p.title} | Status: ${p.status} | Items: ${p.ppeItems?.length || 0}`,
        )
        .join("\n")
    : "No PPE checklists found."
}

TRAINING REQUIREMENTS:
${
  data.trainingRequirements.length
    ? data.trainingRequirements
        .map(
          (t) => `- ${t.title} | Priority: ${t.priority} | Status: ${t.status}`,
        )
        .join("\n")
    : "No training requirements found."
}

EMERGENCY PROTOCOLS:
${
  data.emergencyProtocols.length
    ? data.emergencyProtocols
        .map((e) => `- ${e.title} | Priority: ${e.priorityLevel}`)
        .join("\n")
    : "No emergency protocols found."
}

SAFETY TALKS:
${
  data.safetyTalks.length
    ? data.safetyTalks
        .map((s) => `- ${s.title} | Status: ${s.status}`)
        .join("\n")
    : "No safety talks found."
}

SAFETY INSIGHTS:
${
  data.safetyInsights.length
    ? data.safetyInsights
        .map(
          (s) =>
            `- ${s.title} | Priority: ${s.priorityLevel} | ${safeText(s.summary, 160)}`,
        )
        .join("\n")
    : "No safety insights found."
}

PERMITS:
${
  data.permits.length
    ? data.permits.map((p) => `- ${p.title} | Status: ${p.status}`).join("\n")
    : "No permits found."
}
`;
}

exports.generateAudit = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const data = await collectWorkAreaEvidence(workAreaId);

    if (!data) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    const legalRequirements = ohsRequirements.map((req) => ({
      code: req.code,
      section: req.section,
      title: req.title,
      category: req.category,
      legalRequirement: req.legalRequirement,
      questions: req.questions.map((questionText) => ({
        questionText,
        officerResponse: {
          complianceStatus: "not_answered",
          answerText: "",
          evidenceNote: "",
          correctiveAction: "",
        },
      })),
    }));

    const audit = new OHSComplianceAudit({
      workArea: workAreaId,
      title: `OHS Compliance Audit - ${data.workArea.name}`,
      auditStatus: "questions_generated",
      auditPeriod: {
        startDate: data.startDate,
        endDate: data.endDate,
        label: "Last 90 days",
      },
      legalRequirements,
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
      initiatedBy: req.user._id,
      aiGenerated: true,
      aiModel: "gpt-3.5-turbo-16k",
    });

    await audit.save();

    req.flash("success", "OHS compliance audit generated successfully.");
    return res.redirect(`/ohs-compliance-audits/${audit._id}/interview`);
  } catch (error) {
    console.error("Error generating OHS compliance audit:", error);
    req.flash(
      "error",
      "Error generating OHS compliance audit: " + error.message,
    );
    return res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

exports.showInterview = async (req, res) => {
  try {
    const audit = await OHSComplianceAudit.findById(req.params.id)
      .populate("workArea", "name")
      .populate("initiatedBy", "name");

    if (!audit) {
      req.flash("error", "OHS compliance audit not found");
      return res.redirect("/dashboard");
    }

    res.render("ohs-compliance-audits/interview", {
      user: req.user,
      audit,
    });
  } catch (error) {
    console.error("Error loading OHS compliance interview:", error);
    req.flash("error", "Error loading OHS compliance interview");
    return res.redirect("/dashboard");
  }
};

exports.submitResponsesAndScore = async (req, res) => {
  try {
    const audit = await OHSComplianceAudit.findById(req.params.id).populate(
      "workArea",
      "name",
    );

    if (!audit) {
      req.flash("error", "OHS compliance audit not found");
      return res.redirect("/dashboard");
    }

    audit.legalRequirements.forEach((requirement, requirementIndex) => {
      requirement.questions.forEach((question, questionIndex) => {
        const base = `responses[${requirementIndex}][${questionIndex}]`;

        question.officerResponse = {
          complianceStatus:
            req.body[`${base}[complianceStatus]`] || "not_answered",
          answerText: req.body[`${base}[answerText]`] || "",
          evidenceNote: req.body[`${base}[evidenceNote]`] || "",
          correctiveAction: req.body[`${base}[correctiveAction]`] || "",
          targetDate: req.body[`${base}[targetDate]`] || null,
          respondedAt: new Date(),
        };
      });
    });

    audit.auditStatus = "responses_submitted";
    await audit.save();

    const data = await collectWorkAreaEvidence(
      audit.workArea._id || audit.workArea,
    );
    const evidenceSummary = data ? buildEvidenceSummary(data) : "";

    const responseSummary = audit.legalRequirements
      .map((req, reqIndex) => {
        return `
LEGAL REQUIREMENT ${reqIndex + 1}
Code: ${req.code}
Reference: ${req.section}
Title: ${req.title}
Category: ${req.category}
Requirement: ${req.legalRequirement}

Questions and responses:
${req.questions
  .map((q, qIndex) => {
    return `
Question Index: ${qIndex}
Question: ${q.questionText}
Officer Compliance Status: ${q.officerResponse?.complianceStatus}
Officer Answer: ${q.officerResponse?.answerText}
Evidence Note: ${q.officerResponse?.evidenceNote}
Corrective Action: ${q.officerResponse?.correctiveAction}
Target Date: ${q.officerResponse?.targetDate || "N/A"}
`;
  })
  .join("\n")}
`;
      })
      .join("\n");

    const prompt = `
You are an Occupational Health and Safety compliance auditor.

${professionalSafetyGuidance}
${miningContextGuidance}

You are evaluating compliance with the Occupational Health and Safety Bill, 2025.

Important:
- Do not invent legal sections.
- Score only against the legal requirements provided.
- Evaluate the officer responses, evidence notes, corrective actions, and available safety system evidence.
- Be strict but fair.
- If a requirement is important and the response is vague or unsupported, mark down the score.
- If there is no evidence, do not assume compliance.
- If status is non_compliant for critical requirements, legal risk should be high or critical.

Compliance scale:
90-100 = highly_compliant
75-89 = compliant
60-74 = partially_compliant
40-59 = weak_compliance
0-39 = critical_non_compliance

WORK AREA EVIDENCE:
${evidenceSummary}

LEGAL REQUIREMENTS AND OFFICER RESPONSES:
${responseSummary}

Return ONLY valid JSON in this exact structure:
{
  "overallScore": 0,
  "complianceGrade": "highly_compliant | compliant | partially_compliant | weak_compliance | critical_non_compliance",
  "legalRiskLevel": "low | medium | high | critical",
  "executiveSummary": "string",
  "categoryScores": [
    {
      "category": "string",
      "score": 0,
      "maxScore": 10,
      "percentage": 0,
      "comment": "string"
    }
  ],
  "questionEvaluations": [
    {
      "requirementIndex": 0,
      "questionIndex": 0,
      "complianceLevel": "compliant | partially_compliant | non_compliant | not_applicable",
      "scoreAwarded": 0,
      "maxScore": 10,
      "legalRisk": "low | medium | high | critical",
      "evaluationComment": "string",
      "recommendation": "string"
    }
  ],
  "criticalNonCompliances": ["string"],
  "partialCompliances": ["string"],
  "strengths": ["string"],
  "recommendations": ["string"],
  "immediateActions": ["string"],
  "followUpActions": ["string"],
  "managementAdvice": "string"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25,
      max_tokens: 4000,
    });

    const parsed = parseAIJson(completion.choices[0].message.content, {
      overallScore: 50,
      complianceGrade: "weak_compliance",
      legalRiskLevel: "high",
      executiveSummary:
        "AI response could not be fully parsed. Manual review is required.",
      categoryScores: [],
      questionEvaluations: [],
      criticalNonCompliances: [],
      partialCompliances: [],
      strengths: [],
      recommendations: [
        "Review all OHS compliance responses and supporting evidence.",
      ],
      immediateActions: [],
      followUpActions: [],
      managementAdvice:
        "Management should review the compliance audit before operational decisions.",
    });

    const score = Math.max(0, Math.min(100, Number(parsed.overallScore || 0)));

    audit.finalCompliance = {
      overallScore: score,
      complianceGrade: parsed.complianceGrade || complianceGrade(score),
      legalRiskLevel: parsed.legalRiskLevel || legalRiskLevel(score),
      executiveSummary: parsed.executiveSummary || "",
      categoryScores: parsed.categoryScores || [],
      criticalNonCompliances: parsed.criticalNonCompliances || [],
      partialCompliances: parsed.partialCompliances || [],
      strengths: parsed.strengths || [],
      recommendations: parsed.recommendations || [],
      immediateActions: parsed.immediateActions || [],
      followUpActions: parsed.followUpActions || [],
      managementAdvice: parsed.managementAdvice || "",
      scoredAt: new Date(),
    };

    if (Array.isArray(parsed.questionEvaluations)) {
      parsed.questionEvaluations.forEach((ev) => {
        const requirement = audit.legalRequirements[ev.requirementIndex];
        if (!requirement) return;

        const question = requirement.questions[ev.questionIndex];
        if (!question) return;

        question.aiEvaluation = {
          complianceLevel: ev.complianceLevel || "partially_compliant",
          scoreAwarded: Number(ev.scoreAwarded || 0),
          maxScore: Number(ev.maxScore || 10),
          legalRisk: ev.legalRisk || "medium",
          evaluationComment: ev.evaluationComment || "",
          recommendation: ev.recommendation || "",
        };
      });
    }

    audit.auditStatus = "score_generated";
    await audit.save();

    req.flash("success", "OHS compliance score generated successfully.");
    return res.redirect(`/ohs-compliance-audits/${audit._id}`);
  } catch (error) {
    console.error("Error scoring OHS compliance audit:", error);
    req.flash("error", "Error scoring OHS compliance audit: " + error.message);
    return res.redirect(`/ohs-compliance-audits/${req.params.id}/interview`);
  }
};

exports.viewAudit = async (req, res) => {
  try {
    const audit = await OHSComplianceAudit.findById(req.params.id)
      .populate("workArea", "name")
      .populate("initiatedBy", "name");

    if (!audit) {
      req.flash("error", "OHS compliance audit not found");
      return res.redirect("/dashboard");
    }

    res.render("ohs-compliance-audits/view", {
      user: req.user,
      audit,
    });
  } catch (error) {
    console.error("Error viewing OHS compliance audit:", error);
    req.flash("error", "Error loading OHS compliance audit");
    return res.redirect("/dashboard");
  }
};

exports.downloadWord = async (req, res) => {
  try {
    const audit = await OHSComplianceAudit.findById(req.params.id)
      .populate("workArea", "name")
      .populate("initiatedBy", "name");

    if (!audit) {
      return res.status(404).send("OHS compliance audit not found");
    }

    const buffer = await generateOHSComplianceWordBuffer({ audit });

    const safeNumber = audit.auditNumber || Date.now();
    const fileName = `ohs_compliance_audit_${safeNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading OHS Compliance Word document:", error);
    return res
      .status(500)
      .send("Error generating OHS Compliance Word document");
  }
};

