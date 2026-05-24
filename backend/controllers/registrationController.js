const SafetyOfficer = require("../models/SafetyOfficer");
const User = require("../models/User");
const Worksite = require("../models/Worksite");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Show registration options page
exports.showRegistrationOptions = (req, res) => {
  res.render("registration/options");
};

// Show enterprise admin registration form
exports.showEnterpriseAdminForm = (req, res) => {
  res.render("registration/enterprise-admin");
};

// Process enterprise admin registration  WORKING
// exports.registerEnterpriseAdmin = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       companyName,
//       companySize,
//       password,
//       companyRegistrationNumber,
//       companyAddress,
//       companyPhone,
//     } = req.body;

//     // Validate required fields
//     if (!name || !email || !companyName || !password) {
//       req.flash("error", "All required fields must be filled");
//       return res.redirect("/register/enterprise-admin");
//     }

//     // Validate password strength
//     if (password.length < 6) {
//       req.flash("error", "Password must be at least 6 characters long");
//       return res.redirect("/register/enterprise-admin");
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       req.flash("error", "A user with this email already exists");
//       return res.redirect("/register/enterprise-admin");
//     }

//     // Create User as system_admin with company info
//     const user = await new Promise((resolve, reject) => {
//       User.register(
//         new User({
//           email,
//           name,
//           role: "system_admin",
//           companyName: companyName || null,
//           companySize: companySize || null,
//           companyRegistrationNumber: companyRegistrationNumber || null,
//           companyAddress: companyAddress || null,
//           companyPhone: companyPhone || null,
//           hadLoggedIn: false,
//           isActive: true,
//         }),
//         password,
//         (err, user) => {
//           if (err) reject(err);
//           resolve(user);
//         },
//       );
//     });

//     req.flash(
//       "success",
//       `Enterprise admin account created successfully for ${companyName}! You can now login with email: ${email}`,
//     );
//     return res.redirect("/api/users/login");
//   } catch (error) {
//     console.error("Enterprise admin registration error:", error);

//     if (error.code === 11000) {
//       req.flash("error", "Email already registered");
//     } else {
//       req.flash("error", `Registration failed: ${error.message}`);
//     }
//     return res.redirect("/register/enterprise-admin");
//   }
// };

// exports.adminCreateSafetyOfficer = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       bio,
//       assignToWorksite,
//       department,
//       employeeId,
//       role: officerRole,
//       password,
//       confirmPassword,
//     } = req.body;

//     // Validate passwords
//     if (!password || password.length < 6) {
//       req.flash("error", "Password must be at least 6 characters long");
//       return res.redirect("/admin/safety-officers/create");
//     }

//     if (password !== confirmPassword) {
//       req.flash("error", "Passwords do not match");
//       return res.redirect("/admin/safety-officers/create");
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       req.flash("error", "A user with this email already exists");
//       return res.redirect("/admin/safety-officers/create");
//     }

//     // Create a new User object with ONLY the absolute minimum fields
//     // Let the plugin handle the password hashing
//     const newUser = new User({
//       email,
//       name,
//       role: "safety_officer",
//     });

//     // Use User.register with the user object and password
//     const user = await new Promise((resolve, reject) => {
//       User.register(newUser, password, (err, user) => {
//         if (err) reject(err);
//         resolve(user);
//       });
//     });

//     // Now add all the additional fields after user is created
//     user.createdBy = req.user._id;
//     user.isActive = true;
//     user.hadLoggedIn = false;
//     user.isVerified = true;
//     user.verifiedBy = req.user._id;
//     user.verifiedAt = new Date();
//     user.mustChangePassword = false;
//     await user.save();

//     // Generate officer number
//     const officerCount = await SafetyOfficer.countDocuments();
//     const officerNumber = `SO${String(officerCount + 1).padStart(5, "0")}`;

//     // Create Safety Officer profile
//     const newSafetyOfficer = new SafetyOfficer({
//       name,
//       email,
//       phone: phone || "",
//       bio: bio || "",
//       officerNumber,
//       department: department || "",
//       employeeId: employeeId || "",
//       officerRole: officerRole || "safety_officer",
//       verificationStatus: "verified",
//       verifiedBy: req.user._id,
//       verifiedAt: new Date(),
//       createdBy: req.user._id,
//       user: user._id,
//       isActive: true,
//     });

//     await newSafetyOfficer.save();

//     // Update User with safetyOfficer reference
//     user.safetyOfficer = newSafetyOfficer._id;
//     await user.save();

