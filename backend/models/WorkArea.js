const mongoose = require("mongoose");
const Counter = require("./Counter");

const workAreaSchema = new mongoose.Schema(
  {
    workAreaNumber: { type: Number, unique: true },

    // Parent worksite
    worksite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worksite",
      required: true,
    },

    // Basic info
    name: { type: String, required: true },
    code: { type: String, unique: true },
    description: String,

    // Location within worksite
    location: {
      zone: String,
      level: String,
      coordinates: String,
      accessPoints: [String],
    },

    // Current status
    status: {
      type: String,
      enum: ["planned", "active", "on_hold", "completed", "inspecting"],
      default: "planned",
    },

    // Schedule
    plannedStart: Date,
    plannedEnd: Date,
    actualStart: Date,
    actualEnd: Date,

    // Current work types (can change over time)
    currentWorkTypes: [
      {
        workType: {
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
          ],
        },
        startDate: Date,
        endDate: Date,
        isActive: { type: Boolean, default: true },
        supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        contractor: {
          name: String,
          contact: String,
          supervisor: String,
        },
      },
    ],

    // Assigned personnel - FIXED: removed required: true
    assignedSafetyOfficers: [
      {
        officer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
          // required: true,  // REMOVED - no longer required
        },
        shift: {
          type: String,
          enum: ["morning", "afternoon", "night"], // FIXED: removed "rotating"
        },
        isPrimary: { type: Boolean, default: false },
        assignedFrom: Date,
        assignedTo: Date,
        isActive: { type: Boolean, default: true },
      },
    ],

    // Shifts operating in this area
    activeShifts: [
      {
        name: { type: String, enum: ["morning", "afternoon", "night"] },
        supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        workerCount: Number,
        startTime: String,
        endTime: String,
      },
    ],

    // ===== NEW: Initial Concerns at Creation =====
    // Context provided when work area is first created
    initialContext: {
      description: String, // Overall description of the work area's safety context
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SafetyOfficer",
      },
      submittedAt: { type: Date, default: Date.now },

      // Initial concerns identified at the start
      initialConcerns: [
        {
          concern: String,
          category: {
            type: String,
            enum: [
              "site_conditions",
              "equipment",
              "materials",
              "personnel",
              "environmental",
              "procedural",
              "other",
            ],
          },
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
          notes: String,
        },
      ],

      // Initial PPE requirements
      requiredPPE: [
        {
          item: {
            type: String,
            enum: [
              "hard_hat",
              "safety_glasses",
              "ear_plugs",
              "ear_muffs",
              "high_vis_vest",
              "steel_toe_boots",
              "gloves",
              "respirator",
              "harness",
              "face_shield",
              "welding_helmet",
              "chemical_suit",
              "knee_pads",
              "fall_arrest",
              "other",
            ],
          },
          customItem: String, // For "other" category
          quantity: Number,
          condition: String,
          assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],

      // Initial risk levels
      initialRiskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
    },

    // ===== NEW: Continuous Safety Observations & Concerns =====
    // This is distinct from incidents - these are proactive observations
    safetyObservations: [
      {
        observationId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        observation: { type: String, required: true },
        category: {
          type: String,
          enum: [
            "hazard",
            "unsafe_behavior",
            "unsafe_condition",
            "good_practice",
            "housekeeping",
            "equipment",
            "environmental",
            "compliance",
            "other",
          ],
        },

        // Initial assessment
        initialAssessment: {
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
          likelihood: {
            type: String,
            enum: ["rare", "unlikely", "possible", "likely", "almost_certain"],
          },
          riskLevel: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
          notes: String,
        },

        // Who observed
        observedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
          required: true,
        },
        observedAt: { type: Date, default: Date.now },

        // Shift when observed
        shift: {
          type: String,
          enum: ["morning", "afternoon", "night", "unknown"],
        },

        // Location within work area
        specificLocation: String,

        // Media attachments
        media: [
          {
            url: String,
            type: { type: String, enum: ["image", "video", "document"] },
            uploadedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "SafetyOfficer",
            },
            uploadedAt: { type: Date, default: Date.now },
            description: String,
          },
        ],

        // Actions taken
        immediateAction: String,

        // Resolution tracking
        resolution: {
          status: {
            type: String,
            enum: ["open", "in_progress", "resolved", "closed", "monitoring"],
            default: "open",
          },
          actions: [
            {
              action: String,
              assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              dueDate: Date,
              completedAt: Date,
              completedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SafetyOfficer",
              },
              notes: String,
            },
          ],
          resolvedAt: Date,
          resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SafetyOfficer",
          },
          resolutionNotes: String,
        },

        // Follow-up requirements
        requiresFollowUp: { type: Boolean, default: false },
        followUpDate: Date,
        followUpNotes: String,

        // For tracking recurring issues
        isRecurring: { type: Boolean, default: false },
        recurrencePattern: String,
        previousOccurrences: [{ type: mongoose.Schema.Types.ObjectId }],

        // Links to other entities
        relatedIncident: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Incident",
        },
        relatedRiskAssessment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RiskAssessment",
        },

        // Used in safety talks
        usedInSafetyTalk: { type: Boolean, default: false },
        safetyTalkGenerated: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyTalk",
        },
      },
    ],

    // ===== NEW: PPE Compliance Tracking =====
    ppeCompliance: [
      {
        checkId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        checkDate: { type: Date, default: Date.now },
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        shift: { type: String, enum: ["morning", "afternoon", "night"] },

        // Requirements vs actual usage
        requirements: [
          {
            item: {
              type: String,
              enum: [
                "hard_hat",
                "safety_glasses",
                "ear_plugs",
                "ear_muffs",
                "high_vis_vest",
                "steel_toe_boots",
                "gloves",
                "respirator",
                "harness",
                "face_shield",
                "welding_helmet",
                "chemical_suit",
                "knee_pads",
                "fall_arrest",
                "other",
              ],
            },
            customItem: String,
            requiredQuantity: Number,
            availableQuantity: Number,
            inUseQuantity: Number,
            condition: {
              type: String,
              enum: ["good", "fair", "poor", "needs_replacement"],
            },
          },
        ],

        // Worker compliance observations
        workerCompliance: [
          {
            workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            workerName: String,
            observedItems: [
              {
                item: String,
                wasWorn: Boolean,
                properlyFitted: Boolean,
                condition: String,
                notes: String,
              },
            ],
            compliant: { type: Boolean, default: false },
          },
        ],

        // Overall compliance score (0-100%)
        complianceScore: { type: Number, min: 0, max: 100 },

        // Issues identified
        issuesFound: [
          {
            issue: String,
            severity: { type: String, enum: ["low", "medium", "high"] },
            correctiveAction: String,
            assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            deadline: Date,
            resolved: { type: Boolean, default: false },
            resolvedAt: Date,
          },
        ],

        // Summary
        summary: String,
      },
    ],

    // ===== NEW: Ongoing Concerns Register =====
    // A living register of all concerns (combines initial + ongoing)
    concernsRegister: [
      {
        concernId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        concern: { type: String, required: true },
        source: {
          type: String,
          enum: [
            "initial",
            "observation",
            "incident",
            "risk_assessment",
            "audit",
            "worker_feedback",
          ],
        },
        sourceId: { type: mongoose.Schema.Types.ObjectId }, // Reference to source document

        category: {
          type: String,
          enum: [
            "hazard",
            "behavior",
            "condition",
            "equipment",
            "training",
            "procedure",
            "compliance",
            "environmental",
            "other",
          ],
        },

        riskAssessment: {
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
          likelihood: {
            type: String,
            enum: ["rare", "unlikely", "possible", "likely", "almost_certain"],
          },
          riskLevel: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
        },

        mitigation: [
          {
            action: String,
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
                "unknown",
              ],
            },
            reviewDate: Date,
            notes: String,
          },
        ],

        // Current status
        status: {
          type: String,
          enum: ["active", "monitoring", "mitigated", "resolved", "closed"],
          default: "active",
        },

        // Tracking
        identifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        identifiedAt: { type: Date, default: Date.now },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        updatedAt: Date,
        closedAt: Date,
        closedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },

        // Linked observations
        relatedObservations: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WorkArea.safetyObservations",
          },
        ],

        // For AI context
        aiNotes: String,
        trend: {
          type: String,
          enum: ["improving", "stable", "worsening", "new"],
        },
      },
    ],

    // AREA-SPECIFIC HAZARDS (keeping existing but can reference concerns)
    identifiedHazards: [
      {
        hazardId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        hazard: { type: String, required: true },
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
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
        likelihood: {
          type: String,
          enum: ["rare", "unlikely", "possible", "likely", "almost_certain"],
        },
        consequence: {
          type: String,
          enum: ["insignificant", "minor", "moderate", "major", "catastrophic"],
        },
        controls: String,
        identifiedDate: { type: Date, default: Date.now },
        identifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        reviewedDate: Date,
        status: {
          type: String,
          enum: ["active", "mitigated", "monitoring", "closed"],
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
        notes: String,
        // Link to concerns register
        concernRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "WorkArea.concernsRegister",
        },
      },
    ],

    // AREA-SPECIFIC EQUIPMENT
    equipment: [
      {
        equipmentId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        name: { type: String, required: true },
        type: String,
        model: String,
        serialNumber: String,
        identificationNumber: String,
        location: String,
        status: {
          type: String,
          enum: ["operational", "maintenance", "out_of_service", "retired"],
          default: "operational",
        },
        lastInspection: Date,
        nextInspection: Date,
        inspectedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        operator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
            nextInspectionDate: Date,
          },
        ],
      },
    ],

    // Active permits in this area
    activePermits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permit" }],

    // Statistics for this area
    statistics: {
      incidents: { type: Number, default: 0 },
      nearMisses: { type: Number, default: 0 },
      safetyObservations: { type: Number, default: 0 },
      openConcerns: { type: Number, default: 0 },
      resolvedConcerns: { type: Number, default: 0 },
      safetyTalks: { type: Number, default: 0 },
      riskAssessments: { type: Number, default: 0 },
      daysWithoutIncident: { type: Number, default: 0 },
      lastIncidentDate: Date,
      safetyScore: { type: Number, default: 100, min: 0, max: 100 },
      ppeComplianceScore: { type: Number, default: 100, min: 0, max: 100 },
      workerHours: { type: Number, default: 0 },
      inspectionsPassed: { type: Number, default: 0 },
      inspectionsFailed: { type: Number, default: 0 },
    },

    // Area-specific AI context (enhanced)
    aiContext: {
      currentPhase: String,
      criticalActivities: [String],
      recentChanges: String,
      upcomingRisks: [String],

      // New: Summaries for AI
      activeConcernsSummary: String,
      recentObservationsSummary: String,
      ppeStatusSummary: String,

      // Worker feedback
      workerFeedback: [
        {
          date: Date,
          comment: String,
          topic: String,
          sentiment: {
            type: String,
            enum: ["positive", "neutral", "negative"],
          },
        },
      ],

      // Trends
      safetyTrend: { type: String, enum: ["improving", "stable", "declining"] },
      lastUpdated: { type: Date, default: Date.now },
    },

    // Documents created for this area (references)
    documents: {
      incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Incident" }],
      riskAssessments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },
      ],
      safetyTalks: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyTalk" },
      ],
      permits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permit" }],
      jsas: [{ type: mongoose.Schema.Types.ObjectId, ref: "JSA" }],
      ppeChecklists: [
        { type: mongoose.Schema.Types.ObjectId, ref: "PPEChecklist" },
      ],
      safetyObservations: [{ type: mongoose.Schema.Types.ObjectId }], // Self-reference
    },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
  },
  { timestamps: true },
);

