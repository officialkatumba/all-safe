const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");

const User = require("./models/User");
const Alert = require("./models/Alert");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
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

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: "email" }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../frontend/public")));

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
      };

      if (
        req.user.role !== "system_owner" &&
        req.user.role !== "enterprise_admin" &&
        req.user.role !== "system_admin"
      ) {
        query.$or = [
          { "recipients.user": req.user._id },
          { "recipients.email": req.user.email },
        ];
      }

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
app.use("/register", require("./routes/registrationRoutes"));
app.use("/safety-officers", require("./routes/safetyOfficerRoutes"));
app.use("/api/users", require("./routes/usersRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/system-owner", require("./routes/systemOwnerRoutes"));
app.use("/worksites", require("./routes/worksiteRoutes"));
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
app.use("/functions", require("./routes/functionRoutes"));
app.use("/ai", require("./routes/aiDocumentRoutes"));

require("./utils/safetyAutomation");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
