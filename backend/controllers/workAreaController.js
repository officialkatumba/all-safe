const mongoose = require("mongoose");
const WorkArea = require("../models/WorkArea");
const SafetyHub = require("../models/SafetyHub");
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyTalk = require("../models/SafetyTalk");
const SafetyObservation = require("../models/SafetyObservation");
const Permit = require("../models/Permit");
const JSA = require("../models/JSA");
const PPEChecklist = require("../models/PPEChecklist");
const TrainingRequirement = require("../models/TrainingRequirement");
const SafetyInsight = require("../models/SafetyInsight");
const EmergencyProtocol = require("../models/EmergencyProtocol");
const SafetyAuditScorecard = require("../models/SafetyAuditScorecard");
const OHSComplianceAudit = require("../models/OHSComplianceAudit");
const EnvironmentalAssessment = require("../models/EnvironmentalAssessment");

const shiftTimes = {
  morning: ["06:00", "14:00"],
  afternoon: ["14:00", "22:00"],
  night: ["22:00", "06:00"],
};

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeLocation(location) {
  if (!location) return {};
  if (typeof location === "object") return location;
  return { zone: location };
}

function buildShifts(shifts) {
  return asArray(shifts).map((shift) => ({
    name: shift,
    startTime: shiftTimes[shift]?.[0],
    endTime: shiftTimes[shift]?.[1],
  }));
}

function buildWorkTypes(workTypes) {
  return asArray(workTypes).map((workType) => ({
    workType,
    startDate: new Date(),
    isActive: true,
  }));
}

function buildConcerns(initialConcerns, initialRiskLevel) {
  if (!initialConcerns) return [];
  return initialConcerns
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((concern) => ({
      concern,
      category: "site_conditions",
      severity: initialRiskLevel || "medium",
      notes: "",
    }));
}

function buildHazards(reqBody) {
  const descriptions = asArray(reqBody.hazardDescriptions);
  const riskLevels = asArray(reqBody.hazardRiskLevels);
  const controls = asArray(reqBody.hazardControls);
  const notes = asArray(reqBody.hazardNotes);

  return descriptions
    .map((description, index) => ({
      hazardId: new mongoose.Types.ObjectId(),
      hazard: description?.trim(),
      riskLevel: riskLevels[index] || "medium",
      controls: controls[index] || "",
      notes: notes[index] || "",
      identifiedDate: new Date(),
      status: "active",
    }))
    .filter((hazard) => hazard.hazard);
}

function buildPPE(ppeItems, customPPE) {
  const validItems = new Set([
    "hard_hat",
    "safety_glasses",
    "ear_plugs",
    "ear_muffs",
    "high_vis_vest",
    "steel_toe_boots",
    "gloves",
    "respirator",
    "harness",
    "face_shield",
    "welding_helmet",
    "chemical_suit",
    "knee_pads",
    "fall_arrest",
    "other",
  ]);

  const ppe = asArray(ppeItems).map((item) => {
    if (validItems.has(item)) {
      return { item, quantity: 0, condition: "good" };
    }
    return { item: "other", customItem: item, quantity: 0, condition: "good" };
  });

  if (customPPE) {
    customPPE
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((item) => {
        ppe.push({ item: "other", customItem: item, quantity: 0, condition: "good" });
      });
  }

  return ppe;
}

function toBool(value) {
  return value === true || value === "true" || value === "on" || value === "yes" || value === "1";
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function makeDefaultWorkAreaName(mainActivity) {
  const base = cleanText(mainActivity) || "Safety Work Area";
  const compact = base.replace(/\s+/g, " ").slice(0, 60);
  return `${compact} - ${new Date().toISOString().slice(0, 10)}`;
}

function makeWorkAreaCode(name, code) {
  const source = cleanText(code) || `${name}-${Date.now()}`;
  return source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function selectedValues(value) {
  return asArray(value).map(cleanText).filter(Boolean);
}

function selectedLabels(value) {
  return selectedValues(value)
    .map((item) => item.replace(/_/g, " "))
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));
}

function buildWorkerTypes(body) {
  return {
    employees: toBool(body.workerEmployees),
    contractors: toBool(body.workerContractors),
    visitors: toBool(body.workerVisitors),
    publicNearby: toBool(body.workerPublicNearby),
    other: cleanText(body.workerTypesOther),
  };
}

