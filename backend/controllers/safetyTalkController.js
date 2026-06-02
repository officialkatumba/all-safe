const SafetyTalk = require("../models/SafetyTalk");
const WorkArea = require("../models/WorkArea");
const SafetyHub = require("../models/SafetyHub");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const { OpenAI } = require("openai");
const {
  professionalSafetyGuidance,
  miningContextGuidance,
} = require("../utils/aiPromptGuidance");

const {
  generateSafetyTalkWordBuffer,
} = require("../utils/safetyTalkWordGenerator");
const { trackUsage } = require("../utils/usageTracker");
const { AI_MODEL, AI_MAX_TOKENS } = require("../utils/aiConfig");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseSafetyTalkContent(aiContent) {
  const sections = {
    opening: "",
    mainPoints: [],
    discussionQuestions: [],
    supervisorVerification: [],
    keyTakeaways: [],
    closing: "",
  };

  let currentSection = "";
  let title = "";

  for (const line of aiContent.split("\n")) {
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
    } else if (line.toLowerCase().includes("supervisor verification")) {
      currentSection = "supervisorVerification";
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
        currentSection === "supervisorVerification" &&
        line.trim().startsWith("-")
      ) {
        sections.supervisorVerification.push(line.trim().replace(/^-\s*/, ""));
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

  return { title, sections };
}

function isSafetyOfficer(user) {
  return user?.role === "safety_officer";
}

// Generate a new safety talk (AI-driven, no form needed)
exports.generateSafetyTalk = async (req, res) => {
  try {
    const { workAreaId } = req.params;

    const workArea = await WorkArea.findById(workAreaId);

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
    const prompt = `You are creating a professional DAILY SAFETY TALK for workers. The talk must be practical, field-ready, and specific to the real work-area data below.

${professionalSafetyGuidance}
${miningContextGuidance}

## WORK AREA CONTEXT:
- Name: ${workArea.name}
- Location: ${workArea.location?.zone || "N/A"}
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
Generate a practical, professional 5-10 minute toolbox talk that:
1. Identifies why this topic matters today based on the evidence.
2. Addresses the most important current risk without exaggeration.
3. Links controls to actual hazards, incidents, or risk findings.
4. Tells supervisors exactly what to verify in the field.
5. Includes worker discussion questions that invite real participation.
6. Ends with a clear reminder that the safety officer/facilitator must review and adapt the talk before delivery.

## OUTPUT FORMAT (use exactly this structure):
# [Engaging Title]

## Opening Statement
[2-3 sentences explaining why this talk matters today]

## Main Safety Points
1. [Hazard or risk and what workers must do]
2. [Control measure and how it should be verified]
3. [Supervisor or team check before work starts]
4. [Environmental or housekeeping point if relevant]

## Discussion Questions
- [Question 1 for workers]
- [Question 2 for workers]
- [Question 3 for workers]

## Supervisor Verification
- [Specific item to check before or during work]
- [Specific evidence or observation expected]

## Key Takeaways
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

## Closing Reminder
[1-2 sentences, including that the facilitator must adapt this draft to actual site conditions]

Generate the talk in 220-320 words total. Be direct, professional, and specific to this work area.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: AI_MAX_TOKENS.safetyTalk,
    });

    const aiContent = completion.choices[0].message.content;

    const { title, sections } = parseSafetyTalkContent(aiContent);

    // Create safety talk
    const safetyTalk = new SafetyTalk({
      targetWorkAreas: [workAreaId],
      title: title || `Daily Safety Briefing - ${workArea.name}`,
      content: aiContent,
      duration: 5,
      topics: [activeHazards[0]?.hazard || "General Safety", "Daily Briefing"],
      sections,
      generatedBy: req.user._id,
      conductedBy: req.user._id,
      status: "draft",
      date: new Date(),
      aiGenerated: true,
      aiModel: AI_MODEL,
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
    await SafetyHub.findOneAndUpdate(
      { officerId: req.user._id, workArea: workArea._id },
      {
        $setOnInsert: { officerId: req.user._id, workArea: workArea._id },
        $addToSet: { "generatedDrafts.safetyTalks": safetyTalk._id },
      },
      { upsert: true },
    );

    await trackUsage({
      user: req.user?._id,
      workArea: workArea._id,
      eventType: "ai_generation",
      module: "safety_talk",
      description: "Safety talk draft generated",
      relatedModel: "SafetyTalk",
      relatedId: safetyTalk._id,
      metadata: {
        model: AI_MODEL,
        maxTokens: AI_MAX_TOKENS.safetyTalk,
        usage: completion.usage,
      },
    });

    // Add to work area's documents
    if (!workArea.documents) workArea.documents = {};
    if (!workArea.documents.safetyTalks) workArea.documents.safetyTalks = [];
    workArea.documents.safetyTalks.push(safetyTalk._id);
    await workArea.save();

    // Update work area statistics
    workArea.statistics.safetyTalks =
      (workArea.statistics.safetyTalks || 0) + 1;
    await workArea.save();

    req.flash(
      "success",
      "Safety talk draft generated successfully. Please review before use.",
    );
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
      .populate("targetWorkAreas", "name")
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
      reviewedBy: req.user._id,
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

exports.regenerateWithComments = async (req, res) => {
  try {
    const talk = await SafetyTalk.findById(req.params.id);
    const reviewComments = req.body.reviewComments?.trim();

    if (!talk) {
      req.flash("error", "Safety talk not found");
      return res.redirect("/dashboard");
    }

    if (!isSafetyOfficer(req.user)) {
      req.flash("error", "Only a safety officer can review a safety talk");
      return res.redirect(`/safety-talks/${talk._id}`);
    }

    if (talk.status === "published" || talk.review?.status === "confirmed") {
      req.flash("error", "This safety talk has already been approved");
      return res.redirect(`/safety-talks/${talk._id}`);
    }

    if (!reviewComments) {
      req.flash("error", "Enter safety officer comments before regenerating");
      return res.redirect(`/safety-talks/${talk._id}`);
    }

    if (reviewComments.length > 4000) {
      req.flash("error", "Safety officer comments must be 4000 characters or fewer");
      return res.redirect(`/safety-talks/${talk._id}`);
    }

    const prompt = `You are revising a professional DAILY SAFETY TALK after a safety officer review.

${professionalSafetyGuidance}
${miningContextGuidance}

## CURRENT SAFETY TALK DRAFT:
${talk.content}

## SAFETY OFFICER COMMENTS:
${reviewComments}

## YOUR TASK:
Revise the safety talk so the officer's comments are incorporated accurately. Preserve useful content, correct or add the site-specific details requested by the officer, and keep the document practical for workers. Do not mention the revision process or the comments in the final talk.

## OUTPUT FORMAT (use exactly this structure):
# [Engaging Title]

## Opening Statement
[2-3 sentences explaining why this talk matters today]

## Main Safety Points
1. [Hazard or risk and what workers must do]
2. [Control measure and how it should be verified]
3. [Supervisor or team check before work starts]
4. [Environmental or housekeeping point if relevant]

## Discussion Questions
- [Question 1 for workers]
- [Question 2 for workers]
- [Question 3 for workers]

## Supervisor Verification
- [Specific item to check before or during work]
- [Specific evidence or observation expected]

## Key Takeaways
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

## Closing Reminder
[1-2 sentences, including that the facilitator must adapt this draft to actual site conditions]

Generate the talk in 220-320 words total. Be direct, professional, and specific.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: AI_MAX_TOKENS.safetyTalk,
    });

    const aiContent = completion.choices[0].message.content;
    const { title, sections } = parseSafetyTalkContent(aiContent);
    const nextVersion = (talk.version || 1) + 1;

    talk.previousVersions.push({
      version: talk.version || 1,
      title: talk.title,
      content: talk.content,
      sections: talk.sections?.toObject?.() || talk.sections,
      officerComments: reviewComments,
      generatedAt: talk.generationDate || talk.createdAt,
    });
    talk.title = title || talk.title;
    talk.content = aiContent;
    talk.sections = sections;
    talk.version = nextVersion;
    talk.generationDate = new Date();
    talk.updatedBy = req.user._id;
    talk.review.status = "changes_required";
    talk.review.reviewedBy = req.user._id;
    talk.review.reviewedAt = new Date();
    talk.review.comments = reviewComments;
    talk.review.history.push({
      comments: reviewComments,
      submittedBy: req.user._id,
      submittedAt: new Date(),
      generatedVersion: nextVersion,
    });

    await talk.save();

    await trackUsage({
      user: req.user?._id,
      workArea: talk.targetWorkAreas?.[0],
      eventType: "ai_generation",
      module: "safety_talk",
      description: "Safety talk regenerated with safety officer comments",
      relatedModel: "SafetyTalk",
      relatedId: talk._id,
      metadata: {
        model: AI_MODEL,
        maxTokens: AI_MAX_TOKENS.safetyTalk,
        usage: completion.usage,
      },
    });

    req.flash(
      "success",
      `Safety talk regenerated as version ${nextVersion}. Review it again or approve the final version.`,
    );
    return res.redirect(`/safety-talks/${talk._id}`);
  } catch (error) {
    console.error("Error regenerating safety talk:", error);
    req.flash("error", "Error regenerating safety talk: " + error.message);
    return res.redirect(`/safety-talks/${req.params.id}`);
  }
};

