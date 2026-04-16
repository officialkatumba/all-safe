// // -------------------- IMPORTS --------------------
// const express = require("express");
// const mongoose = require("mongoose");
// const MongoStore = require("connect-mongo");
// const dotenv = require("dotenv");
// const path = require("path");
// const bodyParser = require("body-parser");
// const session = require("express-session");
// const passport = require("passport");
// const LocalStrategy = require("passport-local").Strategy;
// const flash = require("connect-flash");
// const cron = require("node-cron");

// const User = require("./models/User");
// const Election = require("./models/Election");
// const connectDB = require("./config/db");
// require("./utils/autoLauncher");

// // -------------------- CONFIG --------------------
// dotenv.config();
// connectDB();

// const app = express();

// // -------------------- SESSION (MongoDB Atlas) --------------------
// app.set("trust proxy", 1); // Required when behind proxy (e.g. Heroku, Render)
// app.use((req, res, next) => {
//   const host = req.headers.host;
//   if (host === "truevote.space") {
//     return res.redirect(301, "https://www.truevote.space" + req.originalUrl);
//   }
//   next();
// });

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     name: process.env.SESSION_COOKIE_NAME || "sid",
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGO_URI, // Your MongoDB Atlas URI
//       collectionName: "sessions", // Optional custom collection name
//       ttl: 60 * 60 * 2, // 2 hours (same as cookie maxAge)
//       autoRemove: "native", // Clean expired sessions automatically
//     }),
//     cookie: {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // HTTPS only in production
//       sameSite: "strict",
//       maxAge: 1000 * 60 * 60 * 2, // 2 hours
//     },
//   })
// );

// // -------------------- FLASH & PASSPORT --------------------
// app.use(flash());
// app.use(passport.initialize());
// app.use(passport.session());

// // Passport config
// passport.use(
//   new LocalStrategy({ usernameField: "email" }, User.authenticate())
// );
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// // -------------------- MIDDLEWARE --------------------
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// // -------------------- STATIC & VIEWS --------------------
// app.use(express.static(path.join(__dirname, "../frontend/public")));
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "../frontend/views"));

// // -------------------- LOCALS --------------------
// app.use((req, res, next) => {
//   res.locals.success_msg = req.flash("success_msg");
//   res.locals.error_msg = req.flash("error_msg");
//   res.locals.error = req.flash("error");
//   res.locals.user = req.user;
//   next();
// });

// // -------------------- ROUTES --------------------
// app.get("/", (req, res) => {
//   res.render("index", { user: req.user });
// });

// app.use("/api/users", require("./routes/users"));
// app.use("/api/elections", require("./routes/elections"));
// app.use("/api/candidates", require("./routes/candidates"));
// app.use("/api/votes", require("./routes/votes"));
// app.use("/api/insights", require("./routes/insights"));

// app.use("/", require("./routes/dashboard"));
// app.use("/candidates", require("./routes/candidates"));
// app.use("/users", require("./routes/users"));

// app.get("/vote/voting-closed", (req, res) => {
//   res.render("vote/voting-closed");
// });

// // -------------------- CRON JOBS --------------------

// // Auto-complete elections
// cron.schedule("* * * * *", async () => {
//   try {
//     const now = new Date();
//     const result = await Election.updateMany(
//       { electionStatus: "ongoing", endDate: { $lt: now } },
//       { $set: { electionStatus: "completed" } }
//     );
//     if (result.modifiedCount > 0) {
//       console.log(
//         `🕒 Auto-ended ${
//           result.modifiedCount
//         } election(s) at ${now.toISOString()}`
//       );
//     }
//   } catch (err) {
//     console.error("❌ Cron job error:", err.message);
//   }
// });

// // Auto-update membership status
// cron.schedule("0 * * * *", async () => {
//   try {
//     const now = new Date();
//     const result = await User.updateMany(
//       { membershipStatus: "active", membershipExpiryDate: { $lt: now } },
//       { $set: { membershipStatus: "pending" } }
//     );
//     if (result.modifiedCount > 0) {
//       console.log(
//         `⏳ Updated membership for ${
//           result.modifiedCount
//         } user(s) at ${now.toISOString()}`
//       );
//     }
//   } catch (err) {
//     console.error("❌ Membership cron error:", err.message);
//   }
// });

// // -------------------- SERVER --------------------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// // -------------------- IMPORTS --------------------
// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const path = require("path");
// const session = require("express-session");
// const passport = require("passport");
// const LocalStrategy = require("passport-local").Strategy;
// const flash = require("connect-flash");

// const User = require("./models/User");

// // -------------------- CONFIG --------------------
// dotenv.config();

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ MongoDB connection error:", err));

// const app = express();

// // -------------------- SESSION --------------------
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "secret",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       maxAge: 1000 * 60 * 60 * 2, // 2 hours
//     },
//   }),
// );

// // -------------------- FLASH & PASSPORT --------------------
// app.use(flash());
// app.use(passport.initialize());
// app.use(passport.session());

// // Passport config
// passport.use(
//   new LocalStrategy({ usernameField: "email" }, User.authenticate()),
// );
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// // -------------------- MIDDLEWARE --------------------
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // -------------------- VIEWS --------------------
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "../frontend/views"));

// // -------------------- LOCALS --------------------
// app.use((req, res, next) => {
//   res.locals.success = req.flash("success");
//   res.locals.error = req.flash("error");
//   res.locals.user = req.user;
//   next();
// });

// // -------------------- ROUTES --------------------
// app.get("/", (req, res) => {
//   res.render("index", { user: req.user });
// });

// // Safety Officer routes
// app.use("/safety-officers", require("./routes/safetyOfficerRoutes"));