function buildRiskInputs(body) {
  return {
    people: cleanText(body.riskPeople),
    equipment: cleanText(body.riskEquipment),
    environment: cleanText(body.riskEnvironment),
    nearbyWorkersPublic: cleanText(body.riskNearbyWorkersPublic),
    propertyMaterials: cleanText(body.riskPropertyMaterials),
    operationsProduction: cleanText(body.riskOperationsProduction),
  };
}

function buildEmergencyPreparedness(body) {
  return {
    emergencyContactPerson: cleanText(body.emergencyContactPerson),
    nearestClinicHospital: cleanText(body.nearestClinicHospital),
    healthFacilityDistanceTime: cleanText(body.healthFacilityDistanceTime),
    ambulanceAvailable: toBool(body.ambulanceAvailable),
    firstAidBoxAvailable: toBool(body.firstAidBoxAvailable),
    trainedFirstAiders: toNumber(body.trainedFirstAiders),
    fireExtinguishersAvailable: toBool(body.fireExtinguishersAvailable),
    emergencyExitRoutes: cleanText(body.emergencyExitRoutes),
    assemblyPoint: cleanText(body.assemblyPoint),
    rescueEquipment: cleanText(body.rescueEquipment),
    communicationMethods: selectedValues(body.communicationMethods),
    evacuationPlan: toBool(body.evacuationPlan),
    spillKitAvailable: toBool(body.spillKitAvailable),
    emergencyShowerEyewashAvailable: toBool(body.emergencyShowerEyewashAvailable),
    notes: cleanText(body.emergencyPreparednessNotes),
  };
}

function buildPeopleExposure(body) {
  return {
    workersInArea: toNumber(body.workersInArea),
    peoplePassingNearby: toNumber(body.peoplePassingNearby),
    inexperiencedWorkers: toBool(body.inexperiencedWorkers),
    contractorsInvolved: toBool(body.contractorsInvolved),
    workingAlone: toBool(body.workingAlone),
    supervisionAvailable: toBool(body.supervisionAvailable),
    vulnerablePersonsExposed: toBool(body.vulnerablePersonsExposed),
    notes: cleanText(body.peopleExposureNotes),
  };
}

function buildHazardCategories(body) {
  const categories = selectedValues(body.hazardCategories);
  const outcomes = asArray(body.hazardWhatCouldHappen);
  const likelihoods = asArray(body.hazardLikelihood);
  const severities = asArray(body.hazardSeverity);
  const existingControls = asArray(body.hazardExistingControls);
  const controlsStillNeeded = asArray(body.hazardControlsStillNeeded);

  return categories.map((category, index) => ({
    category,
    whatCouldHappen: cleanText(outcomes[index]),
    likelihood: cleanText(likelihoods[index]) || "possible",
    severity: cleanText(severities[index]) || "moderate",
    existingControls: cleanText(existingControls[index]),
    controlsStillNeeded: cleanText(controlsStillNeeded[index]),
  }));
}

function buildPpeAssessment(body) {
  return {
    obtained: selectedValues(body.ppeItems),
    adequacy: cleanText(body.ppeAdequacy),
    enoughForAllWorkers: toBool(body.ppeEnoughForAllWorkers),
    condition: cleanText(body.ppeCondition),
    inspected: toBool(body.ppeInspected),
    workersKnowHowToUse: toBool(body.ppeWorkersKnowHowToUse),
    replacementAvailable: toBool(body.ppeReplacementAvailable),
    notes: cleanText(body.ppeNotes),
  };
}

function buildEquipmentAndTools(body) {
  return {
    equipmentUsed: cleanText(body.equipmentUsed),
    inspected: toBool(body.equipmentInspected),
    certifiedWhereRequired: toBool(body.equipmentCertified),
    authorizedOperators: cleanText(body.authorizedOperators),
    guardsInPlace: toBool(body.guardsInPlace),
    emergencyStopsWorking: toBool(body.emergencyStopsWorking),
    maintenanceUpToDate: toBool(body.maintenanceUpToDate),
    failureRisks: selectedValues(body.equipmentFailureRisks),
    notes: cleanText(body.equipmentNotes),
  };
}

function buildMaterialsAndSubstances(body) {
  return {
    materialsOrChemicalsUsed: cleanText(body.materialsOrChemicalsUsed),
    safetyDataSheetsAvailable: toBool(body.safetyDataSheetsAvailable),
    substanceHazards: selectedValues(body.substanceHazards),
    storageMethod: cleanText(body.storageMethod),
    spillHandling: cleanText(body.spillHandling),
    requiredPPE: cleanText(body.materialRequiredPPE),
    firstAidAfterExposure: cleanText(body.firstAidAfterExposure),
  };
}

