// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const jsaSchema = new mongoose.Schema(
//   {
//     jsaNumber: { type: Number, unique: true },

//     worksite: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Worksite",
//       required: true,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SafetyOfficer",
//       required: true,
//     },

//     jobTitle: { type: String, required: true },
//     jobDescription: String,
//     department: String,

//     // Steps of the job
//     steps: [
//       {
//         stepNumber: Number,
//         description: String,
//         hazards: [String],
//         controls: [String],
//         ppeRequired: [String],
//       },
//     ],

//     // Required PPE
//     ppeRequirements: [
//       {
//         item: String,
//         quantity: Number,
//         condition: String,
//       },
//     ],

//     // Required permits
//     permitsRequired: [
//       {
//         type: String,
//         number: String,
//         issuedBy: String,
//         expiryDate: Date,
//       },
//     ],

//     // Competencies required
//     competencies: [
//       {
//         skill: String,
//         certification: String,
//         required: Boolean,
//       },
//     ],

//     // Approval
//     approvals: [
//       {
//         approver: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "SafetyOfficer",
//         },
//         date: Date,
//         comments: String,
//       },
//     ],

//     status: {
//       type: String,
//       enum: ["draft", "active", "archived"],
//       default: "draft",
//     },
//   },
//   { timestamps: true },
// );

// jsaSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         { _id: "jsa" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true },
//       );
//       this.jsaNumber = counter.seq + 3000;
//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("JSA", jsaSchema);

// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const jsaSchema = new mongoose.Schema(
//   {
//     jsaNumber: { type: Number, unique: true },

//     // Core relationship
//     workArea: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "WorkArea",
//       required: true,
//     },

//     // Basic info
//     title: { type: String, required: true },
//     jobTask: { type: String, required: true },
//     location: String,
//     date: { type: Date, default: Date.now },
//     shift: {
//       type: String,
//       enum: ["morning", "afternoon", "night", "all"],
//       default: "all",
//     },

//     // Personnel
//     preparedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SafetyOfficer",
//       required: true,
//     },
//     reviewedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SafetyOfficer",
//     },
//     approvedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SafetyOfficer",
//     },

//     // Required PPE
//     requiredPPE: [
//       {
//         item: String,
//         quantity: Number,
//         condition: String,
//       },
//     ],

//     // Required training/certifications
//     requiredTraining: [String],
//     requiredCertifications: [String],

//     // Tools and equipment needed
//     toolsAndEquipment: [
//       {
//         name: String,
//         condition: String,
//         inspected: Boolean,
//       },
//     ],

//     // ========== HUMAN WRITTEN SECTIONS ==========
//     humanSections: {
//       type: {
//         jobSteps: { type: String, default: "" },
//         hazardAnalysis: { type: String, default: "" },
//         controlMeasures: { type: String, default: "" },
//         emergencyProcedures: { type: String, default: "" },
//         approvalSection: { type: String, default: "" },
//       },
//       default: {},
//     },

//     // ========== AI ENHANCED SECTIONS ==========
//     aiSections: {
//       type: {
//         jobSteps: {
//           content: { type: String, default: "" },
//           confirmed: { type: Boolean, default: false },
//         },
//         hazardAnalysis: {
//           content: { type: String, default: "" },
//           confirmed: { type: Boolean, default: false },
//         },
//         controlMeasures: {
//           content: { type: String, default: "" },
//           confirmed: { type: Boolean, default: false },
//         },
//         emergencyProcedures: {
//           content: { type: String, default: "" },
//           confirmed: { type: Boolean, default: false },
//         },
//         approvalSection: {
//           content: { type: String, default: "" },
//           confirmed: { type: Boolean, default: false },
//         },
//       },
//       default: {},
//     },

//     // ========== Active version tracking ==========
//     activeVersion: {
//       type: {
//         jobSteps: { type: String, enum: ["human", "ai"], default: "human" },
//         hazardAnalysis: {
//           type: String,
//           enum: ["human", "ai"],
//           default: "human",
//         },
//         controlMeasures: {
//           type: String,
//           enum: ["human", "ai"],
//           default: "human",
//         },
//         emergencyProcedures: {
//           type: String,
//           enum: ["human", "ai"],
//           default: "human",
//         },
//         approvalSection: {
//           type: String,
//           enum: ["human", "ai"],
//           default: "human",
//         },
//       },
//       default: {},
//     },

