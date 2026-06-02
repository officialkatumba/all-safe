const mongoose = require("mongoose");
const Counter = require("./Counter");
const { addAiReviewFields } = require("../utils/aiReviewSchema");

const ohsComplianceAuditSchema = new mongoose.Schema(
  {
    auditNumber: { type: Number, unique: true },

    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    actName: {
      type: String,
      default: "Occupational Health and Safety Bill, 2025",
    },

    auditStatus: {
      type: String,
      enum: [
        "questions_generated",
        "responses_submitted",
        "score_generated",
        "archived",
      ],
      default: "questions_generated",
    },

    auditPeriod: {
      startDate: Date,
      endDate: Date,
      label: String,
    },

    legalRequirements: [
      {
        code: String,
        section: String,
        title: String,
        category: String,
        legalRequirement: String,

        questions: [
          {
            questionText: String,

            officerResponse: {
              complianceStatus: {
                type: String,
                enum: [
                  "not_answered",
                  "compliant",
                  "partially_compliant",
                  "non_compliant",
                  "not_applicable",
                ],
                default: "not_answered",
              },
              answerText: { type: String, default: "" },
              evidenceNote: { type: String, default: "" },
              correctiveAction: { type: String, default: "" },
              targetDate: Date,
              respondedAt: Date,
            },

            aiEvaluation: {
              complianceLevel: {
                type: String,
                enum: [
                  "compliant",
                  "partially_compliant",
                  "non_compliant",
                  "not_applicable",
                ],
              },
              scoreAwarded: { type: Number, default: 0 },
              maxScore: { type: Number, default: 10 },
              legalRisk: {
                type: String,
                enum: ["low", "medium", "high", "critical"],
              },
              evaluationComment: { type: String, default: "" },
              recommendation: { type: String, default: "" },
            },
          },
        ],
      },
    ],

    finalCompliance: {
      overallScore: { type: Number, min: 0, max: 100 },
      complianceGrade: {
        type: String,
        enum: [
          "highly_compliant",
          "compliant",
          "partially_compliant",
          "weak_compliance",
          "critical_non_compliance",
        ],
      },
      legalRiskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      executiveSummary: String,

      categoryScores: [
        {
          category: String,
          score: Number,
          maxScore: Number,
          percentage: Number,
          comment: String,
        },
      ],

      criticalNonCompliances: [String],
      partialCompliances: [String],
      strengths: [String],
      recommendations: [String],
      immediateActions: [String],
      followUpActions: [String],
      managementAdvice: String,
      scoredAt: Date,
    },

    evidenceUsed: {
      incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Incident" }],
      observations: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyObservation" },
      ],
      riskAssessments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },
      ],
      jsas: [{ type: mongoose.Schema.Types.ObjectId, ref: "JSA" }],
      ppeChecklists: [
        { type: mongoose.Schema.Types.ObjectId, ref: "PPEChecklist" },
      ],
      trainingRequirements: [
        { type: mongoose.Schema.Types.ObjectId, ref: "TrainingRequirement" },
      ],
      emergencyProtocols: [
        { type: mongoose.Schema.Types.ObjectId, ref: "EmergencyProtocol" },
      ],
      safetyTalks: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyTalk" },
      ],
      safetyInsights: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyInsight" },
      ],
      permits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permit" }],
    },

    dataCounts: {
      incidents: { type: Number, default: 0 },
      observations: { type: Number, default: 0 },
      riskAssessments: { type: Number, default: 0 },
      jsas: { type: Number, default: 0 },
      ppeChecklists: { type: Number, default: 0 },
      trainingRequirements: { type: Number, default: 0 },
      emergencyProtocols: { type: Number, default: 0 },
      safetyTalks: { type: Number, default: 0 },
      safetyInsights: { type: Number, default: 0 },
      permits: { type: Number, default: 0 },
    },

    aiGenerated: { type: Boolean, default: true },
    aiModel: { type: String, default: "gpt-4o-mini" },

    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

addAiReviewFields(ohsComplianceAuditSchema);

ohsComplianceAuditSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "ohscomplianceaudit" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );

      this.auditNumber = counter.seq + 10000;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

module.exports = mongoose.model("OHSComplianceAudit", ohsComplianceAuditSchema);
