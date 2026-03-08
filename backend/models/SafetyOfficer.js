const mongoose = require("mongoose");
const Counter = require("./Counter");

const safetyOfficerSchema = new mongoose.Schema(
  {
    officerNumber: { type: Number, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    certifications: [
      {
        name: String,
        issuedBy: String,
        expiryDate: Date,
        verified: { type: Boolean, default: false },
      },
    ],

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "expired"],
      default: "pending",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    worksitesManaged: { type: Number, default: 0 },
    incidentsReported: { type: Number, default: 0 },
    safetyTalksConducted: { type: Number, default: 0 },

    bio: { type: String },
    profileImage: { type: String },

    worksites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worksite" }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  },
  { timestamps: true },
);

safetyOfficerSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "safetyofficer" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.officerNumber = counter.seq + 500;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("SafetyOfficer", safetyOfficerSchema);