//     // ========== Section confirmation status ==========
//     sectionConfirmed: {
//       type: {
//         jobSteps: { type: Boolean, default: false },
//         hazardAnalysis: { type: Boolean, default: false },
//         controlMeasures: { type: Boolean, default: false },
//         emergencyProcedures: { type: Boolean, default: false },
//         approvalSection: { type: Boolean, default: false },
//       },
//       default: {},
//     },

//     // ========== Consolidated JSA ==========
//     consolidatedJSA: {
//       content: { type: String, default: "" },
//       pdfUrl: { type: String, default: "" },
//       pdfUploaded: { type: Boolean, default: false },
//       generatedAt: Date,
//     },

//     // ========== Overall Status ==========
//     overallStatus: {
//       allSectionsConfirmed: { type: Boolean, default: false },
//       consolidatedGenerated: { type: Boolean, default: false },
//     },

//     // AI metadata
//     aiGenerated: { type: Boolean, default: false },
//     aiModel: String,

//     // Status
//     status: {
//       type: String,
//       enum: [
//         "draft",
//         "under_review",
//         "approved",
//         "active",
//         "archived",
//         "completed",
//       ],
//       default: "draft",
//     },

//     // Validity
//     validFrom: Date,
//     validTo: Date,

//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
//     updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
//   },
//   { timestamps: true },
// );

// // Auto-increment JSA number
// jsaSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         { _id: "jsa" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true },
//       );
//       this.jsaNumber = counter.seq + 6000;
//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("JSA", jsaSchema);

const mongoose = require("mongoose");
const Counter = require("./Counter");

const jsaSchema = new mongoose.Schema(
  {
    jsaNumber: { type: Number, unique: true },

    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },

    title: { type: String, required: true },
    jobTask: { type: String, required: true },
    location: String,
    date: { type: Date, default: Date.now },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night", "all"],
      default: "all",
    },

    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SafetyOfficer",
      required: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },

    // FIXED: quantity as String, not Number
    requiredPPE: [
      {
        item: { type: String, required: true },
        quantity: { type: String, default: "As needed" }, // Changed to String
        condition: { type: String, default: "Good" },
      },
    ],

    requiredTraining: [String],
    requiredCertifications: [String],

    toolsAndEquipment: [
      {
        name: String,
        condition: String,
        inspected: { type: Boolean, default: false },
      },
    ],

    humanSections: {
      type: {
        jobSteps: { type: String, default: "" },
        hazardAnalysis: { type: String, default: "" },
        controlMeasures: { type: String, default: "" },
        emergencyProcedures: { type: String, default: "" },
        approvalSection: { type: String, default: "" },
      },
      default: {},
    },

    aiSections: {
      type: {
        jobSteps: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        hazardAnalysis: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        controlMeasures: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        emergencyProcedures: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
        approvalSection: {
          content: { type: String, default: "" },
          confirmed: { type: Boolean, default: false },
        },
      },
      default: {},
    },

    activeVersion: {
      type: {
        jobSteps: { type: String, enum: ["human", "ai"], default: "human" },
        hazardAnalysis: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        controlMeasures: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        emergencyProcedures: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
        approvalSection: {
          type: String,
          enum: ["human", "ai"],
          default: "human",
        },
      },
      default: {},
    },

    sectionConfirmed: {
      type: {
        jobSteps: { type: Boolean, default: false },
        hazardAnalysis: { type: Boolean, default: false },
        controlMeasures: { type: Boolean, default: false },
        emergencyProcedures: { type: Boolean, default: false },
        approvalSection: { type: Boolean, default: false },
      },
      default: {},
    },

    consolidatedJSA: {
      content: { type: String, default: "" },
      pdfUrl: { type: String, default: "" },
      pdfUploaded: { type: Boolean, default: false },
      generatedAt: Date,
    },

    overallStatus: {
      allSectionsConfirmed: { type: Boolean, default: false },
      consolidatedGenerated: { type: Boolean, default: false },
    },

    aiGenerated: { type: Boolean, default: false },
    aiModel: String,

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

    validFrom: Date,
    validTo: Date,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
  },
  { timestamps: true },
);

jsaSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "jsa" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.jsaNumber = counter.seq + 6000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("JSA", jsaSchema);