//     // If worksite assignment was selected
//     if (assignToWorksite) {
//       const worksite = await Worksite.findById(assignToWorksite);
//       if (worksite) {
//         worksite.assignedSafetyOfficers.push({
//           officer: newSafetyOfficer._id,
//           role: officerRole || "assistant",
//           assignedDate: new Date(),
//           isActive: true,
//         });
//         await worksite.save();

//         newSafetyOfficer.worksites.push(worksite._id);
//         await newSafetyOfficer.save();
//       }
//     }

//     req.flash(
//       "success",
//       `Safety officer ${name} created successfully. Officer Number: ${newSafetyOfficer.officerNumber}. They can login with the password you set.`,
//     );
//     return res.redirect(`/admin/safety-officers/${newSafetyOfficer._id}`);
//   } catch (error) {
//     console.error("Admin create safety officer error:", error);
//     console.error("Error details:", error.message);
//     req.flash("error", `Failed to create safety officer: ${error.message}`);
//     return res.redirect("/admin/safety-officers/create");
//   }
// };

// backend/controllers/registrationController.js

// Process enterprise admin registration with PIN generation
exports.registerEnterpriseAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      companyName,
      companySize,
      password,
      companyRegistrationNumber,
      companyAddress,
      companyPhone,
      maxPinUses, // Optional: how many times PIN can be used
    } = req.body;

    // Validate required fields
    if (!name || !email || !companyName || !password) {
      req.flash("error", "All required fields must be filled");
      return res.redirect("/register/enterprise-admin");
    }

    // Validate password strength
    if (password.length < 6) {
      req.flash("error", "Password must be at least 6 characters long");
      return res.redirect("/register/enterprise-admin");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "A user with this email already exists");
      return res.redirect("/register/enterprise-admin");
    }

    // Generate unique company PIN
    const companyPin = generateCompanyPin();
    const pinExpiry = new Date();
    pinExpiry.setDate(pinExpiry.getDate() + 7); // PIN expires in 7 days

    // Create User as enterprise admin with company info and PIN
    const user = await new Promise((resolve, reject) => {
      User.register(
        new User({
          email,
          name,
          role: "enterprise_admin",
          companyName: companyName || null,
          companySize: companySize || null,
          companyRegistrationNumber: companyRegistrationNumber || null,
          companyAddress: companyAddress || null,
          companyPhone: companyPhone || null,
          companyPin: companyPin,
          companyPinExpiresAt: pinExpiry,
          maxPinUses: maxPinUses || 10,
          hadLoggedIn: false,
          isActive: true,
        }),
        password,
        (err, user) => {
          if (err) reject(err);
          resolve(user);
        },
      );
    });

    req.flash(
      "success",
      `Company "${companyName}" created successfully! Your Company PIN: ${companyPin}. Share this PIN with safety officers and workers to join your company. This PIN expires on ${pinExpiry.toLocaleDateString()}.`,
    );
    return res.redirect("/api/users/login");
  } catch (error) {
    console.error("Enterprise admin registration error:", error);

    if (error.code === 11000) {
      req.flash("error", "Email already registered");
    } else {
      req.flash("error", `Registration failed: ${error.message}`);
    }
    return res.redirect("/register/enterprise-admin");
  }
};

// Helper function to generate company PIN
// function generateCompanyPin() {
//   // Generate a 6-character alphanumeric PIN (e.g., "A3B9C2")
//   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
//   let pin = "";
//   for (let i = 0; i < 6; i++) {
//     pin += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return pin;
// }

