exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();

  req.flash("error", "Please log in to access this page");
  return res.redirect("/api/users/login");
};

exports.ensureSafetyOfficer = exports.ensureAuthenticated;
exports.ensureAdmin = exports.ensureAuthenticated;
