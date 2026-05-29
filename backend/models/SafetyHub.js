const mongoose = require("mongoose");

const safetyHubSchema = new mongoose.Schema(
  {
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
      index: true,
    },
    rawInputs: [
      {
        source: {
          type: String,
          enum: ["whatsapp", "verbal", "field_note", "incident", "near_miss", "hazard", "other"],
          default: "field_note",
        },
        content: { type: String, required: true },
        reportedBy: String,
        capturedAt: { type: Date, default: Date.now },
        tags: [String],
      },
    ],
    generatedDrafts: {
      riskAssessments: [{ type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" }],
      jsas: [{ type: mongoose.Schema.Types.ObjectId, ref: "JSA" }],
      safetyTalks: [{ type: mongoose.Schema.Types.ObjectId, ref: "SafetyTalk" }],
      otherDocuments: [
        {
          documentType: String,
          title: String,
          content: String,
          model: String,
          generatedAt: { type: Date, default: Date.now },
        },
      ],
    },
    summary: {
      hazards: [String],
      incidentReports: [String],
      nearMisses: [String],
      workerFeedback: [String],
      lastAiSummary: String,
      lastUpdated: { type: Date, default: Date.now },
    },
  },
  { timestamps: true },
);

safetyHubSchema.index({ officerId: 1, workArea: 1 }, { unique: true });

module.exports = mongoose.model("SafetyHub", safetyHubSchema);


