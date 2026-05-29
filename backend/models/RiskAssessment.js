const mongoose = require("mongoose");
const Counter = require("./Counter");

const riskAssessmentSchema = new mongoose.Schema(
  {
    assessmentNumber: { type: Number, unique: true },

    // Core relationship - points to WorkArea
    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },

    // Basic info
    title: { type: String, required: true },
    description: String,
    assessmentDate: { type: Date, default: Date.now },
    reviewDate: Date,

    // Scope of assessment
    scope: {
      type: {
        type: String,
        enum: ["area_wide", "task_specific", "equipment_specific"],
        default: "area_wide",
      },
      workTypes: [String],
      tasks: [String],
      equipment: [String],
      shifts: [
        { type: String, enum: ["morning", "afternoon", "night", "all"] },
      ],
    },

    // Assessment team
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: String,
      },
    ],

    // Hazards identified and risk ratings
    hazards: [
      {
        hazardId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        description: { type: String, required: true },
        category: {
          type: String,
          enum: [
            "physical",
            "chemical",
            "biological",
            "ergonomic",
            "psychosocial",
            "electrical",
            "mechanical",
          ],
        },
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
          riskScore: Number,
          justification: String,
        },
        controls: [
          {
            measure: { type: String, required: true },
            type: {
              type: String,
              enum: [
                "elimination",
                "substitution",
                "engineering",
                "administrative",
                "ppe",
                "training",
              ],
            },
            responsibleParty: String,
            implementationDate: Date,
            effectiveness: {
              type: String,
              enum: [
                "effective",
                "partially_effective",
                "ineffective",
                "pending",
              ],
            },
            verifiedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            verifiedAt: Date,
          },
        ],
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
          justification: String,
        },
        affectedGroups: [
          {
            group: {
              type: String,
              enum: [
                "workers",
                "supervisors",
                "contractors",
                "visitors",
                "public",
              ],
            },
            count: Number,
            details: String,
          },
        ],
        status: {
          type: String,
          enum: ["active", "mitigated", "monitoring", "closed"],
          default: "active",
        },
        reviewRequired: { type: Boolean, default: false },
        nextReviewDate: Date,
        additionalNotes: String,
        references: [String],
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
    summary: String,
    recommendations: [String],

    // Action plan
    actionPlan: [
      {
        action: { type: String, required: true },
        priority: { type: String, enum: ["high", "medium", "low"] },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        deadline: Date,
        completed: { type: Boolean, default: false },
        completedDate: Date,
        completionNotes: String,
        verificationRequired: { type: Boolean, default: false },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        verifiedAt: Date,
      },
    ],

    // Approvals
    approvalWorkflow: {
      required: { type: Boolean, default: true },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "changes_requested"],
        default: "pending",
      },
      approvals: [
        {
          approver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          approvedAt: Date,
          comments: String,
          signature: String,
        },
      ],
      requestedChanges: String,
    },

    // Related documents
    relatedDocuments: {
      incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Incident" }],
      safetyTalks: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyTalk" },
      ],
      permits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permit" }],
      jsas: [{ type: mongoose.Schema.Types.ObjectId, ref: "JSA" }],
    },

    // Attachments
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ========== NEW: HUMAN WRITTEN SECTIONS (from guided form) ==========
    humanSections: {
      type: {
        ExecutiveSummary: { type: String, default: "" },
        ScopeMethodology: { type: String, default: "" },
        DetailedHazardAnalysis: { type: String, default: "" },
        RiskMatrixSummary: { type: String, default: "" },
        ControlMeasuresSummary: { type: String, default: "" },
        EmergencyProcedures: { type: String, default: "" },
        MonitoringReview: { type: String, default: "" },
        ActionPlan: { type: String, default: "" },
        Approvals: { type: String, default: "" },
      },
      default: {},
    },

    // ========== NEW: AI ENHANCED SECTIONS ==========
    aiSections: {
      type: {
        ExecutiveSummary: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        ScopeMethodology: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        DetailedHazardAnalysis: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        RiskMatrixSummary: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        ControlMeasuresSummary: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        EmergencyProcedures: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        MonitoringReview: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        ActionPlan: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        Approvals: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
      },
      default: {},
    },

    // ========== NEW: Which version is active for each section ==========
    activeVersion: {
      type: {
        ExecutiveSummary: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        ScopeMethodology: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        DetailedHazardAnalysis: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        RiskMatrixSummary: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        ControlMeasuresSummary: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        EmergencyProcedures: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        MonitoringReview: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        ActionPlan: { type: String, enum: ["human", "ai"], default: "human" },
        Approvals: { type: String, enum: ["human", "ai"], default: "human" },
      },
      default: {},
    },

    // ========== NEW: Section confirmation status ==========
    sectionConfirmed: {
      type: {
        ExecutiveSummary: { type: Boolean, default: false },
        ScopeMethodology: { type: Boolean, default: false },
        DetailedHazardAnalysis: { type: Boolean, default: false },
        RiskMatrixSummary: { type: Boolean, default: false },
        ControlMeasuresSummary: { type: Boolean, default: false },
        EmergencyProcedures: { type: Boolean, default: false },
        MonitoringReview: { type: Boolean, default: false },
        ActionPlan: { type: Boolean, default: false },
        Approvals: { type: Boolean, default: false },
      },
      default: {},
    },

    // ========== NEW: Consolidated Assessment ==========
    consolidatedAssessment: {
      content: { type: String, default: "" },
      pdfUrl: { type: String, default: "" },
      pdfUploaded: { type: Boolean, default: false },
      generatedAt: Date,
    },

    // ========== NEW: Overall Status ==========
    overallStatus: {
      allSectionsConfirmed: { type: Boolean, default: false },
      consolidatedGenerated: { type: Boolean, default: false },
    },

    // ========== END NEW FIELDS ==========

    // AI assistance (legacy)
    aiGenerated: { type: Boolean, default: false },
    aiModel: String,
    aiContextUsed: {
      siteHistory: Boolean,
      pastIncidents: Boolean,
      previousAssessments: Boolean,
      hazardsFromWorkArea: Boolean,
    },
    aiPrompt: String,
    aiResponse: String,

    // Version control
    version: { type: Number, default: 1 },
    supersedes: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },
    revisionHistory: [
      {
        version: Number,
        date: Date,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changes: String,
      },
    ],

    // Status
    status: {
      type: String,
      enum: [
        "draft",
        "under_review",
        "approved",
        "active",
        "archived",
        "completed",
      ],
      default: "draft",
    },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
      this.assessmentNumber = counter.seq + 3000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("RiskAssessment", riskAssessmentSchema);
