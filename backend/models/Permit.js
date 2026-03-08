const mongoose = require("mongoose");
const Counter = require("./Counter");

const permitSchema = new mongoose.Schema(
  {
    permitNumber: { type: Number, unique: true },

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
      ],
      required: true,
    },

    title: String,
    description: String,

    // Validity
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    extended: [
      {
        extendedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        extendedTo: Date,
        reason: String,
        extendedAt: Date,
      },
    ],

    // Location
    location: String,
    specificArea: String,

    // Work details
    workDescription: String,
    workersInvolved: [
      {
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        role: String,
      },
    ],

    // Hazards and controls
    hazards: [
      {
        hazard: String,
        controls: [String],
      },
    ],

    // PPE required
    ppeRequired: [String],

    // Gas testing (for confined space/hot work)
    gasTests: [
      {
        testTime: Date,
        oxygen: Number,
        combustibles: Number,
        toxicGases: Object,
        testedBy: String,
        results: { type: String, enum: ["pass", "fail"] },
      },
    ],

    // Sign-offs
    authorizations: [
      {
        authorizer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        role: String,
        date: Date,
        signature: String,
        comments: String,
      },
    ],

    // Acceptance by work team
    acceptance: {
      acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      acceptedAt: Date,
      signature: String,
      teamBriefed: Boolean,
    },

    // Completion
    completion: {
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SafetyOfficer",
      },
      workCompleted: Boolean,
      areaLeftSafe: Boolean,
      remarks: String,
      signOff: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
    },

    // Cancellation
    cancellation: {
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SafetyOfficer",
      },
      reason: String,
    },

    status: {
      type: String,
      enum: [
        "draft",
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
      },
    ],
  },
  { timestamps: true },
);

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

module.exports = mongoose.model("Permit", permitSchema);
