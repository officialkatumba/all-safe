const mongoose = require("mongoose");

const usageEventSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    worksite: { type: mongoose.Schema.Types.ObjectId, ref: "Worksite" },
    workArea: { type: mongoose.Schema.Types.ObjectId, ref: "WorkArea" },
    eventType: {
      type: String,
      enum: [
        "login",
        "ai_generation",
        "download",
        "incident_reported",
        "alert_created",
        "environmental_assessment",
        "worksite_created",
        "work_area_created",
        "system",
      ],
      required: true,
    },
    module: String,
    description: String,
    relatedModel: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

module.exports = mongoose.model("UsageEvent", usageEventSchema);