// // User routes (API style)
// app.use("/api/users", require("./routes/usersRoutes"));

// // -------------------- SERVER --------------------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// // -------------------- IMPORTS --------------------
// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const path = require("path");
// const session = require("express-session");
// const passport = require("passport");
// const LocalStrategy = require("passport-local").Strategy;
// const flash = require("connect-flash");

// const User = require("./models/User");

// // -------------------- CONFIG --------------------
// dotenv.config();

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ MongoDB connection error:", err));

// const app = express();

// // -------------------- SESSION --------------------
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "secret",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       maxAge: 1000 * 60 * 60 * 2, // 2 hours
//     },
//   }),
// );

// // -------------------- FLASH & PASSPORT --------------------
// app.use(flash());
// app.use(passport.initialize());
// app.use(passport.session());

// // Passport config
// passport.use(
//   new LocalStrategy({ usernameField: "email" }, User.authenticate()),
// );
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// // -------------------- MIDDLEWARE --------------------
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // -------------------- VIEWS --------------------
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "../frontend/views"));

// // -------------------- LOCALS --------------------
// app.use((req, res, next) => {
//   res.locals.success = req.flash("success");
//   res.locals.error = req.flash("error");
//   res.locals.user = req.user;
//   next();
// });

// // -------------------- ROUTES --------------------
// app.get("/", (req, res) => {
//   res.render("index", { user: req.user });
// });

// // 🆕 Registration routes (solo & enterprise)
// app.use("/register", require("./routes/registrationRoutes"));

// // Safety Officer routes (existing)
// app.use("/safety-officers", require("./routes/safetyOfficerRoutes"));

// // User routes (API style)
// app.use("/api/users", require("./routes/usersRoutes"));

// // 🆕 Admin routes (enterprise features)
// app.use("/admin", require("./routes/adminRoutes"));

// // 🆕 Worksite routes
// app.use("/worksites", require("./routes/worksiteRoutes"));

// // 🆕 Work Area routes
// app.use("/work-areas", require("./routes/workAreaRoutes"));

// // 🆕 Incident routes
// app.use("/incidents", require("./routes/incidentRoutes"));

// // 🆕 Risk Assessment routes
// app.use("/risk-assessments", require("./routes/riskAssessmentRoutes"));

// // 🆕 Safety Talk routes
// app.use("/safety-talks", require("./routes/safetyTalkRoutes"));

// // 🆕 Permit routes
// app.use("/permits", require("./routes/permitRoutes"));

// // 🆕 PPE Checklist routes
// app.use("/ppe", require("./routes/ppeRoutes"));

// // -------------------- SERVER --------------------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");

const User = require("./models/User");

// -------------------- CONFIG --------------------
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const app = express();

// -------------------- SESSION --------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  }),
);

// -------------------- FLASH & PASSPORT --------------------
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Passport config
passport.use(
  new LocalStrategy({ usernameField: "email" }, User.authenticate()),
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- VIEWS --------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

// -------------------- LOCALS --------------------
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = req.user;
  next();
});

// -------------------- ROUTES --------------------
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

// ✅ DASHBOARD ROUTES - Add this line
app.use("/dashboard", require("./routes/dashboardRoutes"));

// 🆕 Registration routes (solo & enterprise)
app.use("/register", require("./routes/registrationRoutes"));

// Safety Officer routes (existing)
app.use("/safety-officers", require("./routes/safetyOfficerRoutes"));

// User routes (API style)
app.use("/api/users", require("./routes/usersRoutes"));

// 🆕 Admin routes (enterprise features)
app.use("/admin", require("./routes/adminRoutes"));

// 🆕 Worksite routes
app.use("/worksites", require("./routes/worksiteRoutes"));

// 🆕 Work Area routes
app.use("/work-areas", require("./routes/workAreaRoutes"));

// 🆕 Incident routes
app.use("/incidents", require("./routes/incidentRoutes"));

// 🆕 Risk Assessment routes
app.use("/risk-assessments", require("./routes/riskAssessmentRoutes"));

// 🆕 Safety Talk routes
app.use("/safety-talks", require("./routes/safetyTalkRoutes"));

// 🆕 Permit routes
app.use("/permits", require("./routes/permitRoutes"));

// 🆕 PPE Checklist routes
app.use("/ppe", require("./routes/ppeRoutes"));

// Function pages routes (nested under safety-officer in views)
app.use("/functions", require("./routes/functionRoutes"));

// // Add to server.js
// const aiDocumentRoutes = require("../backend/routes/aiDocumentRoutes");
// app.use("/api/ai", aiDocumentRoutes);

// Add to server.js
const aiDocumentRoutes = require("../backend/routes/aiDocumentRoutes");
app.use("/ai", aiDocumentRoutes);

// Add this line with your other route imports
const incidentRoutes = require("./routes/incidentRoutes");

// Add this line with your other route registrations
app.use("/incidents", incidentRoutes);

// Safety talk routes
const safetyTalkRoutes = require("./routes/safetyTalkRoutes");
app.use("/safety-talks", safetyTalkRoutes);

const safetyObservationRoutes = require("./routes/safetyObservationRoutes");
app.use("/safety-observations", safetyObservationRoutes);

const ppeRoutes = require("./routes/ppeRoutes");
app.use("/ppe", ppeRoutes);

const jsaRoutes = require("./routes/jsaRoutes");
app.use("/jsa", jsaRoutes);

// Permit routes
const permitRoutes = require("./routes/permitRoutes");
app.use("/permits", permitRoutes);

// Training routes
const trainingRoutes = require("./routes/trainingRoutes");
app.use("/training", trainingRoutes);
// -------------------- SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
