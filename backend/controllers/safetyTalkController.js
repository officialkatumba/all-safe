const SafetyTalk = require("../models/SafetyTalk");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate a new safety talk (AI-driven, no form needed)
exports.generateSafetyTalk = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const workArea = await WorkArea.findById(workAreaId)
      .populate("worksite")
      .populate("assignedSafetyOfficers.officer");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    // Collect all relevant data for AI context
    const recentIncidents = await Incident.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(10);

    const recentRiskAssessments = await RiskAssessment.find({
      workArea: workAreaId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const previousTalks = await SafetyTalk.find({ targetWorkAreas: workAreaId })
      .sort({ createdAt: -1 })
      .limit(3);

    // Get active hazards
    const activeHazards =
      workArea.identifiedHazards?.filter((h) => h.status === "active") || [];

    // Build AI prompt
    const prompt = `You are a professional safety officer creating a DAILY SAFETY TALK (5-10 minutes) for workers.

## WORK AREA CONTEXT:
- Name: ${workArea.name}
- Worksite: ${workArea.worksite?.name || "N/A"}
- Status: ${workArea.status}
- Current Work Types: ${workArea.currentWorkTypes?.map((wt) => wt.workType).join(", ") || "Various"}

## RECENT INCIDENTS (Last 30 days):
${recentIncidents.map((i) => `- [${i.type.toUpperCase()}] ${i.description?.substring(0, 100)} (Severity: ${i.severity})`).join("\n") || "No recent incidents"}

## ACTIVE HAZARDS:
${activeHazards.map((h) => `- ${h.hazard} (Risk: ${h.riskLevel})`).join("\n") || "No active hazards listed"}

## RECENT RISK ASSESSMENT FINDINGS:
${recentRiskAssessments.map((ra) => `- ${ra.title}: ${ra.overallFindings?.substring(0, 100) || "Review recommended"}`).join("\n") || "No recent risk assessments"}

## PREVIOUS SAFETY TALK TOPICS (to avoid repetition):
${previousTalks.map((t) => `- ${t.title} (${new Date(t.date).toLocaleDateString()})`).join("\n") || "No previous talks"}

## YOUR TASK:
Generate a practical, engaging 5-10 minute safety talk that:
1. Addresses the most critical current risk based on the data above
2. Is specific to this work area's actual conditions
3. Includes real examples from the incidents listed
4. Provides actionable safety tips

## OUTPUT FORMAT (use exactly this structure):
# [Engaging Title]

## Opening Statement
[2-3 sentences to grab attention]

## Main Safety Points
1. [First point with example]
2. [Second point with example]
3. [Third point with example]
4. [Fourth point if needed]

## Discussion Questions
- [Question 1 for workers]
- [Question 2 for workers]
- [Question 3 for workers]

## Key Takeaways
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

## Closing Reminder
[1-2 sentences to end positively]

Generate the talk in 120-200 words total. Be direct, practical, and specific to this work area.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiContent = completion.choices[0].message.content;

    // Parse the AI response into sections
    const sections = {
      opening: "",
      mainPoints: [],
      discussionQuestions: [],
      keyTakeaways: [],
      closing: "",
    };

    let currentSection = "";
    const lines = aiContent.split("\n");
    let title = "";

    for (const line of lines) {
      if (line.startsWith("# ")) {
        title = line.substring(2);
      } else if (
        line.toLowerCase().includes("opening") ||
        line.toLowerCase().includes("opening statement")
      ) {
        currentSection = "opening";
      } else if (
        line.toLowerCase().includes("main safety point") ||
        line.toLowerCase().includes("main points")
      ) {
        currentSection = "mainPoints";
      } else if (line.toLowerCase().includes("discussion question")) {
        currentSection = "discussionQuestions";
      } else if (line.toLowerCase().includes("key takeaway")) {
        currentSection = "keyTakeaways";
      } else if (line.toLowerCase().includes("closing")) {
        currentSection = "closing";
      } else if (line.trim()) {
        if (currentSection === "opening") {
          sections.opening += line.trim() + " ";
        } else if (
          currentSection === "mainPoints" &&
          (line.trim().match(/^\d+\./) || line.trim().startsWith("-"))
        ) {
          sections.mainPoints.push(
            line
              .trim()
              .replace(/^\d+\.\s*/, "")
              .replace(/^-\s*/, ""),
          );
        } else if (
          currentSection === "discussionQuestions" &&
          line.trim().startsWith("-")
        ) {
          sections.discussionQuestions.push(line.trim().replace(/^-\s*/, ""));
        } else if (
          currentSection === "keyTakeaways" &&
          line.trim().startsWith("-")
        ) {
          sections.keyTakeaways.push(line.trim().replace(/^-\s*/, ""));
        } else if (currentSection === "closing") {
          sections.closing += line.trim() + " ";
        }
      }
    }

    // Create safety talk
    const safetyTalk = new SafetyTalk({
      targetWorkAreas: [workAreaId],
      title: title || `Daily Safety Briefing - ${workArea.name}`,
      content: aiContent,
      duration: 5,
      topics: [activeHazards[0]?.hazard || "General Safety", "Daily Briefing"],
      sections,
      generatedBy: req.user.safetyOfficer,
      conductedBy: req.user.safetyOfficer,
      status: "published",
      date: new Date(),
      aiGenerated: true,
      aiModel: "gpt-3.5-turbo-16k",
      basedOn: {
        recentIncidents: recentIncidents.map((i) => i._id),
        identifiedHazards: activeHazards.map((h) => h.hazardId),
        riskAssessments: recentRiskAssessments.map((ra) => ra._id),
        previousTalks: previousTalks.map((t) => t._id),
        aiReasoning:
          "Generated based on recent incidents, active hazards, and risk assessments",
      },
    });

    await safetyTalk.save();

    // Add to work area's documents
    if (!workArea.documents) workArea.documents = {};
    if (!workArea.documents.safetyTalks) workArea.documents.safetyTalks = [];
    workArea.documents.safetyTalks.push(safetyTalk._id);
    await workArea.save();

    // Update work area statistics
    workArea.statistics.safetyTalks =
      (workArea.statistics.safetyTalks || 0) + 1;
    await workArea.save();

    req.flash("success", "Safety talk generated successfully!");
    res.redirect(`/safety-talks/${safetyTalk._id}`);
  } catch (error) {
    console.error("Error generating safety talk:", error);
    req.flash("error", "Error generating safety talk: " + error.message);
    res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// View a single safety talk
exports.getSafetyTalk = async (req, res) => {
  try {
    const talk = await SafetyTalk.findById(req.params.id)
      .populate("targetWorkAreas", "name worksite")
      .populate("generatedBy", "name")
      .populate("conductedBy", "name")
      .populate(
        "basedOn.recentIncidents",
        "incidentNumber type severity description",
      );

    if (!talk) {
      req.flash("error", "Safety talk not found");
      return res.redirect("/dashboard");
    }

    res.render("safety-talks/view", {
      user: req.user,
      talk,
    });
  } catch (error) {
    console.error("Error viewing safety talk:", error);
    req.flash("error", "Error loading safety talk");
    res.redirect("/dashboard");
  }
};

// Get all safety talks for a work area (for dashboard display)
exports.getWorkAreaTalks = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const talks = await SafetyTalk.find({ targetWorkAreas: workAreaId })
      .sort({ date: -1 })
      .limit(10);

    res.json({ success: true, talks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark talk as conducted and record attendance
exports.markAsConducted = async (req, res) => {
  try {
    const talk = await SafetyTalk.findById(req.params.id);
    const { attendeeCount, notes } = req.body;

    if (!talk) {
      req.flash("error", "Safety talk not found");
      return res.redirect("/dashboard");
    }

    talk.status = "conducted";
    talk.attendance.totalAttendees = attendeeCount || 0;
    talk.effectiveness = {
      comments: notes || "",
      reviewedBy: req.user.safetyOfficer,
      reviewedAt: new Date(),
    };

    await talk.save();

    req.flash("success", "Safety talk marked as conducted!");
    res.redirect(`/safety-talks/${talk._id}`);
  } catch (error) {
    console.error("Error marking talk:", error);
    req.flash("error", "Error updating safety talk");
    res.redirect(`/safety-talks/${req.params.id}`);
  }
};
