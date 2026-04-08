// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const safetyTalkSchema = new mongoose.Schema(
//   {
//     talkNumber: { type: Number, unique: true },

//     // Can target multiple work areas
//     targetWorkAreas: [
//       { type: mongoose.Schema.Types.ObjectId, ref: "WorkArea", required: true },
//     ],

//     // Shift targeted
//     targetShifts: [
//       { type: String, enum: ["morning", "afternoon", "night", "all"] },
//     ],

//     // Who conducted/created it
//     conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
//     conductedByName: String,

//     // AI Generation metadata
//     aiGenerated: { type: Boolean, default: true },
//     aiModel: { type: String, default: "gpt-4" },
//     generationDate: { type: Date, default: Date.now },

//     // Talk content
//     title: { type: String, required: true },
//     topic: String,
//     content: { type: String, required: true }, // Full AI-generated content

//     // Structured sections for easier display
//     sections: {
//       opening: String,
//       mainPoints: [String],
//       discussionQuestions: [String],
//       workerEngagement: [String],
//       realLifeExamples: [String],
//       keyTakeaways: [String],
//       closing: String,
//     },

//     // What informed this talk (AI context)
//     basedOn: {
//       recentIncidents: [
//         { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
//       ],
//       recentNearMisses: [
//         { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
//       ],
//       identifiedHazards: [{ type: mongoose.Schema.Types.ObjectId }], // References to hazard IDs
//       riskAssessments: [
//         { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },
//       ],

//       // AI's reasoning for generating this talk
//       aiReasoning: String,

//       // Context used
//       siteContextUsed: {
//         workAreaConditions: Boolean,
//         recentEvents: Boolean,
//         seasonalFactors: Boolean,
//         workerFeedback: Boolean,
//       },
//     },

//     // Site-specific context that influenced the talk
//     siteContextInfluences: [
//       {
//         factor: String,
//         howApplied: String,
//       },
//     ],

//     // Schedule
//     date: { type: Date, default: Date.now },
//     duration: Number, // in minutes
//     scheduledFor: Date,
//     scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },

//     // Attendance
//     attendance: {
//       attendees: [
//         {
//           userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//           name: String,
//           shift: String,
//           workArea: { type: mongoose.Schema.Types.ObjectId, ref: "WorkArea" },
//           signature: String,
//           attendedAt: { type: Date, default: Date.now },
//           feedback: String,
//         },
//       ],
//       anonymousCount: { type: Number, default: 0 },
//       totalAttendees: { type: Number, default: 0 },
//       workAreasRepresented: [String],
//     },

//     // Worker feedback (for continuous improvement)
//     feedback: [
//       {
//         workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         anonymous: { type: Boolean, default: true },
//         rating: { type: Number, min: 1, max: 5 },
//         comment: String,
//         topicsRequested: [String],
//         date: { type: Date, default: Date.now },
//         helpful: Boolean,
//       },
//     ],

//     // Topics covered (for search/filter)
//     topics: [String],

//     // PPE mentioned in this talk
//     ppeMentioned: [
//       {
//         item: String,
//         context: String,
//         emphasized: { type: Boolean, default: false },
//       },
//     ],

//     // Hazards addressed
//     hazardsAddressed: [
//       {
//         hazard: String,
//         riskLevel: String,
//         controlsDiscussed: [String],
//       },
//     ],

//     // Languages (for multilingual teams)
//     languages: [
//       {
//         language: String,
//         title: String,
//         content: String,
//         translatedBy: { type: String, enum: ["ai", "human"] },
//       },
//     ],

//     // Materials
//     materials: [
//       {
//         type: {
//           type: String,
//           enum: ["handout", "poster", "presentation", "video"],
//         },
//         url: String,
//         description: String,
//       },
//     ],

//     // Status
//     status: {
//       type: String,
//       enum: [
//         "draft",
//         "scheduled",
//         "published",
//         "conducted",
//         "cancelled",
//         "archived",
//       ],
//       default: "draft",
//     },

