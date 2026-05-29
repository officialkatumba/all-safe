const EmergencyProtocol = require("../models/EmergencyProtocol");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const SafetyObservation = require("../models/SafetyObservation");
const RiskAssessment = require("../models/RiskAssessment");
const JSA = require("../models/JSA");
const SafetyTalk = require("../models/SafetyTalk");
const PPEChecklist = require("../models/PPEChecklist");
const TrainingRequirement = require("../models/TrainingRequirement");
const { OpenAI } = require("openai");

const {
  generateEmergencyProtocolWordBuffer,
} = require("../utils/emergencyProtocolWordGenerator");

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
    console.error("Emergency Protocol AI JSON parse failed:", error.message);

    return {
      title: "AI Emergency Procedure and Preparedness Protocol",
      summary:
        "The system generated an emergency preparedness document but could not fully parse the structured response.",
      priorityLevel: "medium",
      emergencyTypesCovered: ["General emergency response"],
      emergencyRiskAssessment: text,
      emergencyResponseProcedures:
        "Safety management should review the generated emergency protocol and confirm site-specific procedures.",
      evacuationPlan: "",
      communicationPlan: "",
      requiredEquipment: [],
      requiredTraining: [],
      recommendedActions: ["Review emergency response readiness."],
    };
  }
}

exports.generateEmergencyProtocol = async (req, res) => {
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

    const ppeChecklists = await PPEChecklist.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(5);

    const trainingRequirements = await TrainingRequirement.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const activeHazards =
      workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

    const highSeverityIncidents = incidents.filter((i) =>
      ["high", "critical", "fatality"].includes(i.severity),
    );

    const prompt = `
You are a senior Emergency Preparedness and Health & Safety Manager.

Generate a fully AI-created Emergency Procedure and Preparedness Protocol for the work area below. Do not ask for human input. Use the available safety data to identify likely emergency scenarios and produce practical emergency response procedures.

WORK AREA:
Name: ${workArea.name}
Location: ${workArea.location?.zone || "N/A"}
Status: ${workArea.status || "N/A"}
Description: ${safeText(workArea.description, 500)}
Current Work Types: ${
      workArea.currentWorkTypes?.map((w) => w.workType || w).join(", ") ||
      "Not specified"
    }
Location: ${safeText(workArea.location?.zone || workArea.location, 200)}

ACTIVE HAZARDS:
${
  activeHazards.length > 0
    ? activeHazards
        .map((h) => `- ${h.hazard} | Risk Level: ${h.riskLevel || "N/A"}`)
        .join("\n")
    : "No active hazards listed."
}

RECENT INCIDENTS / NEAR MISSES - LAST 90 DAYS:
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
  Injuries: ${safeText(i.injuries?.description, 200)}
  Potential Consequences: ${safeText(i.potentialConsequences, 200)}
`,
        )
        .join("\n")
    : "No recent incidents or near misses recorded."
}

SAFETY OBSERVATIONS:
${
  safetyObservations.length > 0
    ? safetyObservations
        .map(
          (obs) => `
- Type: ${obs.type}
  Status: ${obs.status}
  Description: ${safeText(obs.description, 300)}
  Recommendation: ${safeText(obs.recommendations, 250)}
`,
        )
        .join("\n")
    : "No recent safety observations recorded."
}

RISK ASSESSMENTS:
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
    : "No risk assessments found."
}

JSAs:
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
    : "No JSAs found."
}

PPE CHECKLISTS:
${
  ppeChecklists.length > 0
    ? ppeChecklists
        .map(
          (p) =>
            `- ${p.title || "PPE Checklist"} | Status: ${p.status || "N/A"}`,
        )
        .join("\n")
    : "No PPE checklists found."
}

TRAINING REQUIREMENTS:
${
  trainingRequirements.length > 0
    ? trainingRequirements
        .map(
          (t) =>
            `- ${t.title || "Training"} | Priority: ${t.priority || "N/A"} | Compliance: ${t.complianceRate || 0}%`,
        )
        .join("\n")
    : "No training requirements found."
}

DATA COUNTS:
- Incidents and near misses: ${incidents.length}
- High severity incidents: ${highSeverityIncidents.length}
- Safety observations: ${safetyObservations.length}
- Risk assessments: ${riskAssessments.length}
- JSAs: ${jsas.length}
- Safety talks: ${safetyTalks.length}
- PPE checklists: ${ppeChecklists.length}
- Training requirements: ${trainingRequirements.length}

TASK:
Generate an Emergency Procedure and Preparedness Protocol with two major parts:

