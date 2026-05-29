const Alert = require("../models/Alert");

exports.listAlerts = async (req, res) => {
  try {
    const query = {
      $or: [
        { createdBy: req.user._id },
        { "recipients.user": req.user._id },
        { "recipients.email": req.user.email },
      ],
    };

    const alerts = await Alert.find(query)
      .populate("workArea", "name")
      .sort({ createdAt: -1 })
      .limit(100);

    res.render("alerts/list", {
      user: req.user,
      alerts,
    });
  } catch (error) {
    console.error("Error loading alerts:", error);
    req.flash("error", "Error loading alerts");
    res.redirect("/dashboard/officer");
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      req.flash("error", "Alert not found");
      return res.redirect("/alerts");
    }

    alert.status = "acknowledged";
    alert.acknowledgedBy = req.user._id;
    alert.acknowledgedAt = new Date();
    await alert.save();

    req.flash("success", "Alert acknowledged");
    res.redirect("/alerts");
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    req.flash("error", "Error acknowledging alert");
    res.redirect("/alerts");
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      req.flash("error", "Alert not found");
      return res.redirect("/alerts");
    }

    alert.status = "resolved";
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    await alert.save();

    req.flash("success", "Alert resolved");
    res.redirect("/alerts");
  } catch (error) {
    console.error("Error resolving alert:", error);
    req.flash("error", "Error resolving alert");
    res.redirect("/alerts");
  }
};

