const mongoose = require("mongoose");
const Counter = require("./Counter");

const safetyTalkSchema = new mongoose.Schema(
  {
    talkNumber: { type: Number, unique: true },

    // Core relationship
    worksite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worksite",
      required: true,
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night", "all"],
      default: "all",
    },

    // Who conducted/created it
    conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
    conductedByName: String,

    // AI Generation metadata
    aiGenerated: { type: Boolean, default: true },
    aiModel: { type: String, default: "gpt-4" },
    generationDate: { type: Date, default: Date.now },

    // Talk content (AI-generated)
    title: { type: String, required: true },
    topic: String,

    // The full AI-generated content (stored as markdown/HTML)
    content: { type: String, required: true },

    // Structured sections for easier display
    sections: {
      opening: String,
      mainPoints: [String],
      discussionQuestions: [String],
      workerEngagement: [String],
      keyTakeaways: [String],
      closing: String,
    },

    // What informed this talk (AI context)
    basedOn: {
      recentIncidents: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
      ],
      recentNearMisses: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
      ],
      identifiedHazards: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Worksite.identifiedHazards",
        },
      ],
      riskAssessments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Worksite.riskAssessments",
        },
      ],

      // AI's reasoning for generating this talk
      aiReasoning: String,

      // Context used from site history
      siteContextUsed: {
        initialComments: Boolean,
        knownChallenges: Boolean,
        pastIncidents: Boolean,
      },
    },

    // Site-specific context that influenced the talk (from siteHistory)
    siteContextInfluences: [
      {
        factor: String,
        howApplied: String,
      },
    ],

    // When and where it was used
    date: { type: Date, default: Date.now },
    duration: Number, // in minutes

    // Attendance (optional)
    attendees: [
      {
        name: String, // Anonymous if worker
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        shift: String,
        signature: String,
        attendedAt: { type: Date, default: Date.now },
        feedback: String,
      },
    ],
    attendeeCount: { type: Number, default: 0 },

    // Worker feedback (for continuous improvement)
    feedback: [
      {
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        anonymous: { type: Boolean, default: true },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        topicsRequested: [String],
        date: { type: Date, default: Date.now },
      },
    ],

    // Topics covered (for search/filter)
    topics: [String],

    // PPE mentioned in this talk
    ppeMentioned: [
      {
        item: String,
        context: String,
      },
    ],

    // Languages (for multilingual teams)
    languages: [
      {
        language: String,
        title: String,
        content: String,
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "conducted", "archived"],
      default: "draft",
    },

    // Scheduling
    scheduledFor: Date,
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },

    // Effectiveness rating (by safety officer)
    effectiveness: {
      rating: { type: Number, min: 1, max: 5 },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SafetyOfficer",
      },
      reviewedAt: Date,
      comments: String,
    },

    // Version tracking (for updates)
    version: { type: Number, default: 1 },
    previousVersions: [
      {
        version: Number,
        content: String,
        generatedAt: Date,
        reason: String,
      },
    ],
  },
  { timestamps: true },
);

// Auto-increment talk number
safetyTalkSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "safetytalk" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      this.talkNumber = counter.seq + 5000; // Start from 5000
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Method to add attendance
safetyTalkSchema.methods.addAttendee = function (attendeeData) {
  this.attendees.push(attendeeData);
  this.attendeeCount = this.attendees.length;
  return this.save();
};

// Method to add feedback
safetyTalkSchema.methods.addFeedback = function (feedbackData) {
  this.feedback.push(feedbackData);
  return this.save();
};

// Method to mark as conducted
safetyTalkSchema.methods.markAsConducted = function () {
  this.status = "conducted";
  this.date = new Date();
  return this.save();
};

module.exports = mongoose.model("SafetyTalk", safetyTalkSchema);
