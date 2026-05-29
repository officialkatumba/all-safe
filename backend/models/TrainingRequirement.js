const mongoose = require("mongoose");
const Counter = require("./Counter");

const trainingRequirementSchema = new mongoose.Schema(
  {
    requirementNumber: { type: Number, unique: true },

    // Core relationship
    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },

    // Basic info
    title: { type: String, required: true },
    description: String,
    generatedDate: { type: Date, default: Date.now },
    validUntil: Date,

    // Training categories
    category: {
      type: String,
      enum: [
        "safety_induction",
        "equipment_operation",
        "hazard_specific",
        "emergency_response",
        "first_aid",
        "legal_compliance",
        "refresher",
        "supervisory",
        "specialized",
      ],
      required: true,
    },

    recommendedTrainings: [
      {
        trainingTitle: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          default: "hazard_specific",
        },
        priority: {
          type: String,
          enum: ["critical", "high", "medium", "low"],
          default: "medium",
        },
        targetRoles: [String],
        duration: String,
        reason: String,
        keyTopics: [String],
        verificationMethod: String,
      },
    ],

    trainingChecklist: [
      {
        checkItem: {
          type: String,
          required: true,
        },
        passCriteria: {
          type: String,
          default: "Training delivered and understood by affected workers.",
        },
      },
    ],

    // Priority level
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },

    // Training details (AI-generated)
    requiredForRoles: [String],
    prerequisites: [String],
    learningObjectives: [String],
    keyTopics: [String],
    duration: String, // e.g., "2 hours", "1 day"
    certificationRequired: { type: Boolean, default: false },
    certificationExpiry: Number, // months
    refresherFrequency: String, // e.g., "annually", "biannually"

    // Who needs this training
    targetWorkers: [
      {
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        completed: { type: Boolean, default: false },
        completedDate: Date,
        certificateUrl: String,
        expiryDate: Date,
      },
    ],
    workerCount: Number,

    // Based on (AI reasoning)
    basedOn: {
      hazards: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "WorkArea.identifiedHazards",
        },
      ],
      incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Incident" }],
      riskAssessments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },
      ],
      observations: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyObservation" },
      ],
      regulatoryReference: String,
      aiReasoning: String,
    },

    // Training material (can be generated)
    material: {
      hasSlides: { type: Boolean, default: false },
      slidesUrl: String,
      hasHandout: { type: Boolean, default: false },
      handoutUrl: String,
      hasQuiz: { type: Boolean, default: false },
      quizUrl: String,
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "published", "in_progress", "completed", "archived"],
      default: "draft",
    },

    // Compliance tracking
    complianceRate: { type: Number, min: 0, max: 100, default: 0 },
    targetDate: Date,
    completedDate: Date,

    // AI metadata
    aiGenerated: { type: Boolean, default: true },
    aiModel: String,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Auto-increment requirement number
trainingRequirementSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "trainingrequirement" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.requirementNumber = counter.seq + 8000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model(
  "TrainingRequirement",
  trainingRequirementSchema,
);