function buildIncidentNearMissHistory(body) {
  return {
    similarHappenedBefore: toBool(body.similarHappenedBefore),
    workersComplained: toBool(body.workersComplained),
    nearMisses: toBool(body.nearMisses),
    equipmentFailedBefore: toBool(body.equipmentFailedBefore),
    injuriesFiresSpillsFallsShocksExposure: toBool(body.injuriesFiresSpillsFallsShocksExposure),
    notes: cleanText(body.incidentHistoryNotes),
  };
}

function buildIntake(body) {
  return {
    mainActivity: cleanText(body.mainActivity),
    workDescription: cleanText(body.description),
    shiftOrWorkingTime: cleanText(body.shiftOrWorkingTime),
    numberOfPeopleInvolved: toNumber(body.numberOfPeopleInvolved),
    workerTypes: buildWorkerTypes(body),
    personallyIdentifiedRisks: buildRiskInputs(body),
    existingControls: {
      selected: selectedValues(body.existingControls),
      notes: cleanText(body.existingControlsNotes),
    },
    emergencyPreparedness: buildEmergencyPreparedness(body),
    peopleExposure: buildPeopleExposure(body),
    hazardCategories: buildHazardCategories(body),
    ppeAssessment: buildPpeAssessment(body),
    equipmentAndTools: buildEquipmentAndTools(body),
    materialsAndSubstances: buildMaterialsAndSubstances(body),
    incidentNearMissHistory: buildIncidentNearMissHistory(body),
    documentIntent: selectedValues(body.documentIntent),
  };
}

function buildRiskConcerns(risks, defaultRiskLevel) {
  const labels = {
    people: "Risk to people",
    equipment: "Risk to equipment",
    environment: "Risk to environment",
    nearbyWorkersPublic: "Risk to nearby workers/public",
    propertyMaterials: "Risk to property/materials",
    operationsProduction: "Risk to operations/production",
  };
  const initialConcernCategories = {
    people: "personnel",
    equipment: "equipment",
    environment: "environmental",
    nearbyWorkersPublic: "personnel",
    propertyMaterials: "materials",
    operationsProduction: "procedural",
  };

  return Object.entries(risks)
    .filter(([, value]) => cleanText(value))
    .map(([key, value]) => ({
      concern: `${labels[key]}: ${cleanText(value)}`,
      category: initialConcernCategories[key] || "other",
      severity: defaultRiskLevel || "medium",
      notes: "",
    }));
}

function buildHazardsFromCategories(hazardCategories) {
  const riskLevelBySeverity = {
    minor: "low",
    moderate: "medium",
    major: "high",
    catastrophic: "critical",
  };

  return hazardCategories.map((hazard) => ({
    hazardId: new mongoose.Types.ObjectId(),
    hazard: hazard.category.replace(/_/g, " "),
    category: hazard.category.includes("chemical")
      ? "chemical"
      : hazard.category.includes("biological")
        ? "biological"
        : hazard.category.includes("electric")
          ? "electrical"
          : "physical",
    riskLevel: riskLevelBySeverity[hazard.severity] || "medium",
    likelihood: hazard.likelihood,
    consequence: hazard.severity,
    controls: hazard.existingControls,
    notes: [hazard.whatCouldHappen, hazard.controlsStillNeeded]
      .filter(Boolean)
      .join("\nControls still needed: "),
    identifiedDate: new Date(),
    status: "active",
  }));
}