// Auto-increment work area number
workAreaSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "workarea" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.workAreaNumber = counter.seq + 2000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Method to update statistics
workAreaSchema.methods.updateStatistics = async function (incidentType) {
  if (incidentType === "incident") {
    this.statistics.incidents += 1;
    this.statistics.lastIncidentDate = new Date();
    this.statistics.daysWithoutIncident = 0;
  } else if (incidentType === "nearMiss") {
    this.statistics.nearMisses += 1;
  }

  // Recalculate safety score
  const totalEvents = this.statistics.incidents + this.statistics.nearMisses;
  if (totalEvents > 0) {
    const score = Math.max(
      0,
      100 - this.statistics.incidents * 5 - this.statistics.nearMisses * 1,
    );
    this.statistics.safetyScore = Math.min(100, score);
  }

  await this.save();

  // Update parent worksite stats
  const Worksite = mongoose.model("Worksite");
  const worksite = await Worksite.findById(this.worksite);
  if (worksite) {
    await worksite.updatePerformanceStats();
  }
};

// Method to add safety observation
workAreaSchema.methods.addSafetyObservation = async function (observationData) {
  this.safetyObservations.push(observationData);
  this.statistics.safetyObservations += 1;
  this.statistics.openConcerns += 1;
  await this.save();
  return this;
};

// Method to resolve observation
workAreaSchema.methods.resolveObservation = async function (
  observationId,
  resolutionData,
) {
  const observation = this.safetyObservations.id(observationId);
  if (observation) {
    observation.resolution = resolutionData;
    observation.resolution.status = "resolved";
    observation.resolution.resolvedAt = new Date();
    this.statistics.openConcerns -= 1;
    this.statistics.resolvedConcerns += 1;
    await this.save();
  }
  return this;
};

// Method to add PPE compliance check
workAreaSchema.methods.addPPECheck = async function (ppeData) {
  this.ppeCompliance.push(ppeData);
  // Update average PPE compliance score
  const totalScore = this.ppeCompliance.reduce(
    (sum, check) => sum + (check.complianceScore || 0),
    0,
  );
  this.statistics.ppeComplianceScore = totalScore / this.ppeCompliance.length;
  await this.save();
  return this;
};

module.exports = mongoose.model("WorkArea", workAreaSchema);
