const mongoose = require("mongoose");
const Counter = require("./Counter");

const incidentSchema = new mongoose.Schema(
  {
    incidentNumber: { type: Number, unique: true },

    // Core relationship - points to WorkArea
    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },

    // Shift when incident occurred
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night", "unknown"],
      default: "unknown",
    },

    // Who reported
    reportedBy: {
      type: String,
      enum: ["worker", "safety_officer", "supervisor", "anonymous"],
      required: true,
    },
    reporterName: { type: String }, // Optional, only if worker chooses to identify
    reportedByUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If logged in
    reporterContact: String, // Optional contact for follow-up

    // Incident details
    type: {
      type: String,
      enum: [
        "incident",
        "near_miss",
        "hazard_observation",
        "unsafe_condition",
        "property_damage",
        "environmental",
        "first_aid",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical", "fatality"],
      default: "low",
    },

    dateTime: { type: Date, default: Date.now },
    location: String,
    locationDetails: String, // Specific spot within work area

    description: { type: String, required: true },
    immediateAction: String,

    // Work type at time of incident
    workTypeAtTime: {
      type: String,
      enum: [
        "excavation",
        "foundation",
        "structural",
        "masonry",
        "roofing",
        "electrical",
        "plumbing",
        "hvac",
        "finishing",
        "landscaping",
        "demolition",
        "painting",
        "welding",
        "scaffolding",
        "general",
        "unknown",
      ],
    },

    // Contractor involved
    contractor: {
      name: String,
      supervisor: String,
      employeeInvolved: String,
      contact: String,
    },

    // For AI context - additional notes that help the AI understand the situation
    aiContext: {
      weatherConditions: String,
      lighting: String,
      noise: String,
      contributingFactors: String,
      witnessObservations: String,
      reporterComments: String,
    },

    // Equipment involved (if any)
    equipmentInvolved: [
      {
        equipmentId: { type: mongoose.Schema.Types.ObjectId },
        name: String,
        condition: String,
        wasInspected: Boolean,
      },
    ],

    // Injuries (for incidents)
    injuries: {
      occurred: { type: Boolean, default: false },
      description: String,
      injuredPersons: [
        {
          name: String, // Anonymous if worker
          injuryType: String,
          bodyPart: String,
          treatmentRequired: String,
          hospitalVisit: Boolean,
          timeOffWork: Boolean,
          daysOff: Number,
        },
      ],
      firstAidProvided: Boolean,
      ambulanceCalled: Boolean,
    },

    // For near-misses
    potentialConsequences: String,
    whyDidNotHappen: String, // What prevented it from becoming an incident

    // Media attachments
    media: [
      {
        url: String,
        type: { type: String, enum: ["image", "video", "document", "audio"] },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
        description: String,
      },
    ],

    // Investigation (added by safety officer)
    investigation: {
      conducted: { type: Boolean, default: false },
      conductedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      investigationDate: Date,
      rootCause: String,
      contributingFactors: [String],
      findings: String,
      recommendations: [String],
      attachments: [
        {
          url: String,
          description: String,
        },
      ],
    },

    // Corrective actions
    correctiveActions: [
      {
        action: { type: String, required: true },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedToName: String,
        deadline: Date,
        priority: {
          type: String,
          enum: ["high", "medium", "low"],
          default: "medium",
        },
        completed: { type: Boolean, default: false },
        completedDate: Date,
        completionNotes: String,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        verifiedAt: Date,
      },
    ],

    // Status tracking
    status: {
      type: String,
      enum: [
        "reported",
        "under_investigation",
        "action_taken",
        "resolved",
        "closed",
        "rejected",
      ],
      default: "reported",
    },

    // Approval workflow
    requiresApproval: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "not_required",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    approvalComments: String,

    // For anonymous reporting
    anonymous: { type: Boolean, default: true },

    // Safety officer review (for AI-generated incidents)
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    aiGenerated: { type: Boolean, default: false },

    // Learning points (for safety talks)
    lessonsLearned: String,
    usedInSafetyTalk: { type: Boolean, default: false },
    safetyTalkGenerated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SafetyTalk",
    },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Auto-increment incident number
incidentSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "incident" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.incidentNumber = counter.seq + 10000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// After save, update work area statistics
incidentSchema.post("save", async function (doc) {
  try {
    const WorkArea = mongoose.model("WorkArea");
    const workArea = await WorkArea.findById(doc.workArea);

    if (workArea) {
      if (doc.type === "incident") {
        await workArea.updateStatistics("incident");
      } else if (doc.type === "near_miss") {
        await workArea.updateStatistics("nearMiss");
      }
    }
  } catch (err) {
    console.error("Error updating work area statistics:", err);
  }
});

module.exports = mongoose.model("Incident", incidentSchema);
