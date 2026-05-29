const mongoose = require("mongoose");
const Counter = require("./Counter");

const emergencyProtocolSchema = new mongoose.Schema(
  {
    protocolNumber: {
      type: Number,
      unique: true,
    },

    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    periodCovered: {
      startDate: Date,
      endDate: Date,
      label: String,
    },

    summary: {
      type: String,
      default: "",
    },

    emergencyRiskAssessment: {
      type: String,
      required: true,
    },

    emergencyResponseProcedures: {
      type: String,
      required: true,
    },

    evacuationPlan: {
      type: String,
      default: "",
    },

    communicationPlan: {
      type: String,
      default: "",
    },

    requiredEquipment: [String],

    requiredTraining: [String],

    priorityLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    emergencyTypesCovered: [String],

    recommendedActions: [String],

    evidenceUsed: {
      incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Incident" }],
      safetyObservations: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyObservation" },
      ],
      riskAssessments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },
      ],
      jsas: [{ type: mongoose.Schema.Types.ObjectId, ref: "JSA" }],
      safetyTalks: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyTalk" },
      ],
      ppeChecklists: [
        { type: mongoose.Schema.Types.ObjectId, ref: "PPEChecklist" },
      ],
      trainingRequirements: [
        { type: mongoose.Schema.Types.ObjectId, ref: "TrainingRequirement" },
      ],
    },

    dataCounts: {
      incidents: { type: Number, default: 0 },
      observations: { type: Number, default: 0 },
      riskAssessments: { type: Number, default: 0 },
      jsas: { type: Number, default: 0 },
      safetyTalks: { type: Number, default: 0 },
      ppeChecklists: { type: Number, default: 0 },
      trainingRequirements: { type: Number, default: 0 },
    },

    aiGenerated: {
      type: Boolean,
      default: true,
    },

    aiModel: {
      type: String,
      default: "gpt-3.5-turbo-16k",
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["generated", "reviewed", "archived"],
      default: "generated",
    },
  },
  { timestamps: true },
);

emergencyProtocolSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "emergencyprotocol" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );

      this.protocolNumber = counter.seq + 8000;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

module.exports = mongoose.model("EmergencyProtocol", emergencyProtocolSchema);
