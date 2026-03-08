const mongoose = require("mongoose");
const Counter = require("./Counter");

const incidentSchema = new mongoose.Schema(
  {
    incidentNumber: { type: Number, unique: true },

    // Core relationship
    worksite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worksite",
      required: true,
    },
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
    locationDetails: String, // Specific area within worksite

    description: { type: String, required: true },
    immediateAction: String,

    // For AI context - additional notes that help the AI understand the situation
    aiContext: {
      weatherConditions: String,
      contributingFactors: String,
      witnessObservations: String,
      reporterComments: String,
    },

    // Equipment involved (if any)
    equipmentInvolved: [
      {
        equipment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Worksite.equipment",
        },
        name: String,
        condition: String,
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
        },
      ],
      firstAidProvided: Boolean,
    },

    // For near-misses
    potentialConsequences: String,
    whyDidNotHappen: String, // What prevented it from becoming an incident

    // Media attachments
    media: [
      {
        url: String,
        type: { type: String, enum: ["image", "video", "document", "audio"] },
        uploadedBy: String,
        uploadedAt: { type: Date, default: Date.now },
        description: String,
      },
    ],

    // Investigation (added by safety officer)
    investigation: {
      conducted: { type: Boolean, default: false },
      conductedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SafetyOfficer",
      },
      investigationDate: Date,
      rootCause: String,
      contributingFactors: [String],
      findings: String,
      attachments: [String],
    },

    // Corrective actions
    correctiveActions: [
      {
        action: String,
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedToName: String,
        deadline: Date,
        completed: { type: Boolean, default: false },
        completedDate: Date,
        completionNotes: String,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
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
      ],
      default: "reported",
    },

    // For anonymous reporting
    anonymous: { type: Boolean, default: true },

    // Safety officer review (for AI-generated incidents)
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
    reviewedAt: Date,
    aiGenerated: { type: Boolean, default: false },

    // Learning points (for safety talks)
    lessonsLearned: String,
    usedInSafetyTalk: { type: Boolean, default: false },
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
      this.incidentNumber = counter.seq + 10000; // Start from 10000
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// After save, update worksite statistics
incidentSchema.post("save", async function (doc) {
  try {
    const Worksite = mongoose.model("Worksite");
    const worksite = await Worksite.findById(doc.worksite);

    if (worksite) {
      if (doc.type === "incident") {
        await worksite.updateStatistics("incident");
      } else if (doc.type === "near_miss") {
        await worksite.updateStatistics("nearMiss");
      }
    }
  } catch (err) {
    console.error("Error updating worksite statistics:", err);
  }
});

module.exports = mongoose.model("Incident", incidentSchema);
