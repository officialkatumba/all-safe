const mongoose = require("mongoose");
const Counter = require("./Counter");

const safetyInsightSchema = new mongoose.Schema(
  {
    insightNumber: {
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

    // Part 1
    safetyConcernsAndObservations: {
      type: String,
      required: true,
    },

    // Part 2
    actionableRecommendations: {
      type: String,
      required: true,
    },

    priorityLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    recommendedFocusAreas: [String],

    recommendedDocumentActions: {
      regenerateRiskAssessment: {
        type: Boolean,
        default: false,
      },
      reviewRiskAssessment: {
        type: Boolean,
        default: false,
      },
      generateOrReviewJSA: {
        type: Boolean,
        default: false,
      },
      generateSafetyTalk: {
        type: Boolean,
        default: false,
      },
      reviewCorrectiveActions: {
        type: Boolean,
        default: false,
      },
    },

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
    },

    dataCounts: {
      incidents: { type: Number, default: 0 },
      nearMisses: { type: Number, default: 0 },
      observations: { type: Number, default: 0 },
      atRiskObservations: { type: Number, default: 0 },
      positiveObservations: { type: Number, default: 0 },
      riskAssessments: { type: Number, default: 0 },
      jsas: { type: Number, default: 0 },
      safetyTalks: { type: Number, default: 0 },
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

safetyInsightSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "safetyinsight" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );

      this.insightNumber = counter.seq + 7000;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

module.exports = mongoose.model("SafetyInsight", safetyInsightSchema);
