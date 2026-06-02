// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const ppeChecklistSchema = new mongoose.Schema(
//   {
//     checklistNumber: { type: Number, unique: true },

//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     title: String,
//     date: { type: Date, default: Date.now },

//     // For task-specific PPE
//     applicableTasks: [String],
//     applicableDepartments: [String],
//     applicableShifts: [
//       { type: String, enum: ["morning", "afternoon", "night", "all"] },
//     ],

//     // PPE items required
//     ppeItems: [
//       {
//         item: {
//           type: String,
//           enum: [
//             "hard_hat",
//             "safety_glasses",
//             "ear_plugs",
//             "ear_muffs",
//             "high_vis_vest",
//             "steel_toe_boots",
//             "gloves",
//             "respirator",
//             "harness",
//             "face_shield",
//             "welding_helmet",
//             "chemical_suit",
//             "knee_pads",
//             "fall_arrest",
//             "other",
//           ],
//         },
//         customItem: String, // If "other" is selected
//         required: { type: Boolean, default: true },
//         condition: String,
//         quantity: Number,
//         location: String,
//         assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//       },
//     ],

//     // Inspection checklist
//     inspectionItems: [
//       {
//         item: String,
//         passCriteria: String,
//         passed: Boolean,
//         comments: String,
//         inspectedBy: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User",
//         },
//         inspectedAt: Date,
//       },
//     ],

//     // Worker sign-off
//     workerSignoffs: [
//       {
//         workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         name: String,
//         shift: String,
//         acknowledged: Boolean,
//         signedAt: Date,
//         comments: String,
//       },
//     ],

//     status: {
//       type: String,
//       enum: ["draft", "active", "completed", "archived"],
//       default: "draft",
//     },
//   },
//   { timestamps: true },
// );

// ppeChecklistSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         { _id: "ppechecklist" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true },
//       );
//       this.checklistNumber = counter.seq + 4000;
//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("PPEChecklist", ppeChecklistSchema);

// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const ppeChecklistSchema = new mongoose.Schema(
//   {
//     checklistNumber: { type: Number, unique: true },

//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     title: String,
//     date: { type: Date, default: Date.now },

//     // For task-specific PPE
//     applicableTasks: [String],
//     applicableDepartments: [String],
//     applicableShifts: [
//       { type: String, enum: ["morning", "afternoon", "night", "all"] },
//     ],

//     // PPE items required - NO ENUM, accepts any string
//     ppeItems: [
//       {
//         item: { type: String, required: true }, // Removed enum - now accepts any string
//         customItem: String,
//         required: { type: Boolean, default: true },
//         condition: String,
//         quantity: Number,
//         location: String,
//         reason: String, // Added to store why this PPE is needed
//         assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//       },
//     ],

//     // Inspection checklist
//     inspectionItems: [
//       {
//         item: String,
//         passCriteria: String,
//         passed: Boolean,
//         comments: String,
//         inspectedBy: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User",
//         },
//         inspectedAt: Date,
//       },
//     ],

//     // Worker sign-off
//     workerSignoffs: [
//       {
//         workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         name: String,
//         shift: String,
//         acknowledged: Boolean,
//         signedAt: Date,
//         comments: String,
//       },
//     ],

//     // Special instructions from AI
//     specialInstructions: String,

//     status: {
//       type: String,
//       enum: ["draft", "active", "completed", "archived"],
//       default: "active",
//     },
//   },
//   { timestamps: true },
// );

// ppeChecklistSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         { _id: "ppechecklist" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true },
//       );
//       this.checklistNumber = counter.seq + 4000;
//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("PPEChecklist", ppeChecklistSchema);

const mongoose = require("mongoose");
const Counter = require("./Counter");
const { addAiReviewFields } = require("../utils/aiReviewSchema");

const ppeChecklistSchema = new mongoose.Schema(
  {
    checklistNumber: {
      type: Number,
      unique: true,
    },

    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      required: true,
    },

    // Checklist details
    title: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    // AI-generated PPE items
    ppeItems: [
      {
        item: {
          type: String,
          required: true,
        },

        customItem: {
          type: String,
          default: "",
        },

        required: {
          type: Boolean,
          default: true,
        },

        condition: {
          type: String,
          default: "Good",
        },

        quantity: {
          type: String,
          default: "As needed",
        },

        reason: {
          type: String,
          default: "",
        },
      },
    ],

    // AI-generated inspection checklist
    inspectionItems: [
      {
        item: {
          type: String,
          required: true,
        },

        passCriteria: {
          type: String,
          required: true,
        },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["draft", "active", "completed", "archived"],
      default: "active",
    },

    // Who generated/prepared the checklist
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Completion details
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    completedAt: {
      type: Date,
    },

    // Optional AI metadata
    aiGenerated: {
      type: Boolean,
      default: true,
    },

    aiModel: {
      type: String,
      default: "",
    },

    generationPrompt: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

addAiReviewFields(ppeChecklistSchema);

// Auto-increment checklist number
ppeChecklistSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "ppechecklist" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );

      this.checklistNumber = counter.seq + 6000;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

module.exports = mongoose.model("PPEChecklist", ppeChecklistSchema);
