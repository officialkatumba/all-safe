const PPEChecklist = require("../models/PPEChecklist");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const SafetyObservation = require("../models/SafetyObservation");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyTalk = require("../models/SafetyTalk");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate PPE requirements based on work area data
exports.generatePPERequirements = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const workArea = await WorkArea.findById(workAreaId).populate("worksite");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    // Collect all relevant data for AI analysis
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

    // Get active hazards
    const activeHazards =
      workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

    // Get current work types
    const workTypes =
      workArea.currentWorkTypes?.map((wt) => wt.workType).join(", ") ||
      "General";

    // Build AI prompt
    const prompt = `You are a senior safety officer creating a PPE (Personal Protective Equipment) requirements checklist for a work area.

## WORK AREA CONTEXT:
- Name: ${workArea.name}
- Worksite: ${workArea.worksite?.name || "N/A"}
- Current Work Types: ${workTypes}
- Status: ${workArea.status}

## RECENT INCIDENTS (Last 30 days):
${recentIncidents.map((i) => `- ${i.type}: ${i.description?.substring(0, 150)} (Severity: ${i.severity})`).join("\n") || "No recent incidents"}

## RECENT SAFETY OBSERVATIONS:
${recentObservations.map((o) => `- [${o.type}] ${o.description?.substring(0, 150)}`).join("\n") || "No recent observations"}

## ACTIVE HAZARDS:
${activeHazards.map((h) => `- ${h.hazard} (Risk: ${h.riskLevel})`).join("\n") || "No active hazards listed"}

## RECENT RISK ASSESSMENT FINDINGS:
${recentRiskAssessments.map((ra) => `- ${ra.title}: ${ra.overallFindings?.substring(0, 150) || "Review recommended"}`).join("\n") || "No recent risk assessments"}

## YOUR TASK:
Generate a comprehensive PPE requirements checklist based on the data above. Consider:
1. Head protection (hard hats)
2. Eye and face protection
3. Hearing protection
4. Respiratory protection
5. Hand protection
6. Foot protection
7. Body protection (vests, suits)
8. Fall protection
9. Specialized PPE for specific tasks

## OUTPUT FORMAT (JSON only):
{
  "title": "PPE Requirements - [Work Area Name] - [Date]",
  "ppeItems": [
    {
      "item": "hard_hat",
      "required": true,
      "condition": "Good condition, no cracks, suspension intact",
      "quantity": "[estimated number]",
      "reason": "[why this PPE is needed based on hazards]"
    }
  ],
  "specialInstructions": "[Any additional PPE instructions or notes]",
  "inspectionItems": [
    { "item": "[what to inspect]", "passCriteria": "[what to check for]" }
  ]
}

Return ONLY valid JSON, no other text. Base your recommendations on the actual hazards, incidents, and observations provided.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0].message.content;

    // Parse JSON response
    let ppeData;
    try {
      ppeData = JSON.parse(aiResponse);
    } catch (e) {
      // Extract JSON from response if wrapped in markdown
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      ppeData = jsonMatch ? JSON.parse(jsonMatch[0]) : { ppeItems: [] };
    }

    // Create PPE Checklist
    const ppeChecklist = new PPEChecklist({
      worksite: workArea.worksite._id,
      createdBy: req.user.safetyOfficer,
      title:
        ppeData.title ||
        `PPE Requirements - ${workArea.name} - ${new Date().toLocaleDateString()}`,
      date: new Date(),
      applicableTasks: workTypes.split(", "),
      applicableDepartments: ["All"],
      applicableShifts: ["all"],
      ppeItems: (ppeData.ppeItems || []).map((item) => ({
        item: item.item,
        customItem: item.item === "other" ? item.customItem : undefined,
        required: item.required !== false,
        condition: item.condition || "Good condition",
        quantity: item.quantity ? parseInt(item.quantity) || 0 : 0,
        location: "Work area",
      })),
      inspectionItems: (ppeData.inspectionItems || []).map((item) => ({
        item: item.item,
        passCriteria: item.passCriteria || "Visually acceptable",
      })),
      status: "active",
    });

    await ppeChecklist.save();

    // Update work area documents
    if (!workArea.documents) workArea.documents = {};
    if (!workArea.documents.ppeChecklists)
      workArea.documents.ppeChecklists = [];
    workArea.documents.ppeChecklists.push(ppeChecklist._id);
    await workArea.save();

    req.flash("success", "PPE requirements generated successfully!");
    res.redirect(`/ppe/${ppeChecklist._id}`);
  } catch (error) {
    console.error("Error generating PPE requirements:", error);
    req.flash("error", "Error generating PPE requirements: " + error.message);
    res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// View PPE Checklist
exports.getPPEChecklist = async (req, res) => {
  try {
    const checklist = await PPEChecklist.findById(req.params.id)
      .populate("worksite", "name")
      .populate("createdBy", "name")
      .populate("workerSignoffs.workerId", "name");

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
      return res.status(404).json({ success: false });
    }

    const checklists = await PPEChecklist.find({ worksite: workArea.worksite })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, checklists });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    checklist.status = "completed";
    await checklist.save();

    req.flash("success", "PPE checklist marked as completed!");
    res.redirect(`/ppe/${checklist._id}`);
  } catch (error) {
    console.error("Error completing checklist:", error);
    req.flash("error", "Error updating checklist");
    res.redirect(`/ppe/${req.params.id}`);
  }
};
