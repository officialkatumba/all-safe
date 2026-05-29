const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    hadLoggedIn: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual("role").get(function () {
  return "safety_officer";
});

userSchema.virtual("safetyOfficer").get(function () {
  return this._id;
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  errorMessages: {
    UserExistsError: "A user with the given email already exists",
  },
});

userSchema.methods.isSafetyOfficer = function () {
  return true;
};

module.exports = mongoose.model("User", userSchema);
