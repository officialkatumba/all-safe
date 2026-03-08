const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  role: {
    type: String,
    enum: ["system_admin", "safety_officer", "supervisor", "worker"],
    required: true,
  },
  safetyOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
  hadLoggedIn: { type: Boolean, default: false },

  // 🔐 Forgot/reset password fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// 🔑 Passport-Local Mongoose plugin
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  errorMessages: {
    UserExistsError: "A user with the given email already exists",
  },
});

module.exports = mongoose.model("User", userSchema);
