const mongoose = require("mongoose");
const Counter = require("./Counter");

const permitSchema = new mongoose.Schema(
  {
    permitNumber: { type: Number, unique: true },

    // Core relationship - points to WorkArea
    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },

    // Permit type
    permitType: {
      type: String,
      enum: [
        "hot_work",
        "cold_work",
        "confined_space",
        "height_work",
        "excavation",
        "electrical",
        "lifting",
        "chemical",
        "radiation",
        "demolition",
      ],
      required: true,
    },

    // Basic info
    title: { type: String, required: true },
    description: String,
    referenceNumber: String,

    // Work details
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
    workDescription: String,

    // Location within work area
    specificLocation: {
      coordinates: String,
      description: String,
      accessInstructions: String,
    },

    // Validity
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    isContinuous: { type: Boolean, default: false }, // For ongoing work
    extended: [
      {
        extendedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        extendedTo: Date,
        reason: String,
        extendedAt: Date,
      },
    ],

    // Workers involved
    workers: [
      {
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        role: String,
        certification: String,
        acknowledged: { type: Boolean, default: false },
        acknowledgedAt: Date,
      },
    ],
    workerCount: Number,

    // Contractor (if applicable)
    contractor: {
      name: String,
      supervisor: String,
      contact: String,
      licenseNumber: String,
    },

    // Hazards and controls
    hazards: [
      {
        hazard: String,
        controls: [String],
        ppeRequired: [String],
      },
    ],

    // PPE required
    ppeRequirements: [
      {
        item: String,
        quantity: Number,
        condition: String,
        issued: Boolean,
      },
    ],

    // Gas testing (for confined space/hot work)
    gasTests: [
      {
        testTime: Date,
        oxygen: Number,
        combustibles: Number,
        carbonMonoxide: Number,
        hydrogenSulfide: Number,
        otherGases: Object,
        testedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        equipmentUsed: String,
        results: { type: String, enum: ["pass", "fail", "caution"] },
        notes: String,
      },
    ],

    // Pre-work checklist
    preWorkChecklist: [
      {
        item: String,
        completed: { type: Boolean, default: false },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        completedAt: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
      },
    ],

    // Sign-offs and authorizations
    authorizations: {
      required: [
        {
          role: String,
          level: Number,
        },
      ],
      received: [
        {
          authorizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          role: String,
          date: Date,
          signature: String,
          comments: String,
        },
      ],
    },

    // Acceptance by work team
    acceptance: {
      acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      acceptedAt: Date,
      signature: String,
      teamBriefed: Boolean,
      briefingNotes: String,
    },

    // Monitoring during work
    monitoring: [
      {
        time: Date,
        condition: String,
        reading: String,
        monitoredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: { type: String, enum: ["normal", "caution", "stop"] },
      },
    ],

    // Completion
    completion: {
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      workCompleted: Boolean,
      areaLeftSafe: Boolean,
      equipmentRemoved: Boolean,
      wasteDisposed: Boolean,
      remarks: String,
      signOff: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // Suspension/Cancellation
    suspension: {
      suspendedAt: Date,
      suspendedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      resumedAt: Date,
      resumedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    cancellation: {
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
    },

    // Status
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "issued",
        "active",
        "suspended",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "draft",
    },

    // Attachments
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: Date,
      },
    ],

    // Notes and comments
    notes: [
      {
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        type: { type: String, enum: ["general", "warning", "reminder"] },
      },
    ],

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Auto-increment permit number
permitSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "permit" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.permitNumber = counter.seq + 6000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Method to check if permit is expired
permitSchema.methods.isExpired = function () {
  return new Date() > this.validTo;
};

// Method to add monitoring entry
permitSchema.methods.addMonitoring = function (monitoringData) {
  this.monitoring.push(monitoringData);
  return this.save();
};

module.exports = mongoose.model("Permit", permitSchema);
