const mongoose = require("mongoose");
const Counter = require("./Counter");

const ppeChecklistSchema = new mongoose.Schema(
  {
    checklistNumber: { type: Number, unique: true },

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

    title: String,
    date: { type: Date, default: Date.now },

    // For task-specific PPE
    applicableTasks: [String],
    applicableDepartments: [String],
    applicableShifts: [
      { type: String, enum: ["morning", "afternoon", "night", "all"] },
    ],

    // PPE items required
    ppeItems: [
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
        customItem: String, // If "other" is selected
        required: { type: Boolean, default: true },
        condition: String,
        quantity: Number,
        location: String,
        assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],

    // Inspection checklist
    inspectionItems: [
      {
        item: String,
        passCriteria: String,
        passed: Boolean,
        comments: String,
        inspectedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        inspectedAt: Date,
      },
    ],

    // Worker sign-off
    workerSignoffs: [
      {
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        shift: String,
        acknowledged: Boolean,
        signedAt: Date,
        comments: String,
      },
    ],

    status: {
      type: String,
      enum: ["draft", "active", "completed", "archived"],
      default: "draft",
    },
  },
  { timestamps: true },
);

ppeChecklistSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "ppechecklist" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.checklistNumber = counter.seq + 4000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("PPEChecklist", ppeChecklistSchema);