function buildSafetyHubContent(workAreaName, intake) {
  const lines = [
    `Work area: ${workAreaName}`,
    `Main activity: ${intake.mainActivity || "Not specified"}`,
    `Description: ${intake.workDescription || "Not specified"}`,
    `Working time: ${intake.shiftOrWorkingTime || "Not specified"}`,
    `People involved: ${intake.numberOfPeopleInvolved || "Not specified"}`,
    "",
    "Personally identified risks:",
    JSON.stringify(intake.personallyIdentifiedRisks, null, 2),
    "",
    "Controls already in place:",
    selectedLabels(intake.existingControls.selected).join(", ") || "Not specified",
    intake.existingControls.notes || "",
    "",
    "Emergency preparedness:",
    JSON.stringify(intake.emergencyPreparedness, null, 2),
    "",
    "Hazard category assessment:",
    JSON.stringify(intake.hazardCategories, null, 2),
    "",
    "PPE assessment:",
    JSON.stringify(intake.ppeAssessment, null, 2),
    "",
    "Equipment and tools:",
    JSON.stringify(intake.equipmentAndTools, null, 2),
    "",
    "Materials and substances:",
    JSON.stringify(intake.materialsAndSubstances, null, 2),
    "",
    "Incident and near-miss history:",
    JSON.stringify(intake.incidentNearMissHistory, null, 2),
    "",
    "Requested AI documents:",
    selectedLabels(intake.documentIntent).join(", ") || "Not specified",
  ];

  return lines.filter((line) => line !== undefined && line !== null).join("\n");
}

async function findOwnedWorkArea(req, id) {
  return WorkArea.findOne({ _id: id, officerId: req.user._id });
}

exports.showCreateWorkAreaForm = async (req, res) => {
  res.render("work-areas/create", {
    user: req.user,
  });
};

exports.createWorkArea = async (req, res) => {
  try {
    const {
      name,
      code,
      location,
      description,
      status,
      plannedStart,
      plannedEnd,
      shifts,
      initialContextDesc,
      initialConcerns,
      initialRiskLevel,
      ppeItems,
      customPPE,
      specialConsiderations,
    } = req.body;

    const intake = buildIntake(req.body);
    const workAreaName = cleanText(name) || makeDefaultWorkAreaName(intake.mainActivity);
    const riskConcerns = buildRiskConcerns(intake.personallyIdentifiedRisks, initialRiskLevel);
    const manualConcerns = buildConcerns(initialConcerns, initialRiskLevel);
    const concerns = [...riskConcerns, ...manualConcerns];
    const hazards = [...buildHazards(req.body), ...buildHazardsFromCategories(intake.hazardCategories)];
    const selectedHazardCategories = intake.hazardCategories.map((hazard) => hazard.category);
    const workTypeValues = selectedHazardCategories.includes("excavation")
      ? ["excavation"]
      : selectedHazardCategories.includes("electricity_high_voltage")
        ? ["electrical"]
        : ["general"];

    const workArea = new WorkArea({
      officerId: req.user._id,
      createdBy: req.user._id,
      name: workAreaName,
      code: makeWorkAreaCode(workAreaName, code),
      location: normalizeLocation(location),
      description: description || intake.mainActivity || "",
      status: status || "active",
      plannedStart: plannedStart ? new Date(plannedStart) : undefined,
      plannedEnd: plannedEnd ? new Date(plannedEnd) : undefined,
      currentWorkTypes: buildWorkTypes(req.body.currentWorkTypes || workTypeValues),
      activeShifts: buildShifts(shifts),
      intake,
      initialContext: {
        description: initialContextDesc || description || "",
        submittedAt: new Date(),
        initialConcerns: concerns,
        requiredPPE: buildPPE(ppeItems, customPPE),
        initialRiskLevel: initialRiskLevel || "medium",
        specialConsiderations: specialConsiderations || "",
      },
      identifiedHazards: hazards,
      concernsRegister: concerns.map((concern) => ({
        concern: concern.concern,
        source: "initial",
        category: "hazard",
        riskAssessment: {
          severity: concern.severity,
          likelihood: "possible",
          riskLevel: concern.severity,
        },
        status: "active",
      })),
      aiContext: {
        currentPhase: intake.mainActivity,
        criticalActivities: selectedLabels(intake.hazardCategories.map((hazard) => hazard.category)),
        recentChanges: intake.incidentNearMissHistory.notes,
        upcomingRisks: Object.values(intake.personallyIdentifiedRisks).filter(Boolean),
        activeConcernsSummary: Object.values(intake.personallyIdentifiedRisks).filter(Boolean).join("\n"),
        ppeStatusSummary: [
          selectedLabels(intake.ppeAssessment.obtained).join(", "),
          intake.ppeAssessment.adequacy,
          intake.ppeAssessment.notes,
        ]
          .filter(Boolean)
          .join("\n"),
        workerFeedback: intake.incidentNearMissHistory.notes
          ? [
              {
                date: new Date(),
                comment: intake.incidentNearMissHistory.notes,
                topic: "incident_near_miss_history",
                sentiment: "neutral",
              },
            ]
          : [],
        safetyTrend: "stable",
        lastUpdated: new Date(),
      },
      statistics: {
        openConcerns: concerns.length + hazards.length,
      },
    });

    await workArea.save();

    await SafetyHub.findOneAndUpdate(
      { officerId: req.user._id, workArea: workArea._id },
      {
        $setOnInsert: { officerId: req.user._id, workArea: workArea._id },
        $push: {
          rawInputs: {
            source: "field_note",
            content: buildSafetyHubContent(workAreaName, intake),
          },
        },
        $set: {
          "summary.hazards": hazards.map((hazard) => hazard.hazard),
          "summary.workerFeedback": [
            intake.incidentNearMissHistory.notes,
            intake.peopleExposure.notes,
          ].filter(Boolean),
          "summary.lastUpdated": new Date(),
        },
      },
      { upsert: true, new: true },
    );

    req.flash("success", `Work area "${workAreaName}" created successfully.`);
    res.redirect(`/work-areas/${workArea._id}`);
  } catch (error) {
    console.error("Error creating work area:", error);
    req.flash("error", `Error creating work area: ${error.message}`);
    res.redirect("/work-areas/create");
  }
};

