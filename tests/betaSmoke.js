const { spawn } = require("child_process");
const assert = require("assert");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../backend/models/User");
const WorkArea = require("../backend/models/WorkArea");
const SafetyTalk = require("../backend/models/SafetyTalk");
const PPEChecklist = require("../backend/models/PPEChecklist");
const TrainingRequirement = require("../backend/models/TrainingRequirement");
const EnvironmentalAssessment = require("../backend/models/EnvironmentalAssessment");
const EmergencyProtocol = require("../backend/models/EmergencyProtocol");
const SafetyInsight = require("../backend/models/SafetyInsight");
const SafetyAuditScorecard = require("../backend/models/SafetyAuditScorecard");
const OHSComplianceAudit = require("../backend/models/OHSComplianceAudit");
const Permit = require("../backend/models/Permit");
const JSA = require("../backend/models/JSA");

const port = process.env.BETA_TEST_PORT || "8041";
const baseUrl = `http://127.0.0.1:${port}`;
const ownerEmail = process.env.BETA_OWNER_EMAIL || "officialkatumba@yahoo.com";
const otherEmail = process.env.BETA_OTHER_EMAIL || "officialkatumb@yahoo.com";
const password = process.env.BETA_TEST_PASSWORD;

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`PASS ${message}`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Client {
  constructor() {
    this.cookies = new Map();
  }

  async request(route, options = {}) {
    const headers = new Headers(options.headers || {});
    if (this.cookies.size) {
      headers.set(
        "cookie",
        [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; "),
      );
    }

    const response = await fetch(`${baseUrl}${route}`, {
      ...options,
      headers,
      redirect: options.redirect || "manual",
    });

    const setCookies =
      response.headers.getSetCookie?.() ||
      [response.headers.get("set-cookie")].filter(Boolean);
    setCookies.forEach((cookie) => {
      const [pair] = cookie.split(";");
      const separator = pair.indexOf("=");
      this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    });

    return response;
  }

  async csrf(route = "/api/users/login") {
    const response = await this.request(route);
    check(response.status === 200, `${route} renders`);
    const html = await response.text();
    const match = html.match(/window\.allSafeCsrfToken = "([^"]+)"/);
    check(Boolean(match?.[1]), `${route} exposes a CSRF token`);
    return match[1];
  }

  async login(email, loginPassword) {
    const csrf = await this.csrf();
    const body = new URLSearchParams({ _csrf: csrf, email, password: loginPassword });
    const response = await this.request("/api/users/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    check(response.status === 302, `${email} login redirects after authentication`);
    return csrf;
  }
}

async function discoverFixtures() {
  await mongoose.connect(process.env.MONGO_URI);

  const owner = await User.findOne({ email: ownerEmail });
  const other = await User.findOne({ email: otherEmail });
  check(Boolean(owner), "owner beta account exists");
  check(Boolean(other), "second beta account exists");

  const workArea = await WorkArea.findOne({ officerId: owner._id });
  check(Boolean(workArea), "owner work area exists");

  const generatedDocuments = [
    {
      label: "safety talk",
      document: await SafetyTalk.findOne({ targetWorkAreas: workArea._id }),
      route: "/safety-talks",
    },
    {
      label: "PPE checklist",
      document: await PPEChecklist.findOne({ workArea: workArea._id }),
      route: "/ppe",
    },
    {
      label: "training requirement",
      document: await TrainingRequirement.findOne({ workArea: workArea._id }),
      route: "/training",
    },
    {
      label: "environmental assessment",
      document: await EnvironmentalAssessment.findOne({ workArea: workArea._id }),
      route: "/environmental-assessments",
    },
    {
      label: "emergency protocol",
      document: await EmergencyProtocol.findOne({ workArea: workArea._id }),
      route: "/emergency-protocols",
    },
    {
      label: "safety insight",
      document: await SafetyInsight.findOne({ workArea: workArea._id }),
      route: "/safety-insights",
    },
    {
      label: "safety audit",
      document: await SafetyAuditScorecard.findOne({ workArea: workArea._id }),
      route: "/safety-audits",
    },
    {
      label: "OHS compliance audit",
      document: await OHSComplianceAudit.findOne({ workArea: workArea._id }),
      route: "/ohs-compliance-audits",
    },
    {
      label: "permit",
      document: await Permit.findOne({ workArea: workArea._id }),
      route: "/permits",
    },
    {
      label: "JSA",
      document: await JSA.findOne({ workArea: workArea._id }),
      route: "/jsa",
    },
  ];
  const approvedEnvironment = await EnvironmentalAssessment.findOne({
    workArea: workArea._id,
    "approval.status": "approved",
  });
  const draftEmergency = await EmergencyProtocol.findOne({
    workArea: workArea._id,
    "officerReview.status": { $ne: "approved" },
  });

  generatedDocuments.forEach(({ label, document }) => {
    check(Boolean(document), `owner ${label} fixture exists`);
  });
  check(Boolean(approvedEnvironment), "approved environmental fixture exists");
  check(Boolean(draftEmergency), "pending emergency fixture exists");

  await mongoose.disconnect();
  return { workArea, generatedDocuments, approvedEnvironment, draftEmergency };
}

async function waitForServer(child) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited before smoke tests started with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(`${baseUrl}/`, { redirect: "manual" });
      if (response.status === 200) return;
    } catch {
      await wait(500);
    }
  }

  throw new Error("Timed out waiting for beta smoke server");
}