exports.approveSafetyTalk = async (req, res) => {
  try {
    const talk = await SafetyTalk.findById(req.params.id);

    if (!talk) {
      req.flash("error", "Safety talk not found");
      return res.redirect("/dashboard");
    }

    if (!isSafetyOfficer(req.user)) {
      req.flash("error", "Only a safety officer can approve a safety talk");
      return res.redirect(`/safety-talks/${talk._id}`);
    }

    if (talk.status === "published" || talk.review?.status === "confirmed") {
      req.flash("success", "Safety talk is already approved");
      return res.redirect(`/safety-talks/${talk._id}`);
    }

    if (!talk.review?.history?.length) {
      req.flash(
        "error",
        "Regenerate the safety talk with safety officer comments before approval",
      );
      return res.redirect(`/safety-talks/${talk._id}`);
    }

    talk.status = "published";
    talk.review.status = "confirmed";
    talk.review.reviewedBy = req.user._id;
    talk.review.reviewedAt = new Date();
    talk.updatedBy = req.user._id;

    await talk.save();

    req.flash(
      "success",
      "Safety talk reviewed and confirmed. It is ready for use.",
    );
    return res.redirect(`/safety-talks/${talk._id}`);
  } catch (error) {
    console.error("Error confirming safety talk:", error);
    req.flash("error", "Error confirming safety talk");
    return res.redirect(`/safety-talks/${req.params.id}`);
  }
};

exports.downloadWord = async (req, res) => {
  try {
    const { id } = req.params;

    const talk = await SafetyTalk.findById(id)
      .populate("targetWorkAreas", "name")
      .populate("generatedBy", "name")
      .populate("conductedBy", "name")
      .populate(
        "basedOn.recentIncidents",
        "incidentNumber type severity description",
      );

    if (!talk) {
      return res.status(404).send("Safety talk not found");
    }

    if (talk.status !== "published" || talk.review?.status !== "confirmed") {
      req.flash("error", "Approve the final safety talk before downloading it");
      return res.redirect(`/safety-talks/${talk._id}`);
    }

    const buffer = await generateSafetyTalkWordBuffer({ talk });

    const safeNumber = talk.talkNumber || Date.now();
    const fileName = `safety_talk_${safeNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading Safety Talk Word document:", error);
    return res.status(500).send("Error generating Safety Talk Word document");
  }
};