exports.getWorkArea = async (req, res) => {
  try {
    const workArea = await findOwnedWorkArea(req, req.params.id);
    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard/officer");
    }

    const [recentIncidents, activeAssessments, riskAssessments, safetyTalks, todaySafetyTalk, permits, jsa, ppeChecklists, safetyObservations, trainingRequirements, safetyInsights, emergencyProtocols, environmentalAssessments, safetyAudits, ohsComplianceAudits] =
      await Promise.all([
        Incident.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(5),
        RiskAssessment.find({ workArea: workArea._id, status: "active" }).limit(5),
        RiskAssessment.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        SafetyTalk.find({ targetWorkAreas: workArea._id }).sort({ date: -1 }).limit(10),
        SafetyTalk.findOne({
          targetWorkAreas: workArea._id,
          status: { $in: ["published", "conducted"] },
        }).sort({ date: -1, createdAt: -1 }),
        Permit.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        JSA.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        PPEChecklist.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        SafetyObservation.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        TrainingRequirement.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        SafetyInsight.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        EmergencyProtocol.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        EnvironmentalAssessment.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        SafetyAuditScorecard.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
        OHSComplianceAudit.find({ workArea: workArea._id }).sort({ createdAt: -1 }).limit(10),
      ]);

    res.render("work-areas/view", {
      user: req.user,
      workArea,
      recentIncidents,
      activeAssessments,
      riskAssessments,
      safetyTalks,
      todaySafetyTalk,
      permits,
      jsa,
      ppeChecklists,
      safetyObservations,
      trainingRequirements,
      safetyInsights,
      emergencyProtocols,
      environmentalAssessments,
      safetyAudits,
      ohsComplianceAudits,
    });
  } catch (error) {
    console.error("Error viewing work area:", error);
    req.flash("error", "Error loading work area");
    res.redirect("/dashboard/officer");
  }
};

exports.showEditWorkAreaForm = async (req, res) => {
  const workArea = await findOwnedWorkArea(req, req.params.id);
  if (!workArea) {
    req.flash("error", "Work area not found");
    return res.redirect("/dashboard/officer");
  }

  res.render("work-areas/edit", { user: req.user, workArea });
};

