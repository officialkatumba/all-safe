const passport = require("passport");
const crypto = require("crypto");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { trackUsage } = require("../utils/usageTracker");

exports.showLoginForm = (req, res) => {
  res.render("login");
};

exports.loginUser = (req, res, next) => {
  passport.authenticate("local", async (err, user) => {
    if (err) return next(err);

    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/api/users/login");
    }

    req.logIn(user, async (loginError) => {
      if (loginError) return next(loginError);

      try {
        await trackUsage({
          user: user._id,
          eventType: "login",
          module: "auth",
          description: "User logged in",
        });

        user.hadLoggedIn = true;
        await user.save();

        req.flash("success", `Welcome back, ${user.name || user.email}!`);
        return res.redirect("/dashboard/officer");
      } catch (error) {
        console.error("Login error:", error);
        req.flash("error", "Unexpected error occurred during login.");
        return res.redirect("/api/users/login");
      }
    });
  })(req, res, next);
};

exports.logoutUser = (req, res) => {
  req.logout(() => {
    req.flash("success", "You have been logged out.");
    res.redirect("/api/users/login");
  });
};

exports.showChangePasswordForm = (req, res) => {
  res.render("change-password", {
    title: "Change Password",
    success: req.flash("success"),
    error: req.flash("error"),
  });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash("error", "New passwords do not match");
      return res.redirect("/api/users/change-password");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/api/users/change-password");
    }

    const authenticatedUser = await new Promise((resolve) => {
      user.authenticate(currentPassword, (err, thisModel, passwordError) => {
        if (err || passwordError || !thisModel) return resolve(null);
        resolve(thisModel);
      });
    });

    if (!authenticatedUser) {
      req.flash("error", "Current password is incorrect");
      return res.redirect("/api/users/change-password");
    }

    await new Promise((resolve, reject) => {
      user.setPassword(newPassword, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await user.save();
    req.flash("success", "Password changed successfully");
    res.redirect("/api/users/change-password");
  } catch (err) {
    console.error("Password change error:", err);
    req.flash("error", "Error changing password");
    res.redirect("/api/users/change-password");
  }
};

exports.showForgotForm = (req, res) => {
  res.render("forgot-password", {
    title: "Forgot Password",
    error: req.query.error,
    success: req.query.success,
  });
};

exports.requestResetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect("/api/users/forgot-password?error=User+not+found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${req.protocol}://${req.headers.host}/api/users/reset-password/${token}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      text: `You requested a password reset.\n\nClick the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, you can ignore the email.`,
    });

    return res.redirect(
      "/api/users/forgot-password?success=Reset+link+sent+to+your+email",
    );
  } catch (err) {
    console.error("Error sending reset email:", err);
    return res.redirect(
      "/api/users/forgot-password?error=Error+processing+request",
    );
  }
};

exports.showResetForm = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.redirect(
      "/api/users/forgot-password?error=Invalid+or+expired+reset+token",
    );
  }

  res.render("reset-password", {
    token,
    email: user.email,
    error: req.query.error,
    success: req.query.success,
  });
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    req.flash("error", "Passwords do not match");
    return res.redirect(`/api/users/reset-password/${token}`);
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Invalid or expired reset token");
      return res.redirect("/api/users/forgot-password");
    }

    await new Promise((resolve, reject) => {
      user.setPassword(newPassword, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash("success", "Password reset successfully");
    res.redirect("/api/users/login");
  } catch (err) {
    console.error("Reset error:", err);
    req.flash("error", "Unexpected error occurred");
    res.redirect(`/api/users/reset-password/${token}`);
  }
};

