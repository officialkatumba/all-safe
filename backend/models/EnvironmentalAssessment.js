const mongoose = require("mongoose");
const Counter = require("./Counter");

const environmentalAssessmentSchema = new mongoose.Schema(
  {
    assessmentNumber: { type: Number, unique: true },
    worksite: { type: mongoose.Schema.Types.ObjectId, ref: "Worksite" },
    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },
    title: { type: String, required: true },
    activityDescription: { type: String, required: true },
    assessmentType: {
      type: String,
      enum: ["screening", "impact_register", "management_plan"],
      default: "screening",
    },
    receptors: [
      {
        type: {
          type: String,
          enum: [
            "water",
            "air",
            "soil",
            "biodiversity",
            "noise_vibration",
            "waste",
            "community",
            "heritage",
            "other",
          ],
        },
        description: String,
        sensitivity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
      },
    ],
    impacts: [
      {
        impact: { type: String, required: true },
        receptor: String,
        nature: {
          type: String,
          enum: ["negative", "positive", "mixed"],
          default: "negative",
        },
        likelihood: {
          type: String,
          enum: ["rare", "unlikely", "possible", "likely", "almost_certain"],
          default: "possible",
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        duration: {
          type: String,
          enum: ["short_term", "medium_term", "long_term", "permanent"],
          default: "short_term",
        },
        reversibility: {
          type: String,
          enum: ["reversible", "partly_reversible", "irreversible"],
          default: "reversible",
        },
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        mitigationMeasures: [String],
        monitoringRequirements: [String],
        responsiblePerson: String,
        targetDate: Date,
        status: {
          type: String,
          enum: ["open", "monitoring", "controlled", "closed"],
          default: "open",
        },
      },
    ],
    aiSummary: {
      executiveSummary: String,
      keyRisks: [String],
      recommendedActions: [String],
      monitoringPlan: [String],
      assumptionsAndGaps: [String],
    },
    approval: {
      status: {
        type: String,
        enum: ["draft", "under_review", "approved", "changes_required"],
        default: "draft",
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
      reviewedAt: Date,
      comments: String,
    },
    aiGenerated: { type: Boolean, default: false },
    aiModel: String,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

environmentalAssessmentSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "environmentalassessment" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    this.assessmentNumber = counter.seq + 7000;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model(
  "EnvironmentalAssessment",
  environmentalAssessmentSchema,
);
