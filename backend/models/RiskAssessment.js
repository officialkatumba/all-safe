const mongoose = require("mongoose");
const Counter = require("./Counter");

const riskAssessmentSchema = new mongoose.Schema(
  {
    assessmentNumber: { type: Number, unique: true },

    // Core relationships
    worksite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worksite",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SafetyOfficer",
      required: true,
    },

    // Basic info
    title: { type: String, required: true },
    description: String,
    assessmentDate: { type: Date, default: Date.now },
    reviewDate: Date,

    // Type of assessment
    assessmentType: {
      type: String,
      enum: [
        "general",
        "task_specific",
        "chemical",
        "biological",
        "physical",
        "ergonomic",
        "psychosocial",
      ],
      default: "general",
    },

    // Scope
    scope: {
      departments: [String],
      shifts: [
        { type: String, enum: ["morning", "afternoon", "night", "all"] },
      ],
      tasks: [String],
      locations: [String],
    },

    // Hazards identified and risk ratings
    hazards: [
      {
        hazardId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        description: { type: String, required: true },
        category: String,

        // Risk matrix before controls
        initialRisk: {
          likelihood: {
            type: String,
            enum: ["rare", "unlikely", "possible", "likely", "almost_certain"],
          },
          consequence: {
            type: String,
            enum: [
              "insignificant",
              "minor",
              "moderate",
              "major",
              "catastrophic",
            ],
          },
          riskLevel: {
            type: String,
            enum: ["low", "medium", "high", "extreme"],
          },
          riskScore: Number, // 1-25 matrix score
        },

        // Controls implemented
        controls: [
          {
            measure: String,
            type: {
              type: String,
              enum: [
                "elimination",
                "substitution",
                "engineering",
                "administrative",
                "ppe",
              ],
            },
            responsibleParty: String,
            implementationDate: Date,
            effectiveness: {
              type: String,
              enum: ["effective", "partially_effective", "ineffective"],
            },
          },
        ],

        // Residual risk after controls
        residualRisk: {
          likelihood: {
            type: String,
            enum: ["rare", "unlikely", "possible", "likely", "almost_certain"],
          },
          consequence: {
            type: String,
            enum: [
              "insignificant",
              "minor",
              "moderate",
              "major",
              "catastrophic",
            ],
          },
          riskLevel: {
            type: String,
            enum: ["low", "medium", "high", "extreme"],
          },
          riskScore: Number,
          acceptable: { type: Boolean, default: false },
        },

        // Additional info
        affectedPersons: [String],
        existingMeasures: String,
        additionalNotes: String,

        // Status
        status: {
          type: String,
          enum: ["active", "mitigated", "monitoring"],
          default: "active",
        },
      },
    ],

    // Risk matrix visualization data
    riskMatrix: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Overall assessment
    overallFindings: String,
    recommendations: [String],

    // Action plan
    actionPlan: [
      {
        action: String,
        priority: { type: String, enum: ["high", "medium", "low"] },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        deadline: Date,
        completed: { type: Boolean, default: false },
        completedDate: Date,
        verificationRequired: Boolean,
      },
    ],

    // Approvals
    approvals: [
      {
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        approvedAt: Date,
        comments: String,
        signature: String,
      },
    ],

    // Related documents
    relatedIncidents: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
    ],
    relatedSafetyTalks: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SafetyTalk" },
    ],

    // Attachments
    attachments: [
      {
        name: String,
        url: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // AI assistance
    aiGenerated: { type: Boolean, default: false },
    aiModel: String,
    aiContextUsed: {
      siteHistory: Boolean,
      pastIncidents: Boolean,
      previousAssessments: Boolean,
    },

    // Version control
    version: { type: Number, default: 1 },
    supersedes: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },

    // Status
    status: {
      type: String,
      enum: ["draft", "under_review", "approved", "active", "archived"],
      default: "draft",
    },
  },
  { timestamps: true },
);

// Auto-increment assessment number
riskAssessmentSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "riskassessment" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.assessmentNumber = counter.seq + 2000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("RiskAssessment", riskAssessmentSchema);
