const mongoose = require("mongoose");
const Counter = require("./Counter");

const worksiteSchema = new mongoose.Schema(
  {
    worksiteNumber: { type: Number, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    siteType: {
      type: String,
      enum: [
        "construction",
        "mining",
        "manufacturing",
        "oil_gas",
        "warehouse",
        "office",
        "other",
      ],
      required: true,
    },
    description: { type: String },

    // Initial context for AI - very important for generating relevant insights
    siteHistory: {
      initialComment: { type: String }, // Safety officer's initial observations about the site
      knownChallenges: [{ type: String }], // Known safety challenges from the start
      pastIncidents: { type: String }, // Brief history of past incidents (if any)
      uniqueFeatures: { type: String }, // What makes this site unique
      aiContextNotes: { type: String }, // Additional context for AI to consider
    },

    // Site operates in shifts (all optional at creation)
    shifts: [
      {
        name: {
          type: String,
          enum: ["morning", "afternoon", "night", "rotating"],
        },
        startTime: String,
        endTime: String,
        safetyOfficer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        workers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],

    // Multiple safety officers can be assigned (optional)
    safetyOfficers: [
      {
        officer: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
        shift: String,
        isPrimary: { type: Boolean, default: false },
        assignedDate: { type: Date, default: Date.now },
      },
    ],

    // Site conditions and hazards (optional at creation)
    environmentalConditions: [
      {
        type: String,
        enum: [
          "indoor",
          "outdoor",
          "heights",
          "confined_space",
          "wet",
          "dusty",
          "noisy",
          "extreme_temp",
        ],
      },
    ],

    // Hazards (optional at creation)
    identifiedHazards: [
      {
        hazard: String,
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
        controls: String,
        identifiedDate: { type: Date, default: Date.now },
        identifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        status: {
          type: String,
          enum: ["active", "mitigated", "closed"],
          default: "active",
        },
        affectedShifts: [
          { type: String, enum: ["morning", "afternoon", "night", "all"] },
        ],
        closedDate: Date,
        closedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
      },
    ],

    // All staff associated with this site (optional at creation)
    staff: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["safety_officer", "supervisor", "worker"],
        },
        shift: {
          type: String,
          enum: ["morning", "afternoon", "night", "rotating"],
        },
        joinedDate: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
      },
    ],

    status: {
      type: String,
      enum: ["active", "inactive", "under_review", "shutdown"],
      default: "active",
    },

    // Site-wide risk assessments (added later)
    riskAssessments: [
      {
        assessmentNumber: { type: Number },
        title: String,
        description: String,
        assessmentDate: { type: Date, default: Date.now },
        conductedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        riskMatrix: {
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
        },
        controls: [
          {
            measure: String,
            responsibleParty: String,
            deadline: Date,
            completed: { type: Boolean, default: false },
          },
        ],
        affectedShifts: [
          { type: String, enum: ["morning", "afternoon", "night", "all"] },
        ],
        reviewDate: Date,
        status: {
          type: String,
          enum: ["draft", "active", "archived"],
          default: "active",
        },
      },
    ],

    // Site statistics (auto-updated)
    statistics: {
      totalIncidents: { type: Number, default: 0 },
      totalNearMisses: { type: Number, default: 0 },
      daysWithoutIncident: { type: Number, default: 0 },
      lastIncidentDate: Date,
      safetyScore: { type: Number, default: 100, min: 0, max: 100 },
    },

    // Compliance tracking (added later)
    complianceChecks: [
      {
        regulation: String,
        authority: String,
        status: {
          type: String,
          enum: ["compliant", "non_compliant", "pending", "exempt"],
        },
        lastChecked: Date,
        nextCheckDue: Date,
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        notes: String,
        documents: [
          {
            name: String,
            url: String,
            uploadedAt: Date,
          },
        ],
      },
    ],

    // Equipment at site (added later)
    equipment: [
      {
        name: String,
        type: String,
        identificationNumber: String,
        location: String,
        lastInspection: Date,
        nextInspection: Date,
        inspectedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        status: {
          type: String,
          enum: ["operational", "maintenance", "out_of_service", "retired"],
        },
        notes: String,
        inspectionHistory: [
          {
            date: Date,
            inspector: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "SafetyOfficer",
            },
            findings: String,
            passed: Boolean,
          },
        ],
      },
    ],

    // Site documents (added later)
    documents: [
      {
        title: String,
        type: {
          type: String,
          enum: ["sop", "policy", "permit", "certificate", "other"],
        },
        fileUrl: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        uploadedAt: { type: Date, default: Date.now },
        expiryDate: Date,
        version: String,
      },
    ],
  },
  { timestamps: true },
);

// Auto-increment worksite number
worksiteSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "worksite" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.worksiteNumber = counter.seq + 1000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Method to update statistics
worksiteSchema.methods.updateStatistics = async function (incidentType) {
  if (incidentType === "incident") {
    this.statistics.totalIncidents += 1;
    this.statistics.lastIncidentDate = new Date();
    this.statistics.daysWithoutIncident = 0;
  } else if (incidentType === "nearMiss") {
    this.statistics.totalNearMisses += 1;
  }

  // Recalculate safety score
  const totalEvents =
    this.statistics.totalIncidents + this.statistics.totalNearMisses;
  if (totalEvents > 0) {
    const score = Math.max(
      0,
      100 -
        this.statistics.totalIncidents * 5 -
        this.statistics.totalNearMisses * 1,
    );
    this.statistics.safetyScore = Math.min(100, score);
  }

  await this.save();
};

module.exports = mongoose.model("Worksite", worksiteSchema);