exports.updateWorkArea = async (req, res) => {
  try {
    const workArea = await findOwnedWorkArea(req, req.params.id);
    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard/officer");
    }

    const intake = buildIntake(req.body);
    const workAreaName = cleanText(req.body.name) || makeDefaultWorkAreaName(intake.mainActivity);
    const riskConcerns = buildRiskConcerns(intake.personallyIdentifiedRisks, req.body.initialRiskLevel);
    const manualConcerns = buildConcerns(req.body.initialConcerns, req.body.initialRiskLevel);
    const concerns = [...riskConcerns, ...manualConcerns];
    const hazards = [...buildHazards(req.body), ...buildHazardsFromCategories(intake.hazardCategories)];
    const selectedHazardCategories = intake.hazardCategories.map((hazard) => hazard.category);
    const workTypeValues = selectedHazardCategories.includes("excavation")
      ? ["excavation"]
      : selectedHazardCategories.includes("electricity_high_voltage")
        ? ["electrical"]
        : ["general"];

    workArea.name = workAreaName;
    workArea.code = makeWorkAreaCode(workAreaName, req.body.code || workArea.code);
    workArea.location = normalizeLocation(req.body.location);
    workArea.description = req.body.description || intake.mainActivity || "";
    workArea.status = req.body.status || workArea.status;
    workArea.plannedStart = req.body.plannedStart ? new Date(req.body.plannedStart) : undefined;
    workArea.plannedEnd = req.body.plannedEnd ? new Date(req.body.plannedEnd) : undefined;
    workArea.currentWorkTypes = buildWorkTypes(req.body.currentWorkTypes || workTypeValues);
    workArea.activeShifts = buildShifts(req.body.shifts);
    workArea.intake = intake;
    workArea.initialContext = {
      description: req.body.initialContextDesc || req.body.description || "",
      submittedAt: workArea.initialContext?.submittedAt || new Date(),
      initialConcerns: concerns,
      requiredPPE: buildPPE(req.body.ppeItems, req.body.customPPE),
      initialRiskLevel: req.body.initialRiskLevel || "medium",
      specialConsiderations: req.body.specialConsiderations || "",
    };
    workArea.identifiedHazards = hazards;
    workArea.concernsRegister = concerns.map((concern) => ({
      concern: concern.concern,
      source: "initial",
      category: "hazard",
      riskAssessment: {
        severity: concern.severity,
        likelihood: "possible",
        riskLevel: concern.severity,
      },
      status: "active",
    }));
    workArea.aiContext = {
      ...(workArea.aiContext || {}),
      currentPhase: intake.mainActivity,
      criticalActivities: selectedLabels(intake.hazardCategories.map((hazard) => hazard.category)),
      recentChanges: intake.incidentNearMissHistory.notes,
      upcomingRisks: Object.values(intake.personallyIdentifiedRisks).filter(Boolean),
      activeConcernsSummary: Object.values(intake.personallyIdentifiedRisks).filter(Boolean).join("\n"),
      ppeStatusSummary: [
        selectedLabels(intake.ppeAssessment.obtained).join(", "),
        intake.ppeAssessment.adequacy,
        intake.ppeAssessment.notes,
      ]
        .filter(Boolean)
        .join("\n"),
      lastUpdated: new Date(),
    };
    workArea.statistics = {
      ...(workArea.statistics || {}),
      openConcerns: concerns.length + hazards.length,
    };
    workArea.updatedBy = req.user._id;

    await workArea.save();

    await SafetyHub.findOneAndUpdate(
      { officerId: req.user._id, workArea: workArea._id },
      {
        $setOnInsert: { officerId: req.user._id, workArea: workArea._id },
        $push: {
          rawInputs: {
            source: "field_note",
            content: buildSafetyHubContent(workAreaName, intake),
          },
        },
        $set: {
          "summary.hazards": hazards.map((hazard) => hazard.hazard),
          "summary.workerFeedback": [
            intake.incidentNearMissHistory.notes,
            intake.peopleExposure.notes,
          ].filter(Boolean),
          "summary.lastUpdated": new Date(),
        },
      },
      { upsert: true, new: true },
    );

    req.flash("success", "Work area updated successfully");
    res.redirect(`/work-areas/${workArea._id}`);
  } catch (error) {
    console.error("Error updating work area:", error);
    req.flash("error", "Error updating work area");
    res.redirect(`/work-areas/${req.params.id}/edit`);
  }
};

exports.getAreaIncidents = async (req, res) => {
  const workArea = await findOwnedWorkArea(req, req.params.id);
  if (!workArea) return res.status(404).json({ error: "Work area not found" });
  res.json(await Incident.find({ workArea: workArea._id }).sort({ createdAt: -1 }));
};

exports.getAreaRiskAssessments = async (req, res) => {
  const workArea = await findOwnedWorkArea(req, req.params.id);
  if (!workArea) return res.status(404).json({ error: "Work area not found" });
  res.json(await RiskAssessment.find({ workArea: workArea._id }).sort({ createdAt: -1 }));
};

exports.getAreaSafetyTalks = async (req, res) => {
  const workArea = await findOwnedWorkArea(req, req.params.id);
  if (!workArea) return res.status(404).json({ error: "Work area not found" });
  res.json(await SafetyTalk.find({ targetWorkAreas: workArea._id }).sort({ date: -1 }));
};


