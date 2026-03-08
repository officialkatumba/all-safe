// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) return next();
//   res.redirect("/api/users/login");
// }

// module.exports = ensureAuthenticated;

// Middleware to check if user is authenticated
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Please log in to access this page");
  res.redirect("/api/users/login");
};

// Middleware to check if user is admin
exports.ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "system_admin") {
    return next();
  }
  req.flash("error", "Access denied. Admin privileges required.");
  res.redirect("/dashboard");
};

// Middleware to check if user is safety officer
exports.ensureSafetyOfficer = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "safety_officer") {
    return next();
  }
  req.flash("error", "Access denied. Safety officer privileges required.");
  res.redirect("/dashboard");
};
