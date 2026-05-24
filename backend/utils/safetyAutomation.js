const cron = require("node-cron");
const Incident = require("../models/Incident");
const WorkArea = require("../models/WorkArea");
const SafetyTalk = require("../models/SafetyTalk");
const Alert = require("../models/Alert");
const { createAlert, getWorkAreaAlertRecipients } = require("./alertService");

async function createDraftTalkRecommendation(incident) {
  const existing = await SafetyTalk.findOne({
    "basedOn.recentIncidents": incident._id,
    status: "draft",
  });

  if (existing) return existing;

  const workArea = await WorkArea.findById(incident.workArea).populate(
    "worksite",
  );

  if (!workArea) return null;

  const title =
    incident.type === "near_miss"
      ? `Draft Safety Talk - Learning From Near Miss #${incident.incidentNumber}`
      : `Draft Safety Talk - Incident Learning #${incident.incidentNumber}`;

  const content = [
    `# ${title}`,
    "",
    "## Opening Statement",
    `A ${incident.severity} ${incident.type} was reported in ${workArea.name}. This draft is prepared for safety officer review before any toolbox talk is delivered.`,
    "",
    "## Main Safety Points",
    `1. Review what happened: ${incident.description}`,
    incident.immediateAction
      ? `2. Confirm immediate controls: ${incident.immediateAction}`
      : "2. Confirm immediate controls already taken and identify any remaining exposure.",
    "3. Ask workers to identify similar conditions before work starts.",
    "4. Reinforce supervisor verification and stop-work authority.",
    "",
    "## Discussion Questions",
    "- Where could this same event happen again in this work area?",
    "- What control must be checked before work starts?",
    "- What should workers report immediately?",
    "",
    "## Closing Reminder",
    "This is an AI-prepared draft. The safety officer must review, adapt, and approve the talk before use.",
  ].join("\n");

  return SafetyTalk.create({
    targetWorkAreas: [workArea._id],
    title,
    content,
    duration: 5,
    topics: [incident.type, "Incident learning", "Critical controls"],
    sections: {
      opening: `A ${incident.severity} ${incident.type} was reported in ${workArea.name}.`,
      mainPoints: [
        `Review what happened: ${incident.description}`,
        incident.immediateAction || "Confirm immediate controls.",
        "Identify similar conditions before work starts.",
      ],
      discussionQuestions: [
        "Where could this happen again?",
        "What control must be checked before work starts?",
        "What should workers report immediately?",
      ],
      keyTakeaways: [
        "Report early.",
        "Verify controls.",
        "Stop work if conditions are unsafe.",
      ],
      closing:
        "Safety officer must review, adapt, and approve this draft before use.",
    },
    generatedBy: incident.reviewedBy,
    status: "draft",
    aiGenerated: true,
    aiModel: "automation-rule",
    basedOn: {
      recentIncidents: [incident._id],
      aiReasoning:
        "Automatically drafted because a high-severity incident or near miss was reported.",
    },
  });
}

async function processIncidentDraftTalks() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const incidents = await Incident.find({
    createdAt: { $gte: since },
    severity: { $in: ["high", "critical", "fatality"] },
  }).limit(20);

  for (const incident of incidents) {
    await createDraftTalkRecommendation(incident);
  }
}

async function createCorrectiveActionReminders() {
  const now = new Date();
  const incidents = await Incident.find({
    "correctiveActions.completed": false,
    "correctiveActions.deadline": { $lt: now },
    status: { $nin: ["closed", "rejected"] },
  }).limit(50);

  for (const incident of incidents) {
    const existing = await Alert.findOne({
      type: "corrective_action",
      relatedId: incident._id,
      status: { $in: ["open", "acknowledged"] },
    });

    if (existing) continue;

    const { workArea, recipients } = await getWorkAreaAlertRecipients(
      incident.workArea,
    );

    await createAlert({
      title: `Overdue corrective action - Incident #${incident.incidentNumber}`,
      message:
        "One or more corrective actions are overdue and require safety officer follow-up.",
      type: "corrective_action",
      severity: "high",
      worksite: workArea?.worksite?._id || workArea?.worksite,
      workArea: incident.workArea,
      relatedModel: "Incident",
      relatedId: incident._id,
      actionUrl: `/incidents/${incident._id}`,
      recipients,
    });
  }
}

async function createNoRecentSafetyTalkReminders() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const workAreas = await WorkArea.find({ status: "active" }).limit(100);

  for (const workArea of workAreas) {
    const recentTalk = await SafetyTalk.findOne({
      targetWorkAreas: workArea._id,
      createdAt: { $gte: sevenDaysAgo },
    });

    if (recentTalk) continue;

    const existing = await Alert.findOne({
      type: "safety_talk",
      workArea: workArea._id,
      status: { $in: ["open", "acknowledged"] },
      createdAt: { $gte: sevenDaysAgo },
    });

    if (existing) continue;

    const recipientsData = await getWorkAreaAlertRecipients(workArea._id);

    await createAlert({
      title: `No recent safety talk - ${workArea.name}`,
      message:
        "This active work area has no safety talk recorded in the last 7 days.",
      type: "safety_talk",
      severity: "medium",
      worksite: workArea.worksite,
      workArea: workArea._id,
      actionUrl: `/work-areas/${workArea._id}`,
      recipients: recipientsData.recipients,
    });
  }
}

cron.schedule("*/30 * * * *", async () => {
  try {
    await processIncidentDraftTalks();
  } catch (error) {
    console.error("Incident draft safety talk automation failed:", error.message);
  }
});

cron.schedule("0 7 * * *", async () => {
  try {
    await createCorrectiveActionReminders();
  } catch (error) {
    console.error("Corrective action reminder automation failed:", error.message);
  }
});

cron.schedule("0 8 * * 1", async () => {
  try {
    await createNoRecentSafetyTalkReminders();
  } catch (error) {
    console.error("Safety talk reminder automation failed:", error.message);
  }
});

module.exports = {
  createDraftTalkRecommendation,
  processIncidentDraftTalks,
  createCorrectiveActionReminders,
  createNoRecentSafetyTalkReminders,
};