//     // Approval workflow
//     requiresApproval: { type: Boolean, default: false },
//     approvalStatus: {
//       type: String,
//       enum: ["pending", "approved", "rejected", "not_required"],
//       default: "not_required",
//     },
//     approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
//     approvedAt: Date,

//     // Effectiveness rating (by safety officer)
//     effectiveness: {
//       rating: { type: Number, min: 1, max: 5 },
//       reviewedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "SafetyOfficer",
//       },
//       reviewedAt: Date,
//       comments: String,
//       workerEngagement: { type: String, enum: ["low", "medium", "high"] },
//     },

//     // Version tracking
//     version: { type: Number, default: 1 },
//     previousVersions: [
//       {
//         version: Number,
//         content: String,
//         generatedAt: Date,
//         reason: String,
//       },
//     ],

//     // Reusable template
//     isTemplate: { type: Boolean, default: false },
//     templateName: String,
//     templateCategory: String,

//     // Metadata
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
//     updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SafetyOfficer" },
//   },
//   { timestamps: true },
// );

// // Auto-increment talk number
// safetyTalkSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         { _id: "safetytalk" },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true },
//       );
//       this.talkNumber = counter.seq + 5000;
//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// // Method to add attendee
// safetyTalkSchema.methods.addAttendee = function (attendeeData) {
//   this.attendance.attendees.push(attendeeData);
//   this.attendance.totalAttendees = this.attendance.attendees.length;
//   return this.save();
// };

// // Method to add feedback
// safetyTalkSchema.methods.addFeedback = function (feedbackData) {
//   this.feedback.push(feedbackData);
//   return this.save();
// };

// // Method to mark as conducted
// safetyTalkSchema.methods.markAsConducted = function () {
//   this.status = "conducted";
//   this.date = new Date();
//   return this.save();
// };

// module.exports = mongoose.model("SafetyTalk", safetyTalkSchema);

const mongoose = require("mongoose");
const Counter = require("./Counter");

const safetyTalkSchema = new mongoose.Schema(
  {
    talkNumber: { type: Number, unique: true },

    // Target work areas
    targetWorkAreas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkArea",
      },
    ],

    // Talk details
    title: { type: String, required: true },
    content: { type: String, required: true },
    duration: { type: Number, default: 5 }, // minutes
    topics: [String],

    // Structured sections for display
    sections: {
      opening: String,
      mainPoints: [String],
      discussionQuestions: [String],
      keyTakeaways: [String],
      closing: String,
    },

    // Who created/generated it
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SafetyOfficer",
    },
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SafetyOfficer",
    },
    date: { type: Date, default: Date.now },

    // Status
    status: {
      type: String,
      enum: ["draft", "published", "conducted", "archived"],
      default: "draft",
    },

    // Attendance tracking
    attendance: {
      totalAttendees: { type: Number, default: 0 },
      attendees: [
        {
          name: String,
          role: String,
          department: String,
        },
      ],
    },

    // Feedback from workers
    feedback: [
      {
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        anonymous: { type: Boolean, default: false },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        date: { type: Date, default: Date.now },
      },
    ],

    // Effectiveness tracking
    effectiveness: {
      rating: { type: Number, min: 1, max: 5 },
      comments: String,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SafetyOfficer",
      },
      reviewedAt: Date,
    },

    // AI generation metadata
    aiGenerated: { type: Boolean, default: true },
    aiModel: String,
    generationDate: { type: Date, default: Date.now },
    basedOn: {
      recentIncidents: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Incident" },
      ],
      identifiedHazards: [{ type: mongoose.Schema.Types.ObjectId }],
      riskAssessments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },
      ],
      previousTalks: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SafetyTalk" },
      ],
      aiPrompt: String,
      aiReasoning: String,
    },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
      this.talkNumber = counter.seq + 5000;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("SafetyTalk", safetyTalkSchema);