async function run() {
  if (!password) {
    throw new Error("Set BETA_TEST_PASSWORD before running the beta smoke test");
  }

  const fixtures = await discoverFixtures();
  const child = spawn(process.execPath, ["backend/server.js"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: port },
    stdio: "inherit",
    windowsHide: true,
  });

  try {
    await waitForServer(child);
    const anonymous = new Client();
    const owner = new Client();
    const other = new Client();

    const home = await anonymous.request("/");
    check(home.status === 200, "home page responds");
    check(home.headers.get("x-content-type-options") === "nosniff", "Helmet headers are enabled");
    check(!home.headers.has("x-powered-by"), "Express signature is hidden");

    const anonymousDashboard = await anonymous.request("/dashboard/officer");
    check(anonymousDashboard.status === 302, "anonymous dashboard access redirects");

    const missingCsrf = await anonymous.request("/api/users/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email: ownerEmail, password }),
    });
    check(missingCsrf.status === 403, "login without CSRF token is rejected");

    const unsafeCsrf = await anonymous.csrf();
    const unsafeBody = new URLSearchParams({
      _csrf: unsafeCsrf,
      "email[$ne]": "x",
      password,
    });
    const unsafeLogin = await anonymous.request("/api/users/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: unsafeBody,
    });
    check(unsafeLogin.status === 400, "unsafe request keys are rejected");

    await owner.login(ownerEmail, password);
    await other.login(otherEmail, password);

    for (const { label, document, route } of fixtures.generatedDocuments) {
      const ownerDocument = await owner.request(`${route}/${document._id}`);
      check(ownerDocument.status === 200, `owner can view own ${label}`);

      const crossDocument = await other.request(`${route}/${document._id}`);
      check(crossDocument.status === 302, `second account cannot view owner ${label}`);
    }

    const crossWorkArea = await other.request(`/work-areas/${fixtures.workArea._id}`);
    check(crossWorkArea.status === 302, "second account cannot view owner work area");

    const crossGenerate = await other.request(
      `/environmental-assessments/generate/${fixtures.workArea._id}`,
    );
    check(crossGenerate.status === 302, "second account cannot open owner generation form");

    const crossDownload = await other.request(
      `/environmental-assessments/${fixtures.approvedEnvironment._id}/download-word`,
    );
    check(crossDownload.status === 302, "second account cannot download owner document");

    const lockedDraft = await owner.request(
      `/emergency-protocols/${fixtures.draftEmergency._id}/download-word`,
    );
    check(lockedDraft.status === 302, "pending document download remains locked");

    const malformedId = await owner.request("/safety-talks/not-an-object-id");
    check(malformedId.status === 302, "malformed document IDs fail closed");

    const crossIncidentForm = await other.request(`/incidents/report/${fixtures.workArea._id}`);
    check(crossIncidentForm.status === 302, "second account cannot open owner incident form");

    console.log("Beta smoke test passed");
  } finally {
    child.kill();
    await wait(500);
  }
}

run().catch(async (error) => {
  console.error(error.stack || error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exitCode = 1;
});
