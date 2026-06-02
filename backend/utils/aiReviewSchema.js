const mongoose = require("mongoose");

function addAiReviewFields(schema) {
  schema.add({
    officerReview: {
      status: {
        type: String,
        enum: ["pending", "revised", "approved"],
        default: "pending",
      },
      history: [
        {
          comments: { type: String, required: true },
          submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          submittedAt: { type: Date, default: Date.now },
          generatedVersion: Number,
        },
      ],
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
    },
    version: { type: Number, default: 1 },
    previousVersions: [
      {
        version: Number,
        output: mongoose.Schema.Types.Mixed,
        officerComments: String,
        generatedAt: Date,
      },
    ],
  });
}

module.exports = { addAiReviewFields };