// Helper function to generate company PIN
function generateCompanyPin() {
  // Generate a 6-character alphanumeric PIN (e.g., "A3B9C2")
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

// Regenerate company PIN
// exports.regenerateCompanyPin = async (req, res) => {
//   try {
//     const User = require("../models/User");

//     // Find the admin user (assuming req.user is the admin)
//     const admin = await User.findById(req.user._id);

//     if (!admin || admin.role !== "system_admin") {
//       req.flash("error", "Unauthorized access");
//       return res.redirect("/admin/dashboard");
//     }

//     // Generate new PIN
//     const newPin = generateCompanyPin();

//     // Set expiration date (7 days from now)
//     const expiresAt = new Date();
//     expiresAt.setDate(expiresAt.getDate() + 7);

//     // Update admin with new PIN
//     admin.companyPin = newPin;
//     admin.companyPinExpiresAt = expiresAt;
//     admin.companyPinUsedBy = []; // Reset used by array
//     admin.maxPinUses = 10; // Allow up to 10 uses per PIN

//     await admin.save();

//     req.flash(
//       "success",
//       `New company PIN generated: ${newPin}. It will expire on ${expiresAt.toLocaleDateString()}`,
//     );
//     res.redirect("/admin/dashboard");
//   } catch (error) {
//     console.error("Error regenerating PIN:", error);
//     req.flash("error", "Error regenerating company PIN");
//     res.redirect("/admin/dashboard");
//   }
// };

// Regenerate company PIN
// Regenerate company PIN
exports.regenerateCompanyPin = async (req, res) => {
  try {
    const User = require("../models/User");

    // Find the admin user
    const admin = await User.findById(req.user._id);

    if (
      !admin ||
      (admin.role !== "enterprise_admin" && admin.role !== "system_admin")
    ) {
      req.flash("error", "Unauthorized access");
      return res.redirect("/dashboard");
    }

    // Generate new PIN
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    let newPin = "";
    for (let i = 0; i < 6; i++) {
      newPin += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update admin with new PIN
    admin.companyPin = newPin;
    admin.companyPinExpiresAt = expiresAt;
    admin.companyPinUsedBy = [];
    admin.maxPinUses = 10;

    await admin.save();

    req.flash(
      "success",
      `New company PIN generated: ${newPin}. It will expire on ${expiresAt.toLocaleDateString()}`,
    );

    // ✅ FIXED: Redirect to the correct admin dashboard URL
    return res.redirect("/dashboard/admin");
  } catch (error) {
    console.error("Error regenerating PIN:", error);
    req.flash("error", "Error regenerating company PIN: " + error.message);
    return res.redirect("/dashboard/admin");
  }
};
// backend/controllers/registrationController.js

// Show safety officer join form
// exports.showSafetyOfficerJoinForm = (req, res) => {
//   res.render("registration/safety-officer-join", {
//     title: "Join as Safety Officer",
//     messages: req.flash(),
//   });
// };

// // Process safety officer joining with PIN
// exports.joinSafetyOfficer = async (req, res) => {
//   try {
//     const { companyPin, name, email, phone, password, confirmPassword } =
//       req.body;

//     // Validate required fields
//     if (!companyPin || !name || !email || !password) {
//       req.flash("error", "All required fields must be filled");
//       return res.redirect("/register/safety-officer/join");
//     }

//     // Validate password match
//     if (password !== confirmPassword) {
//       req.flash("error", "Passwords do not match");
//       return res.redirect("/register/safety-officer/join");
//     }

//     // Validate password strength
//     if (password.length < 6) {
//       req.flash("error", "Password must be at least 6 characters long");
//       return res.redirect("/register/safety-officer/join");
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       req.flash("error", "A user with this email already exists");
//       return res.redirect("/register/safety-officer/join");
//     }

//     // Find company by PIN
//     const company = await User.findOne({
//       companyPin: companyPin.toUpperCase(),
//       role: "system_admin",
//       companyPinExpiresAt: { $gt: new Date() },
//       isActive: true,
//     });

//     if (!company) {
//       req.flash(
//         "error",
//         "Invalid or expired company PIN. Please check with your administrator.",
//       );
//       return res.redirect("/register/safety-officer/join");
//     }

//     // Check if PIN has reached usage limit
//     if (
//       company.companyPinUsedBy &&
//       company.companyPinUsedBy.length >= company.maxPinUses
//     ) {
//       req.flash(
//         "error",
//         "This company PIN has already been used the maximum number of times.",
//       );
//       return res.redirect("/register/safety-officer/join");
//     }

//     // Generate officer number
//     const officerCount = await SafetyOfficer.countDocuments();
//     const officerNumber = `SO${String(officerCount + 1).padStart(5, "0")}`;

//     // Create Safety Officer profile
//     const newSafetyOfficer = new SafetyOfficer({
//       name,
//       email,
//       phone: phone || "",
//       officerNumber,
//       verificationStatus: "verified",
//       verifiedBy: company._id,
//       verifiedAt: new Date(),
//       createdBy: company._id,
//       companyId: company._id,
//       isActive: true,
//     });

//     await newSafetyOfficer.save();

//     // Create User account
//     const user = await new Promise((resolve, reject) => {
//       User.register(
//         new User({
//           email,
//           name,
//           role: "safety_officer",
//           companyId: company._id,
//           createdBy: company._id,
//           isActive: true,
//           isVerified: true,
//           verifiedBy: company._id,
//           verifiedAt: new Date(),
//           hadLoggedIn: false,
//         }),
//         password,
//         (err, user) => {
//           if (err) reject(err);
//           resolve(user);
//         },
//       );
//     });

//     // Link user and safety officer
//     newSafetyOfficer.user = user._id;
//     await newSafetyOfficer.save();

//     user.safetyOfficer = newSafetyOfficer._id;
//     await user.save();

//     // Record PIN usage
//     company.companyPinUsedBy.push({
//       userId: user._id,
//       usedAt: new Date(),
//     });
//     await company.save();

//     req.flash(
//       "success",
//       `Welcome to ${company.companyName}! Your safety officer account has been created. You can now login with your email and password.`,
//     );
//     return res.redirect("/api/users/login");
//   } catch (error) {
//     console.error("Safety officer registration error:", error);
//     req.flash("error", `Registration failed: ${error.message}`);
//     return res.redirect("/register/safety-officer/join");
//   }
// };

// backend/controllers/registrationController.js

// Show safety officer join form with company search
// Show safety officer join form with company search
exports.showSafetyOfficerJoinForm = async (req, res) => {
  try {
    // Fetch all companies that have a company name and PIN
    const companies = await User.find({
      companyName: { $ne: null },
      isActive: true,
      companyPin: { $ne: null },
    }).select("companyName companySize companyPin _id");

    // Convert to plain objects for the template
    const companiesList = companies.map((company) => ({
      _id: company._id,
      companyName: company.companyName,
      companySize: company.companySize || "N/A",
      companyPin: company.companyPin,
    }));

    res.render("registration/safety-officer-join", {
      title: "Join as Safety Officer",
      messages: req.flash(),
      companies: companiesList || [], // Pass all companies to the template
    });
  } catch (error) {
    console.error("Error loading safety officer join form:", error);
    res.render("registration/safety-officer-join", {
      title: "Join as Safety Officer",
      messages: req.flash(),
      companies: [],
    });
  }
};

// API endpoint for searching companies (optional - if you want live search)
exports.searchCompanies = async (req, res) => {
  try {
    const { q } = req.query;

    let query = {
      companyName: { $ne: null },
      isActive: true,
      companyPin: { $ne: null },
    };

    if (q && q.length >= 2) {
      query.companyName = { $regex: q, $options: "i" };
    }

    const companies = await User.find(query)
      .select("companyName companySize companyPin")
      .limit(10);

    res.json(companies);
  } catch (error) {
    console.error("Error searching companies:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Process safety officer joining with company selection AND PIN
exports.joinSafetyOfficer = async (req, res) => {
  try {
    const {
      companyId,
      companyPin,
      name,
      email,
      phone,
      bio,
      password,
      confirmPassword,
    } = req.body;

    // Validate required fields
    if (!companyId || !companyPin || !name || !email || !password) {
      req.flash("error", "All required fields must be filled");
      return res.redirect("/register/safety-officer/join");
    }

    // Validate password match
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/register/safety-officer/join");
    }

    // Validate password strength
    if (password.length < 6) {
      req.flash("error", "Password must be at least 6 characters long");
      return res.redirect("/register/safety-officer/join");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "A user with this email already exists");
      return res.redirect("/register/safety-officer/join");
    }

    // Find company by ID AND validate PIN
    const company = await User.findOne({
      _id: companyId,
      companyPin: companyPin.toUpperCase(),
      companyPinExpiresAt: { $gt: new Date() },
      isActive: true,
      companyName: { $ne: null },
    });

    if (!company) {
      req.flash(
        "error",
        "Invalid company or PIN. Please check your company selection and PIN.",
      );
      return res.redirect("/register/safety-officer/join");
    }

    // Check if PIN has reached usage limit
    if (
      company.companyPinUsedBy &&
      company.companyPinUsedBy.length >= company.maxPinUses
    ) {
      req.flash(
        "error",
        "This company PIN has already been used the maximum number of times.",
      );
      return res.redirect("/register/safety-officer/join");
    }

    // Generate officer number
    const officerCount = await SafetyOfficer.countDocuments();
    const officerNumber = `SO${String(officerCount + 1).padStart(5, "0")}`;

    // Create Safety Officer profile
    const newSafetyOfficer = new SafetyOfficer({
      name,
      email,
      phone: phone || "",
      bio: bio || "",
      officerNumber,
      verificationStatus: "verified",
      verifiedBy: company._id,
      verifiedAt: new Date(),
      createdBy: company._id,
      companyId: company._id,
      isActive: true,
    });

    await newSafetyOfficer.save();

    // Create User account
    const user = await new Promise((resolve, reject) => {
      User.register(
        new User({
          email,
          name,
          role: "safety_officer",
          companyId: company._id,
          createdBy: company._id,
          isActive: true,
          isVerified: true,
          verifiedBy: company._id,
          verifiedAt: new Date(),
          hadLoggedIn: false,
        }),
        password,
        (err, user) => {
          if (err) reject(err);
          resolve(user);
        },
      );
    });

    // Link user and safety officer
    newSafetyOfficer.user = user._id;
    await newSafetyOfficer.save();

    user.safetyOfficer = newSafetyOfficer._id;
    await user.save();

    // Record PIN usage
    company.companyPinUsedBy.push({
      userId: user._id,
      usedAt: new Date(),
    });
    await company.save();

    req.flash(
      "success",
      `Welcome to ${company.companyName}! Your safety officer account has been created. You can now login with your email and password.`,
    );
    return res.redirect("/api/users/login");
  } catch (error) {
    console.error("Safety officer registration error:", error);
    req.flash("error", `Registration failed: ${error.message}`);
    return res.redirect("/register/safety-officer/join");
  }
};

// Show worker join form with company search
exports.showWorkerJoinForm = async (req, res) => {
  try {
    // Fetch all companies that have a company name and PIN
    const companies = await User.find({
      companyName: { $ne: null },
      isActive: true,
      companyPin: { $ne: null },
    }).select("companyName companySize companyPin _id");

    // Convert to plain objects for the template
    const companiesList = companies.map((company) => ({
      _id: company._id,
      companyName: company.companyName,
      companySize: company.companySize || "N/A",
      companyPin: company.companyPin,
    }));

    res.render("registration/worker-join", {
      title: "Join as Worker",
      messages: req.flash(),
      companies: companiesList || [],
    });
  } catch (error) {
    console.error("Error loading worker join form:", error);
    res.render("registration/worker-join", {
      title: "Join as Worker",
      messages: req.flash(),
      companies: [],
    });
  }
};

// Process worker joining with company selection AND PIN
exports.joinWorker = async (req, res) => {
  try {
    const {
      companyId,
      companyPin,
      name,
      email,
      phone,
      password,
      confirmPassword,
    } = req.body;

    // Validate required fields
    if (!companyId || !companyPin || !name || !email || !password) {
      req.flash("error", "All required fields must be filled");
      return res.redirect("/register/worker/join");
    }

    // Validate password match
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/register/worker/join");
    }

    // Validate password strength
    if (password.length < 6) {
      req.flash("error", "Password must be at least 6 characters long");
      return res.redirect("/register/worker/join");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "A user with this email already exists");
      return res.redirect("/register/worker/join");
    }

    // Find company by ID AND validate PIN
    const company = await User.findOne({
      _id: companyId,
      companyPin: companyPin.toUpperCase(),
      companyPinExpiresAt: { $gt: new Date() },
      isActive: true,
      companyName: { $ne: null },
    });

    if (!company) {
      req.flash(
        "error",
        "Invalid company or PIN. Please check your company selection and PIN.",
      );
      return res.redirect("/register/worker/join");
    }

    // Check if PIN has reached usage limit
    if (
      company.companyPinUsedBy &&
      company.companyPinUsedBy.length >= company.maxPinUses
    ) {
      req.flash(
        "error",
        "This company PIN has already been used the maximum number of times.",
      );
      return res.redirect("/register/worker/join");
    }

    // Generate worker number
    const workerNumber = `WRK${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`;

    // Create User account for worker
    const user = await new Promise((resolve, reject) => {
      User.register(
        new User({
          email,
          name,
          phone: phone || "",
          role: "worker",
          companyId: company._id,
          createdBy: company._id,
          isActive: true,
          isVerified: true,
          verifiedBy: company._id,
          verifiedAt: new Date(),
          hadLoggedIn: false,
          workerNumber: workerNumber,
        }),
        password,
        (err, user) => {
          if (err) reject(err);
          resolve(user);
        },
      );
    });

    // Record PIN usage
    company.companyPinUsedBy.push({
      userId: user._id,
      usedAt: new Date(),
    });
    await company.save();

    req.flash(
      "success",
      `Welcome to ${company.companyName}! Your worker account has been created. Worker Number: ${workerNumber}. You can now login with your email and password.`,
    );
    return res.redirect("/api/users/login");
  } catch (error) {
    console.error("Worker registration error:", error);
    req.flash("error", `Registration failed: ${error.message}`);
    return res.redirect("/register/worker/join");
  }
};