PART 1: Emergency Risk and Preparedness Assessment
- Identify likely emergency scenarios for this work area
- Identify gaps in preparedness
- Identify emergency-related hazards
- Mention whether emergency readiness appears adequate, weak, or requiring attention
- Consider fire, injury, evacuation, equipment failure, chemical exposure, collapse, electrical emergency, severe weather, and medical emergency where relevant

PART 2: Emergency Response Procedures and Action Plan
- Provide practical steps for response
- Include evacuation guidance
- Include communication and reporting guidance
- Include first aid and medical response guidance
- Include responsibilities for workers, supervisors, and safety officers
- Include recommended drills/training
- Include equipment that should be available

Return ONLY valid JSON in this exact shape:
{
  "title": "string",
  "summary": "string",
  "priorityLevel": "low | medium | high | critical",
  "emergencyTypesCovered": ["string"],
  "emergencyRiskAssessment": "string",
  "emergencyResponseProcedures": "string",
  "evacuationPlan": "string",
  "communicationPlan": "string",
  "requiredEquipment": ["string"],
  "requiredTraining": ["string"],
  "recommendedActions": ["string"]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 2800,
    });

    const aiText = completion.choices[0].message.content;
    const parsed = parseJsonFromAI(aiText);

    const protocol = new EmergencyProtocol({
      workArea: workAreaId,
      title:
        parsed.title || `Emergency Preparedness Protocol - ${workArea.name}`,
      summary: parsed.summary || "",
      priorityLevel: parsed.priorityLevel || "medium",
      emergencyTypesCovered: parsed.emergencyTypesCovered || [],
      emergencyRiskAssessment:
        parsed.emergencyRiskAssessment ||
        "No emergency risk assessment generated.",
      emergencyResponseProcedures:
        parsed.emergencyResponseProcedures ||
        "No emergency response procedures generated.",
      evacuationPlan: parsed.evacuationPlan || "",
      communicationPlan: parsed.communicationPlan || "",
      requiredEquipment: parsed.requiredEquipment || [],
      requiredTraining: parsed.requiredTraining || [],
      recommendedActions: parsed.recommendedActions || [],
      evidenceUsed: {
        incidents: incidents.map((i) => i._id),
        safetyObservations: safetyObservations.map((o) => o._id),
        riskAssessments: riskAssessments.map((r) => r._id),
        jsas: jsas.map((j) => j._id),
        safetyTalks: safetyTalks.map((t) => t._id),
        ppeChecklists: ppeChecklists.map((p) => p._id),
        trainingRequirements: trainingRequirements.map((t) => t._id),
      },
      dataCounts: {
        incidents: incidents.length,
        observations: safetyObservations.length,
        riskAssessments: riskAssessments.length,
        jsas: jsas.length,
        safetyTalks: safetyTalks.length,
        ppeChecklists: ppeChecklists.length,
        trainingRequirements: trainingRequirements.length,
      },
      periodCovered: {
        startDate,
        endDate,
        label: "Last 90 days",
      },
      generatedBy: req.user._id,
      aiGenerated: true,
      aiModel: "gpt-3.5-turbo-16k",
      status: "generated",
    });

    await protocol.save();

    req.flash(
      "success",
      "AI Emergency Preparedness Protocol generated successfully.",
    );
    return res.redirect(`/emergency-protocols/${protocol._id}`);
  } catch (error) {
    console.error("Error generating emergency protocol:", error);
    req.flash(
      "error",
      "Failed to generate emergency protocol: " + error.message,
    );
    return res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

exports.getEmergencyProtocol = async (req, res) => {
  try {
    const protocol = await EmergencyProtocol.findById(req.params.id)
      .populate("workArea", "name")
      .populate("generatedBy", "name");

    if (!protocol) {
      req.flash("error", "Emergency protocol not found");
      return res.redirect("/dashboard");
    }

    res.render("emergency-protocols/view", {
      user: req.user,
      protocol,
    });
  } catch (error) {
    console.error("Error viewing emergency protocol:", error);
    req.flash("error", "Error loading emergency protocol.");
    res.redirect("/dashboard");
  }
};

exports.downloadWord = async (req, res) => {
  try {
    const { id } = req.params;

    const protocol = await EmergencyProtocol.findById(id)
      .populate("workArea", "name")
      .populate("generatedBy", "name");

    if (!protocol) {
      return res.status(404).send("Emergency protocol not found");
    }

    const buffer = await generateEmergencyProtocolWordBuffer({ protocol });

    const safeNumber = protocol.protocolNumber || Date.now();
    const fileName = `emergency_protocol_${safeNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading Emergency Protocol Word document:", error);
    return res
      .status(500)
      .send("Error generating Emergency Protocol Word document");
  }
};

