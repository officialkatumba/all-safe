const SafetyObservation = require("../models/SafetyObservation");
const WorkArea = require("../models/WorkArea");
const User = require("../models/User");

// ========== CREATE OBSERVATION ==========
exports.createObservation = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const { type, description, recommendations } = req.body;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    const observation = new SafetyObservation({
      workArea: workAreaId,
      type,
      description,
      recommendations: recommendations || "",
      observedBy: req.user._id,
      status: "open",
      date: new Date(),
    });

    await observation.save();

    // Add to work area's documents
    if (!workArea.documents) workArea.documents = {};
    if (!workArea.documents.safetyObservations)
      workArea.documents.safetyObservations = [];
    workArea.documents.safetyObservations.push(observation._id);
    await workArea.save();

    // Update work area statistics
    workArea.statistics.safetyObservations =
      (workArea.statistics.safetyObservations || 0) + 1;
    workArea.statistics.openConcerns =
      (workArea.statistics.openConcerns || 0) + 1;
    await workArea.save();

    req.flash("success", "Safety observation recorded successfully!");
    res.redirect(`/safety-observations/${observation._id}`);
  } catch (error) {
    console.error("Error creating observation:", error);
    req.flash("error", "Error recording observation");
    res.redirect(`/work-areas/${req.params.workAreaId}`);
  }
};

// ========== VIEW SINGLE OBSERVATION ==========
exports.getObservation = async (req, res) => {
  try {
    const observation = await SafetyObservation.findById(req.params.id)
      .populate("workArea", "name")
      .populate("observedBy", "name email role");

    if (!observation) {
      req.flash("error", "Observation not found");
      return res.redirect("/dashboard");
    }

    res.render("safety-observations/view", {
      user: req.user,
      observation,
    });
  } catch (error) {
    console.error("Error viewing observation:", error);
    req.flash("error", "Error loading observation");
    res.redirect("/dashboard");
  }
};

// ========== LIST OBSERVATIONS (for safety officers) ==========
exports.getObservations = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    // Get work areas this officer manages
    const workAreas = await WorkArea.find({ officerId: req.user._id }).select("_id name");

    const workAreaIds = workAreas.map((wa) => wa._id);

    const query = { workArea: { $in: workAreaIds } };
    if (status && status !== "all") query.status = status;
    if (type && type !== "all") query.type = type;

    const observations = await SafetyObservation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("workArea", "name")
      .populate("observedBy", "name");

    const total = await SafetyObservation.countDocuments(query);

    const stats = {
      total: await SafetyObservation.countDocuments({
        workArea: { $in: workAreaIds },
      }),
      open: await SafetyObservation.countDocuments({
        workArea: { $in: workAreaIds },
        status: "open",
      }),
      inReview: await SafetyObservation.countDocuments({
        workArea: { $in: workAreaIds },
        status: "in_review",
      }),
      closed: await SafetyObservation.countDocuments({
        workArea: { $in: workAreaIds },
        status: "closed",
      }),
      positive: await SafetyObservation.countDocuments({
        workArea: { $in: workAreaIds },
        type: "positive",
      }),
      atRisk: await SafetyObservation.countDocuments({
        workArea: { $in: workAreaIds },
        type: "at_risk",
      }),
      condition: await SafetyObservation.countDocuments({
        workArea: { $in: workAreaIds },
        type: "condition",
      }),
    };

    res.render("safety-observations/list", {
      user: req.user,
      observations,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      filters: { status, type },
    });
  } catch (error) {
    console.error("Error getting observations:", error);
    req.flash("error", "Error loading observations");
    res.redirect("/dashboard");
  }
};

// ========== UPDATE OBSERVATION (add corrective actions, change status) ==========
exports.updateObservation = async (req, res) => {
  try {
    const observation = await SafetyObservation.findById(req.params.id);

    if (!observation) {
      req.flash("error", "Observation not found");
      return res.redirect("/dashboard");
    }

    const { correctiveActions, status, recommendations } = req.body;

    if (correctiveActions) observation.correctiveActions = correctiveActions;
    if (status) observation.status = status;
    if (recommendations) observation.recommendations = recommendations;

    // If closing, update work area statistics
    if (status === "closed" && observation.status !== "closed") {
      const workArea = await WorkArea.findById(observation.workArea);
      if (workArea) {
        workArea.statistics.openConcerns = Math.max(
          0,
          (workArea.statistics.openConcerns || 0) - 1,
        );
        workArea.statistics.resolvedConcerns =
          (workArea.statistics.resolvedConcerns || 0) + 1;
        await workArea.save();
      }
    }

    await observation.save();

    req.flash("success", "Observation updated successfully!");
    res.redirect(`/safety-observations/${observation._id}`);
  } catch (error) {
    console.error("Error updating observation:", error);
    req.flash("error", "Error updating observation");
    res.redirect(`/safety-observations/${req.params.id}`);
  }
};

// ========== GET OBSERVATIONS FOR WORK AREA (API) ==========
exports.getWorkAreaObservations = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const observations = await SafetyObservation.find({ workArea: workAreaId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, observations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== CREATE OBSERVATION FORM ==========
exports.showCreateForm = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const workArea = await WorkArea.findById(workAreaId);

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }

    res.render("safety-observations/create", {
      user: req.user,
      workArea,
    });
  } catch (error) {
    console.error("Error loading form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

