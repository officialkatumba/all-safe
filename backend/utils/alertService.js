const Alert = require("../models/Alert");
const User = require("../models/User");
const WorkArea = require("../models/WorkArea");
const SafetyOfficer = require("../models/SafetyOfficer");
const sendEmail = require("./sendEmail");
const { trackUsage } = require("./usageTracker");

function uniqueRecipients(recipients) {
  const seen = new Set();
  return recipients.filter((recipient) => {
    if (!recipient.email) return false;
    const key = recipient.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function configuredAlertEmails() {
  return String(process.env.SAFETY_ALERT_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email, name: "Configured Alert Recipient" }));
}

async function getWorkAreaAlertRecipients(workAreaId) {
  const workArea = await WorkArea.findById(workAreaId)
    .populate("worksite")
    .populate("assignedSafetyOfficers.officer");

  if (!workArea) return { workArea: null, recipients: configuredAlertEmails() };

  const recipients = configuredAlertEmails();

  for (const assignment of workArea.assignedSafetyOfficers || []) {
    if (assignment.officer?.email) {
      recipients.push({
        safetyOfficer: assignment.officer._id,
        name: assignment.officer.name,
        email: assignment.officer.email,
      });
    }
  }

  if (workArea.worksite?.assignedSafetyOfficers?.length) {
    const officerIds = workArea.worksite.assignedSafetyOfficers
      .map((assignment) => assignment.officer)
      .filter(Boolean);
    const officers = await SafetyOfficer.find({ _id: { $in: officerIds } });
    officers.forEach((officer) => {
      recipients.push({
        safetyOfficer: officer._id,
        name: officer.name,
        email: officer.email,
      });
    });
  }

  const companyAdmins = await User.find({
    role: { $in: ["enterprise_admin", "system_admin"] },
    $or: [
      { _id: workArea.worksite?.ownership?.createdBy },
      { _id: workArea.worksite?.createdBy },
      { companyName: workArea.worksite?.clientName },
    ],
  }).select("name email");

  companyAdmins.forEach((admin) => {
    recipients.push({ user: admin._id, name: admin.name, email: admin.email });
  });

  return { workArea, recipients: uniqueRecipients(recipients) };
}

async function sendAlertEmail(alert) {
  if (!alert.recipients?.length) return false;

  const to = alert.recipients
    .map((recipient) => recipient.email)
    .filter(Boolean)
    .join(",");

  if (!to) return false;

  const body = [
    "URGENT TRUE SAFE ALERT",
    "Immediate review is required.",
    "",
    alert.title,
    "",
    alert.message,
    "",
    `Severity: ${alert.severity}`,
    alert.actionUrl ? `Review link: ${alert.actionUrl}` : "",
    "",
    "Required action: Open the alert, confirm the situation, assign immediate controls, and document the safety officer review.",
    "",
    "This notification is an operational alert. A competent safety or environmental officer must review and decide the final action.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendEmail({
      to,
      subject: `[URGENT TRUE SAFE ${alert.severity.toUpperCase()}] ${alert.title}`,
      text: body,
    });
    alert.emailSent = true;
    alert.recipients.forEach((recipient) => {
      recipient.notifiedAt = new Date();
    });
    await alert.save();
    return true;
  } catch (error) {
    console.error("Alert email failed:", error.message);
    return false;
  }
}

async function createAlert(data) {
  const alert = await Alert.create(data);
  await sendAlertEmail(alert);
  await trackUsage({
    company: data.metadata?.company,
    user: data.createdBy,
    worksite: data.worksite,
    workArea: data.workArea,
    eventType: "alert_created",
    module: data.type,
    description: data.title,
    relatedModel: data.relatedModel,
    relatedId: data.relatedId,
    metadata: { severity: data.severity },
  });
  return alert;
}

async function createIncidentAlert({ incident, createdBy }) {
  const alertSeverity =
    incident.severity === "fatality" || incident.severity === "critical"
      ? "critical"
      : "high";

  const { workArea, recipients } = await getWorkAreaAlertRecipients(
    incident.workArea,
  );

  const title = `${incident.severity?.toUpperCase() || "HIGH"} ${incident.type} reported`;
  const message = [
    `Incident #${incident.incidentNumber || "N/A"} was reported in ${workArea?.name || "the work area"}.`,
    `Type: ${incident.type}`,
    `Severity: ${incident.severity}`,
    `Description: ${incident.description}`,
    incident.immediateAction ? `Immediate action: ${incident.immediateAction}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return createAlert({
    title,
    message,
    type: incident.type === "environmental" ? "environmental" : "incident",
    severity: alertSeverity,
    worksite: workArea?.worksite?._id || workArea?.worksite,
    workArea: incident.workArea,
    relatedModel: "Incident",
    relatedId: incident._id,
    actionUrl: `/incidents/${incident._id}`,
    recipients,
    createdBy,
  });
}

function shouldAlertForIncident(incident) {
  return (
    ["high", "critical", "fatality"].includes(incident.severity) ||
    incident.type === "environmental"
  );
}

module.exports = {
  createAlert,
  createIncidentAlert,
  getWorkAreaAlertRecipients,
  shouldAlertForIncident,
};
