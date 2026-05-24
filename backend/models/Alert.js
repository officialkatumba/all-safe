const mongoose = require("mongoose");
const Counter = require("./Counter");

const alertSchema = new mongoose.Schema(
  {
    alertNumber: { type: Number, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "incident",
        "near_miss",
        "environmental",
        "corrective_action",
        "permit",
        "risk_review",
        "safety_talk",
        "system",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    worksite: { type: mongoose.Schema.Types.ObjectId, ref: "Worksite" },
    workArea: { type: mongoose.Schema.Types.ObjectId, ref: "WorkArea" },
    relatedModel: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    actionUrl: String,
    recipients: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        safetyOfficer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        name: String,
        email: String,
        notifiedAt: Date,
        readAt: Date,
      },
    ],
    emailSent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["open", "acknowledged", "resolved", "archived"],
      default: "open",
    },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

alertSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "alert" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    this.alertNumber = counter.seq + 20000;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Alert", alertSchema);
