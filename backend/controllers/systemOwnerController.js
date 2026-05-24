const User = require("../models/User");
const Worksite = require("../models/Worksite");
const WorkArea = require("../models/WorkArea");
const SafetyOfficer = require("../models/SafetyOfficer");
const Incident = require("../models/Incident");
const SafetyTalk = require("../models/SafetyTalk");
const Alert = require("../models/Alert");
const UsageEvent = require("../models/UsageEvent");

function isSystemOwner(user) {
  const ownerEmails = String(process.env.SYSTEM_OWNER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return (
    user?.role === "system_owner" ||
    user?.isSystemOwner === true ||
    ownerEmails.includes(user?.email?.toLowerCase())
  );
}

exports.ensureSystemOwner = (req, res, next) => {
  if (req.isAuthenticated() && isSystemOwner(req.user)) {
    return next();
  }

  req.flash("error", "Access denied. System owner privileges required.");
  return res.redirect("/dashboard/admin");
};

exports.dashboard = async (req, res) => {
  try {
    const [
      companies,
      users,
      activeUsers,
      officers,
      worksites,
      workAreas,
      incidents,
      safetyTalks,
      alerts,
      aiGenerations,
      downloads,
      recentUsage,
    ] = await Promise.all([
      User.countDocuments({
        role: { $in: ["enterprise_admin", "system_admin"] },
        companyName: { $ne: null },
      }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      SafetyOfficer.countDocuments(),
      Worksite.countDocuments(),
      WorkArea.countDocuments(),
      Incident.countDocuments(),
      SafetyTalk.countDocuments(),
      Alert.countDocuments({ status: { $in: ["open", "acknowledged"] } }),
      UsageEvent.countDocuments({ eventType: "ai_generation" }),
      UsageEvent.countDocuments({ eventType: "download" }),
      UsageEvent.find()
        .populate("company", "companyName name email subscription")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    const companiesRaw = await User.find({
      role: { $in: ["enterprise_admin", "system_admin"] },
      companyName: { $ne: null },
    })
      .select("name email companyName subscription isActive createdAt")
      .sort({ createdAt: -1 })
      .limit(50);

    const companyList = await Promise.all(
      companiesRaw.map(async (company) => {
        const [userCount, incidentCount, aiGenerationCount] = await Promise.all([
          User.countDocuments({ $or: [{ _id: company._id }, { companyId: company._id }] }),
          UsageEvent.countDocuments({
            company: company._id,
            eventType: "incident_reported",
          }),
          UsageEvent.countDocuments({
            company: company._id,
            eventType: "ai_generation",
          }),
        ]);

        return {
          ...company.toObject(),
          userCount,
          incidentCount,
          aiGenerationCount,
        };
      }),
    );

    res.render("system-owner/dashboard", {
      user: req.user,
      stats: {
        companies,
        users,
        activeUsers,
        officers,
        worksites,
        workAreas,
        incidents,
        safetyTalks,
        alerts,
        aiGenerations,
        downloads,
      },
      companyList,
      recentUsage,
    });
  } catch (error) {
    console.error("Error loading system owner dashboard:", error);
    req.flash("error", "Error loading system owner dashboard");
    res.redirect("/dashboard/admin");
  }
};
