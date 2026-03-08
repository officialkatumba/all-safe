const mongoose = require("mongoose");
const Counter = require("./Counter");

const jsaSchema = new mongoose.Schema(
  {
    jsaNumber: { type: Number, unique: true },

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

    jobTitle: { type: String, required: true },
    jobDescription: String,
    department: String,

    // Steps of the job
    steps: [
      {
        stepNumber: Number,
        description: String,
        hazards: [String],
        controls: [String],
        ppeRequired: [String],
      },
    ],

    // Required PPE
    ppeRequirements: [
      {
        item: String,
        quantity: Number,
        condition: String,
      },
    ],

    // Required permits
    permitsRequired: [
      {
        type: String,
        number: String,
        issuedBy: String,
        expiryDate: Date,
      },
    ],

    // Competencies required
    competencies: [
      {
        skill: String,
        certification: String,
        required: Boolean,
      },
    ],

    // Approval
    approvals: [
      {
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SafetyOfficer",
        },
        date: Date,
        comments: String,
      },
    ],

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
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
      this.jsaNumber = counter.seq + 3000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("JSA", jsaSchema);
