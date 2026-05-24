// const mongoose = require("mongoose");
// const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       unique: true,
//       required: true,
//     },

//     name: {
//       type: String,
//       required: true,
//     },

//     // Role determines what the user can do
//     role: {
//       type: String,
//       enum: ["system_admin", "safety_officer", "supervisor", "worker"],
//       required: true,
//       default: "worker",
//     },

//     // Company Information (for enterprise admin)
//     companyName: {
//       type: String,
//       default: null,
//     },
//     companySize: {
//       type: String,
//       enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
//       default: null,
//     },
//     companyRegistrationNumber: {
//       type: String,
//       default: null,
//     },
//     companyAddress: {
//       type: String,
//       default: null,
//     },
//     companyPhone: {
//       type: String,
//       default: null,
//     },

//     // Company PIN system
//     companyPin: {
//       type: String,
//       sparse: true,
//       default: null,
//     },
//     companyPinExpiresAt: {
//       type: Date,
//       default: null,
//     },
//     companyPinUsedBy: [
//       {
//         userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         usedAt: { type: Date, default: Date.now },
//       },
//     ],
//     maxPinUses: {
//       type: Number,
//       default: 1, // Can be changed for multiple uses
//     },

//     // Company membership
//     companyId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       sparse: true,
//       default: null,
//     },

//     // Reference to SafetyOfficer profile (only for safety_officer role)
//     safetyOfficer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SafetyOfficer",
//       sparse: true,
//     },

//     // Add these to your userSchema if not already there
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     verifiedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//     verifiedAt: {
//       type: Date,
//       default: null,
//     },
//     mustChangePassword: {
//       type: Boolean,
//       default: true,
//     },

//     // Who created this account (for enterprise)
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     // Account status
//     isActive: {
//       type: Boolean,
//       default: true,
//     },

//     hadLoggedIn: {
//       type: Boolean,
//       default: false,
//     },

//     // Password reset fields
//     resetPasswordToken: String,
//     resetPasswordExpires: Date,
//   },
//   {
//     timestamps: true,
//   },
// );

// // Passport-Local Mongoose plugin
// userSchema.plugin(passportLocalMongoose, {
//   usernameField: "email",
//   errorMessages: {
//     UserExistsError: "A user with the given email already exists",
//   },
// });

// // Method to check if user is admin
// userSchema.methods.isAdmin = function () {
//   return this.role === "system_admin";
// };

// // Method to check if user is safety officer
// userSchema.methods.isSafetyOfficer = function () {
//   return this.role === "safety_officer";
// };

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    // Role determines what the user can do
    role: {
      type: String,
      enum: [
        "system_owner",
        "enterprise_admin",
        "system_admin",
        "safety_officer",
        "supervisor",
        "worker",
      ],
      required: true,
      default: "worker",
    },

    // Company Information (for enterprise admin)
    companyName: {
      type: String,
      default: null,
    },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      default: null,
    },
    companyRegistrationNumber: {
      type: String,
      default: null,
    },
    companyAddress: {
      type: String,
      default: null,
    },
    companyPhone: {
      type: String,
      default: null,
    },

    // Company PIN system
    companyPin: {
      type: String,
      sparse: true,
      default: null,
    },
    companyPinExpiresAt: {
      type: Date,
      default: null,
    },
    companyPinUsedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    maxPinUses: {
      type: Number,
      default: 1,
    },

    // Company membership
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      default: null,
    },

    // Reference to SafetyOfficer profile (only for safety_officer role)
    safetyOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SafetyOfficer",
      sparse: true,
    },

    // ========== NEW FIELDS FOR WORKERS ==========
    // Which work area the worker is assigned to
    workArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkArea",
      default: null,
    },
    // Worker shift (morning, afternoon, night)
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night"],
      default: "morning",
    },
    // ==========================================

    // Add these to your userSchema if not already there
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    // Who created this account (for enterprise)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    isSystemOwner: {
      type: Boolean,
      default: false,
    },

    subscription: {
      plan: {
        type: String,
        enum: ["pilot", "solo", "contractor", "company", "enterprise"],
        default: "pilot",
      },
      status: {
        type: String,
        enum: ["trial", "active", "past_due", "paused", "cancelled"],
        default: "trial",
      },
      trialEndsAt: Date,
      billingEmail: String,
    },

    hadLoggedIn: {
      type: Boolean,
      default: false,
    },

    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  },
);

// Passport-Local Mongoose plugin
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  errorMessages: {
    UserExistsError: "A user with the given email already exists",
  },
});

// Method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === "enterprise_admin" || this.role === "system_admin";
};

// Method to check if user is the software owner
userSchema.methods.isSoftwareOwner = function () {
  return this.role === "system_owner" || this.isSystemOwner === true;
};

// Method to check if user is safety officer
userSchema.methods.isSafetyOfficer = function () {
  return this.role === "safety_officer";
};

module.exports = mongoose.model("User", userSchema);
