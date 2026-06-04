const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");

const User = require("./models/User");
const Alert = require("./models/Alert");

dotenv.config();
mongoose.set("strictPopulate", false);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const blockedProbePaths = new Set([
  "/.vscode/sftp.json",
  "/@vite/env",
  "/actuator/env",
  "/debug/default/view",
  "/info.php",
  "/telescope/requests",
  "/trace.axd",
]);

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  if (req.get("x-forwarded-proto") && req.protocol !== "https") {
    return res.redirect(301, `https://${req.get("host")}${req.originalUrl}`);
  }

  const canonicalHost = "www.safety365.work";
  if (req.hostname === "safety365.work") {
    return res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
  }

  return next();
});

app.use((req, res, next) => {
  if (blockedProbePaths.has(req.path) || req.query.rest_route) {
    return res.status(404).type("text/plain").send("Not found");
  }

  return next();
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required.");
}

app.use(
  session({
    name: "truesafe365.sid",
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2,
    },
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
});
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: "email" }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../frontend/public")));
const { ensureCsrfToken, verifyCsrfToken } = require("./middlewares/csrf");
const { rejectUnsafeKeys } = require("./middlewares/security");
app.use(ensureCsrfToken);
app.use(verifyCsrfToken);
app.use(rejectUnsafeKeys);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

app.use(async (req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = req.user;

  try {
    res.locals.hasUrgentAlerts = false;

    if (req.user) {
      const query = {
        severity: { $in: ["high", "critical"] },
        status: { $ne: "resolved" },
        $or: [
          { officerId: req.user._id },
          { createdBy: req.user._id },
          { "recipients.user": req.user._id },
          { "recipients.email": req.user.email },
        ],
      };

      res.locals.hasUrgentAlerts = Boolean(await Alert.exists(query));
    }
  } catch (error) {
    console.error("Unable to load alert indicator:", error.message);
    res.locals.hasUrgentAlerts = false;
  }

  next();
});

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.use("/dashboard", require("./routes/dashboardRoutes"));
app.use("/register", authLimiter, require("./routes/registrationRoutes"));
app.use("/api/users", authLimiter, require("./routes/usersRoutes"));
app.use("/work-areas", require("./routes/workAreaRoutes"));
app.use("/incidents", require("./routes/incidentRoutes"));
app.use("/risk-assessments", require("./routes/riskAssessmentRoutes"));
app.use("/safety-talks", require("./routes/safetyTalkRoutes"));
app.use("/safety-observations", require("./routes/safetyObservationRoutes"));
app.use("/safety-insights", require("./routes/safetyInsightRoutes"));
app.use("/safety-audits", require("./routes/safetyAuditScorecardRoutes"));
app.use("/ohs-compliance-audits", require("./routes/ohsComplianceAuditRoutes"));
app.use("/permits", require("./routes/permitRoutes"));
app.use("/ppe", require("./routes/ppeRoutes"));
app.use("/jsa", require("./routes/jsaRoutes"));
app.use("/training", require("./routes/trainingRoutes"));
app.use("/emergency-protocols", require("./routes/emergencyProtocolRoutes"));
app.use("/environmental-assessments", require("./routes/environmentalAssessmentRoutes"));
app.use("/alerts", require("./routes/alertRoutes"));

require("./utils/safetyAutomation");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
