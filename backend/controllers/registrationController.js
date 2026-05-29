const User = require("../models/User");

exports.showRegistrationOptions = (req, res) => {
  res.render("registration/options");
};

exports.showSafetyOfficerForm = (req, res) => {
  res.render("registration/solo", {
    title: "Create Safety Officer Account",
  });
};

exports.registerSafetyOfficer = async (req, res) => {
  try {
    const { name, email, phone, bio, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      req.flash("error", "Name, email, and password are required");
      return res.redirect("/register/safety-officer");
    }

    if (confirmPassword && password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/register/safety-officer");
    }

    if (password.length < 6) {
      req.flash("error", "Password must be at least 6 characters long");
      return res.redirect("/register/safety-officer");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash("error", "A user with this email already exists");
      return res.redirect("/register/safety-officer");
    }

    await new Promise((resolve, reject) => {
      User.register(
        new User({
          email,
          name,
          phone: phone || "",
          bio: bio || "",
          isActive: true,
        }),
        password,
        (err, user) => {
          if (err) return reject(err);
          resolve(user);
        },
      );
    });

    req.flash("success", "Your Safety Officer account is ready. You can log in now.");
    return res.redirect("/api/users/login");
  } catch (error) {
    console.error("Safety officer registration error:", error);
    req.flash("error", `Registration failed: ${error.message}`);
    return res.redirect("/register/safety-officer");
  }
};

