const mongoose = require("mongoose");
const Counter = require("./Counter");

const workAreaSchema = new mongoose.Schema(
  {
    workAreaNumber: { type: Number, unique: true },
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, trim: true },
    code: { type: String, trim: true },
    description: { type: String, default: "" },
    location: {
      zone: String,
      level: String,
      coordinates: String,
      accessPoints: [String],
    },
    status: {
      type: String,
      enum: ["planned", "active", "on_hold", "completed", "inspecting"],
      default: "active",
    },
    plannedStart: Date,
    plannedEnd: Date,
    actualStart: Date,
    actualEnd: Date,
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
        contractor: {
          name: String,
          contact: String,
          supervisor: String,
        },
      },
    ],
    activeShifts: [
      {
        name: { type: String, enum: ["morning", "afternoon", "night"] },
        workerCount: Number,
        startTime: String,
        endTime: String,
      },
    ],
    intake: {
      mainActivity: String,
      workDescription: String,
      shiftOrWorkingTime: String,
      numberOfPeopleInvolved: Number,
      workerTypes: {
        employees: { type: Boolean, default: false },
        contractors: { type: Boolean, default: false },
        visitors: { type: Boolean, default: false },
        publicNearby: { type: Boolean, default: false },
        other: String,
      },
      personallyIdentifiedRisks: {
        people: String,
        equipment: String,
        environment: String,
        nearbyWorkersPublic: String,
        propertyMaterials: String,
        operationsProduction: String,
      },
      existingControls: {
        selected: [String],
        notes: String,
      },
      emergencyPreparedness: {
        emergencyContactPerson: String,
        nearestClinicHospital: String,
        healthFacilityDistanceTime: String,
        ambulanceAvailable: { type: Boolean, default: false },
        firstAidBoxAvailable: { type: Boolean, default: false },
        trainedFirstAiders: Number,
        fireExtinguishersAvailable: { type: Boolean, default: false },
        emergencyExitRoutes: String,
        assemblyPoint: String,
        rescueEquipment: String,
        communicationMethods: [String],
        evacuationPlan: { type: Boolean, default: false },
        spillKitAvailable: { type: Boolean, default: false },
        emergencyShowerEyewashAvailable: { type: Boolean, default: false },
        notes: String,
      },
      peopleExposure: {
        workersInArea: Number,
        peoplePassingNearby: Number,
        inexperiencedWorkers: { type: Boolean, default: false },
        contractorsInvolved: { type: Boolean, default: false },
        workingAlone: { type: Boolean, default: false },
        supervisionAvailable: { type: Boolean, default: false },
        vulnerablePersonsExposed: { type: Boolean, default: false },
        notes: String,
      },
      hazardCategories: [
        {
          category: String,
          whatCouldHappen: String,
          likelihood: String,
          severity: String,
          existingControls: String,
          controlsStillNeeded: String,
        },
      ],
      ppeAssessment: {
        obtained: [String],
        adequacy: String,
        enoughForAllWorkers: { type: Boolean, default: false },
        condition: String,
        inspected: { type: Boolean, default: false },
        workersKnowHowToUse: { type: Boolean, default: false },
        replacementAvailable: { type: Boolean, default: false },
        notes: String,
      },
      equipmentAndTools: {
        equipmentUsed: String,
        inspected: { type: Boolean, default: false },
        certifiedWhereRequired: { type: Boolean, default: false },
        authorizedOperators: String,
        guardsInPlace: { type: Boolean, default: false },
        emergencyStopsWorking: { type: Boolean, default: false },
        maintenanceUpToDate: { type: Boolean, default: false },
        failureRisks: [String],
        notes: String,
      },
      materialsAndSubstances: {
        materialsOrChemicalsUsed: String,
        safetyDataSheetsAvailable: { type: Boolean, default: false },
        substanceHazards: [String],
        storageMethod: String,
        spillHandling: String,
        requiredPPE: String,
        firstAidAfterExposure: String,
      },
      incidentNearMissHistory: {
        similarHappenedBefore: { type: Boolean, default: false },
        workersComplained: { type: Boolean, default: false },
        nearMisses: { type: Boolean, default: false },
        equipmentFailedBefore: { type: Boolean, default: false },
        injuriesFiresSpillsFallsShocksExposure: { type: Boolean, default: false },
        notes: String,
      },
      documentIntent: [String],
    },
    initialContext: {
      description: String,
      submittedAt: { type: Date, default: Date.now },
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
            default: "site_conditions",
          },
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
          },
          notes: String,
        },
      ],
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
          customItem: String,
          quantity: Number,
          condition: String,
        },
      ],
      initialRiskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
      },
      specialConsiderations: String,
    },
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
          default: "medium",
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
        status: {
          type: String,
          enum: ["active", "mitigated", "monitoring", "closed"],
          default: "active",
        },
        notes: String,
      },
    ],
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
          default: "initial",
        },
        category: String,
        riskAssessment: {
          severity: String,
          likelihood: String,
          riskLevel: String,
        },
        mitigation: [
          {
            action: String,
            type: String,
            responsibleParty: String,
            implementationDate: Date,
            effectiveness: String,
            reviewDate: Date,
            notes: String,
          },
        ],
        status: {
          type: String,
          enum: ["active", "monitoring", "mitigated", "resolved", "closed"],
          default: "active",
        },
        identifiedAt: { type: Date, default: Date.now },
        updatedAt: Date,
        aiNotes: String,
        trend: String,
      },
    ],
    aiContext: {
      currentPhase: String,
      criticalActivities: [String],
      recentChanges: String,
      upcomingRisks: [String],
      activeConcernsSummary: String,
      recentObservationsSummary: String,
      ppeStatusSummary: String,
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
      safetyTrend: { type: String, enum: ["improving", "stable", "declining"] },
      lastUpdated: { type: Date, default: Date.now },
    },
    documents: {
      incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Incident" }],
      riskAssessments: [{ type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" }],
      safetyTalks: [{ type: mongoose.Schema.Types.ObjectId, ref: "SafetyTalk" }],
      permits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permit" }],
      jsas: [{ type: mongoose.Schema.Types.ObjectId, ref: "JSA" }],
      ppeChecklists: [{ type: mongoose.Schema.Types.ObjectId, ref: "PPEChecklist" }],
      environmentalAssessments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "EnvironmentalAssessment" },
      ],
    },
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
      inspectionsPassed: { type: Number, default: 0 },
      inspectionsFailed: { type: Number, default: 0 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

workAreaSchema.index({ officerId: 1, code: 1 }, { unique: true, sparse: true });

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

workAreaSchema.methods.updateStatistics = async function (incidentType) {
  if (incidentType === "incident") {
    this.statistics.incidents += 1;
    this.statistics.lastIncidentDate = new Date();
    this.statistics.daysWithoutIncident = 0;
  } else if (incidentType === "nearMiss") {
    this.statistics.nearMisses += 1;
  }

  const totalEvents = this.statistics.incidents + this.statistics.nearMisses;
  if (totalEvents > 0) {
    const score = Math.max(
      0,
      100 - this.statistics.incidents * 5 - this.statistics.nearMisses,
    );
    this.statistics.safetyScore = Math.min(100, score);
  }

  await this.save();
};

workAreaSchema.methods.addSafetyObservation = async function (observationData) {
  this.statistics.safetyObservations += 1;
  this.statistics.openConcerns += 1;
  this.concernsRegister.push({
    concern: observationData.observation || observationData.description,
    source: "observation",
    category: observationData.category || "hazard",
  });
  await this.save();
  return this;
};

module.exports = mongoose.model("WorkArea", workAreaSchema);
