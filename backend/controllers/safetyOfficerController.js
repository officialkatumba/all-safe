const passport = require("passport");
const SafetyOfficer = require("../models/SafetyOfficer");
const User = require("../models/User");
const Counter = require("../models/Counter");

// GET: Show safety officer registration form
exports.showRegisterSafetyOfficerForm = (req, res) => {
  res.render("safety-officer/register");
};

// POST: Handle safety officer registration
exports.registerSafetyOfficer = async (req, res) => {
  try {
    const { name, email, password, phone, bio } = req.body;

    // Basic validation
    if (!name || !email || !password || !phone) {
      req.flash("error", "All required fields must be filled");
      return res.redirect("/safety-officers/register");
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email already registered");
      return res.redirect("/safety-officers/register");
    }

    // Create User first
    const user = await new Promise((resolve, reject) => {
      User.register(
        new User({
          email,
          role: "safety_officer",
        }),
        password,
        (err, user) => {
          if (err) return reject(err);
          resolve(user);
        },
      );
    });

    // Create Safety Officer
    const newSafetyOfficer = new SafetyOfficer({
      name,
      email,
      phone,
      bio: bio || "",
      user: user._id,
    });

    await newSafetyOfficer.save();

    // Link User to SafetyOfficer
    user.safetyOfficer = newSafetyOfficer._id;
    await user.save();

    req.flash("success", "Registration successful! Please log in.");
    return res.redirect("/api/users/login");
  } catch (error) {
    console.error("Registration Error:", error);
    req.flash("error", "Registration failed. Please try again.");
    return res.redirect("/safety-officers/register");
  }
};
