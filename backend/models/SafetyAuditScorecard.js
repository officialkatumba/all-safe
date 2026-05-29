const mongoose = require("mongoose");
const Counter = require("./Counter");

const safetyAuditScorecardSchema = new mongoose.Schema(
  {
    auditNumber: {
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

    auditSections: [
      {
        sectionName: {
          type: String,
          required: true,
        },

        sectionDescription: {
          type: String,
          default: "",
        },

        sourceDocuments: [String],

        questions: [
          {
            questionText: {
              type: String,
              required: true,
            },

            whyItMatters: {
              type: String,
              default: "",
            },

            evidenceFound: {
              type: String,
              default: "",
            },

            concernLevel: {
              type: String,
              enum: ["low", "medium", "high", "critical"],
              default: "medium",
            },

            expectedGoodResponse: {
              type: String,
              default: "",
            },

            officerResponse: {
              status: {
                type: String,
                enum: [
                  "not_answered",
                  "fixed",
                  "in_progress",
                  "not_fixed",
                  "not_applicable",
                ],
                default: "not_answered",
              },

              answerText: {
                type: String,
                default: "",
              },

              evidenceNote: {
                type: String,
                default: "",
              },

              respondedAt: Date,
            },

            aiEvaluation: {
              responseQuality: {
                type: String,
                enum: ["poor", "fair", "good", "excellent", "not_applicable"],
              },

              scoreAwarded: {
                type: Number,
                default: 0,
              },

              maxScore: {
                type: Number,
                default: 10,
              },

              evaluationComment: {
                type: String,
                default: "",
              },
            },
          },
        ],
      },
    ],

    finalScore: {
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
      },

      grade: {
        type: String,
        enum: [
          "excellent",
          "good",
          "needs_improvement",
          "weak",
          "critical_attention_required",
        ],
      },

      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },

      scoreSummary: {
        type: String,
        default: "",
      },

      sectionScores: [
        {
          sectionName: String,
          score: Number,
          maxScore: Number,
          percentage: Number,
          comment: String,
        },
      ],

      criticalFindings: [String],
      positiveFindings: [String],
      recommendations: [String],
      immediateActions: [String],
      followUpActions: [String],
      managementDecisionAdvice: String,

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

    aiGenerated: {
      type: Boolean,
      default: true,
    },

    aiModel: {
      type: String,
      default: "gpt-3.5-turbo-16k",
    },

    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

safetyAuditScorecardSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "safetyauditscorecard" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );

      this.auditNumber = counter.seq + 9000;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

module.exports = mongoose.model(
  "SafetyAuditScorecard",
  safetyAuditScorecardSchema,
);
