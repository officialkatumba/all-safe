const WorkArea = require("../models/WorkArea");

function deny(req, res) {
  if (req.originalUrl.includes("/api/")) {
    return res.status(404).json({ error: "Resource not found" });
  }

  req.flash("error", "Resource not found");
  return res.redirect("/dashboard/officer");
}

function handleLookupError(error, req, res, next) {
  if (error?.name === "CastError") return deny(req, res);
  return next(error);
}

function ensureOwnedWorkArea(param = "workAreaId") {
  return async (req, res, next) => {
    try {
      const workArea = await WorkArea.findOne({
        _id: req.params[param],
        officerId: req.user._id,
      });

      if (!workArea) return deny(req, res);

      req.ownedWorkArea = workArea;
      return next();
    } catch (error) {
      return handleLookupError(error, req, res, next);
    }
  };
}

function ensureOwnedDocument(Model, options = {}) {
  const { param = "id", workAreaField = "workArea" } = options;

  return async (req, res, next) => {
    try {
      const document = await Model.findById(req.params[param]).select(workAreaField);
      if (!document) return deny(req, res);

      const workAreaIds = []
        .concat(document.get(workAreaField) || [])
        .filter(Boolean);

      const owned = await WorkArea.exists({
        _id: { $in: workAreaIds },
        officerId: req.user._id,
      });

      if (!owned) return deny(req, res);

      req.ownedDocument = document;
      return next();
    } catch (error) {
      return handleLookupError(error, req, res, next);
    }
  };
}

module.exports = { ensureOwnedDocument, ensureOwnedWorkArea };
