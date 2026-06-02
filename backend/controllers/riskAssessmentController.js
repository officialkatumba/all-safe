const RiskAssessment = require("../models/RiskAssessment");
const WorkArea = require("../models/WorkArea");
const SafetyHub = require("../models/SafetyHub");
const Incident = require("../models/Incident");
const SafetyTalk = require("../models/SafetyTalk");
const { OpenAI } = require("openai");
const {
  professionalSafetyGuidance,
  miningContextGuidance,
} = require("../utils/aiPromptGuidance");
const fs = require("fs");
const path = require("path");

const { generateRiskWordBuffer } = require("../utils/riskWordGenerator");
const { generateRiskPDF } = require("../utils/riskWordGenerator");
const { AI_MODEL, AI_MAX_TOKENS } = require("../utils/aiConfig");
const { trackAiCompletion } = require("../utils/aiReview");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sections = [
  {
    key: "ExecutiveSummary",
    title: "Executive Summary",
    icon: "fas fa-file-alt",
    color: "primary",
  },
  {
    key: "ScopeMethodology",
    title: "Scope & Methodology",
    icon: "fas fa-chart-line",
    color: "info",
  },
  {
    key: "DetailedHazardAnalysis",
    title: "Detailed Hazard Analysis",
    icon: "fas fa-exclamation-triangle",
    color: "danger",
  },
  {
    key: "RiskMatrixSummary",
    title: "Risk Matrix Summary",
    icon: "fas fa-table",
    color: "warning",
  },
  {
    key: "ControlMeasuresSummary",
    title: "Control Measures Summary",
    icon: "fas fa-shield-alt",
    color: "success",
  },
  {
    key: "EmergencyProcedures",
    title: "Emergency Procedures",
    icon: "fas fa-ambulance",
    color: "danger",
  },
  {
    key: "MonitoringReview",
    title: "Monitoring & Review",
    icon: "fas fa-chart-line",
    color: "info",
  },
  {
    key: "ActionPlan",
    title: "Action Plan",
    icon: "fas fa-list-check",
    color: "primary",
  },
  {
    key: "Approvals",
    title: "Approvals",
    icon: "fas fa-signature",
    color: "secondary",
  },
];

exports.showCreateForm = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }
    res.render("risk-assessments/create", {
      user: req.user,
      workArea,
      sections,
    });
  } catch (error) {
    console.error("Error loading create form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

exports.createRiskAssessment = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const {
      title,
      description,
      personnelCount,
      experienceLevel,
      affectedGroups,
      specificConcerns,
      ExecutiveSummary,
      ScopeMethodology,
      DetailedHazardAnalysis,
      RiskMatrixSummary,
      ControlMeasuresSummary,
      EmergencyProcedures,
      MonitoringReview,
      ActionPlan,
      Approvals,
      hazardsCount,
    } = req.body;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect(`/risk-assessments/new/${workAreaId}`);
    }

    const hazardsArray = [];
    const numHazards = parseInt(hazardsCount) || 0;
    for (let i = 0; i < numHazards; i++) {
      const hazardDesc = req.body.hazards?.[i]?.description;
      if (hazardDesc && hazardDesc.trim()) {
        hazardsArray.push({
          description: hazardDesc,
          category: req.body.hazards[i]?.category || "physical",
          initialRisk: {
            riskLevel: req.body.hazards[i]?.initialRiskLevel || "medium",
          },
          controls: req.body.hazards[i]?.controls
            ? [
                {
                  measure: req.body.hazards[i].controls,
                  type: "administrative",
                  effectiveness: "pending",
                },
              ]
            : [],
          affectedGroups: req.body.hazards[i]?.affectedGroups
            ? [
                {
                  group: "workers",
                  details: req.body.hazards[i].affectedGroups,
                },
              ]
            : [],
          status: "active",
        });
      }
    }

    const newAssessment = new RiskAssessment({
      workArea: workAreaId,
      title:
        title ||
        `Risk Assessment - ${workArea.name} - ${new Date().toLocaleDateString()}`,
      description: description || ExecutiveSummary?.substring(0, 500) || "",
      conductedBy: req.user._id,
      assessmentDate: new Date(),
      status: "draft",
      hazards: hazardsArray,
      formData: {
        personnelCount: personnelCount || workArea.workerCount || 0,
        experienceLevel: experienceLevel || "mixed",
        specificConcerns: specificConcerns || "",
        affectedGroups: affectedGroups || "",
      },
      humanSections: {
        ExecutiveSummary: ExecutiveSummary || "",
        ScopeMethodology: ScopeMethodology || "",
        DetailedHazardAnalysis: DetailedHazardAnalysis || "",
        RiskMatrixSummary: RiskMatrixSummary || "",
        ControlMeasuresSummary: ControlMeasuresSummary || "",
        EmergencyProcedures: EmergencyProcedures || "",
        MonitoringReview: MonitoringReview || "",
        ActionPlan: ActionPlan || "",
        Approvals: Approvals || "",
      },
      aiSections: {},
      activeVersion: {},
      sectionConfirmed: {},
      consolidatedAssessment: { content: "", pdfUrl: "", pdfUploaded: false },
      overallStatus: {
        allSectionsConfirmed: false,
        consolidatedGenerated: false,
      },
    });

    await newAssessment.save();
    if (!workArea.documents) workArea.documents = { riskAssessments: [] };
    workArea.documents.riskAssessments.push(newAssessment._id);
    await workArea.save();
    await SafetyHub.findOneAndUpdate(
      { officerId: req.user._id, workArea: workArea._id },
      {
        $setOnInsert: { officerId: req.user._id, workArea: workArea._id },
        $addToSet: { "generatedDrafts.riskAssessments": newAssessment._id },
      },
      { upsert: true },
    );

    req.flash("success", "Risk assessment created successfully!");
    res.redirect(`/risk-assessments/${newAssessment._id}`);
  } catch (error) {
    console.error("Error creating risk assessment:", error);
    req.flash("error", "Error creating risk assessment: " + error.message);
    res.redirect(`/risk-assessments/new/${req.params.workAreaId}`);
  }
};

exports.getRiskAssessment = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findById(req.params.id)
      .populate("workArea", "name")
      .populate("conductedBy", "name");

    if (!assessment) {
      req.flash("error", "Risk assessment not found");
      return res.redirect("/dashboard");
    }

    const sectionConfirmedObj = assessment.sectionConfirmed || {};
    const confirmedCount = sections.filter(
      (section) => sectionConfirmedObj[section.key] === true,
    ).length;
    const allConfirmedNow = confirmedCount === sections.length;

    res.render("risk-assessments/view", {
      user: req.user,
      assessment,
      sections,
      confirmedCount,
      allConfirmedNow,
    });
  } catch (error) {
    console.error("Error viewing risk assessment:", error);
    req.flash("error", "Error loading assessment");
    res.redirect("/dashboard");
  }
};

exports.getSectionContent = async (req, res) => {
  try {
    const { id, sectionKey } = req.params;
    const assessment = await RiskAssessment.findById(id);
    if (!assessment)
      return res
        .status(404)
        .json({ success: false, error: "Assessment not found" });

    const activeVersion = assessment.activeVersion?.[sectionKey] || "human";
    let content = "";
    if (activeVersion === "ai") {
      content = assessment.aiSections?.[sectionKey]?.content || "";
    } else {
      content = assessment.humanSections?.[sectionKey] || "";
    }

    res.json({
      success: true,
      content,
      activeVersion,
      isConfirmed: assessment.sectionConfirmed?.[sectionKey] || false,
      hasAI: !!assessment.aiSections?.[sectionKey]?.content,
    });
  } catch (error) {
    console.error("Error getting section content:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAISection = async (req, res) => {
  try {
    const { id, sectionKey } = req.params;
    const assessment = await RiskAssessment.findById(id);
    if (!assessment) return res.status(404).json({ success: false });
    const content = assessment.aiSections?.[sectionKey]?.content || "";
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.enhanceSection = async (req, res) => {
  try {
    const { id, sectionKey } = req.params;
    const assessment = await RiskAssessment.findById(id).populate("workArea");
    if (!assessment)
      return res
        .status(404)
        .json({ success: false, error: "Assessment not found" });

    const humanContent = assessment.humanSections?.[sectionKey] || "";
    if (!humanContent)
      return res
        .status(400)
        .json({ success: false, error: "No human content to enhance" });

    const sectionTitles = {
      ExecutiveSummary: "Executive Summary",
      ScopeMethodology: "Scope and Methodology",
      DetailedHazardAnalysis: "Detailed Hazard Analysis",
      RiskMatrixSummary: "Risk Matrix Summary",
      ControlMeasuresSummary: "Control Measures Summary",
      EmergencyProcedures: "Emergency Procedures",
      MonitoringReview: "Monitoring and Review",
      ActionPlan: "Action Plan",
      Approvals: "Approvals",
    };

    const prompt = `You are a senior Health and Safety Officer enhancing a professional work-area risk assessment.

${professionalSafetyGuidance}
${miningContextGuidance}

Enhance the following **${sectionTitles[sectionKey]}** section.

HUMAN WRITTEN CONTENT:
${humanContent}

Enhance by improving clarity, adding practical controls, noting evidence gaps, applying hierarchy of controls, and keeping the final text suitable for review and approval by a competent safety officer. Return ONLY enhanced content.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: AI_MAX_TOKENS.riskAssessmentSection,
    });

    const enhancedContent = completion.choices[0].message.content.trim();
    await trackAiCompletion({
      completion,
      user: req.user._id,
      workArea: assessment.workArea,
      module: "risk_assessment_section",
      description: `Risk assessment section enhanced: ${sectionKey}`,
      relatedModel: "RiskAssessment",
      relatedId: assessment._id,
      maxTokens: AI_MAX_TOKENS.riskAssessmentSection,
    });
    if (!assessment.aiSections) assessment.aiSections = {};
    assessment.aiSections[sectionKey] = {
      content: enhancedContent,
      confirmed: false,
    };
    await assessment.save();

    res.json({ success: true, enhancedContent, humanContent });
  } catch (error) {
    console.error("Error enhancing section:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.confirmSection = async (req, res) => {
  try {
    const { id, sectionKey } = req.params;
    const { useAI } = req.body;
    const assessment = await RiskAssessment.findById(id);
    if (!assessment)
      return res
        .status(404)
        .json({ success: false, error: "Assessment not found" });

    if (!assessment.activeVersion) assessment.activeVersion = {};
    assessment.activeVersion[sectionKey] = useAI ? "ai" : "human";

    if (!assessment.sectionConfirmed) assessment.sectionConfirmed = {};
    assessment.sectionConfirmed[sectionKey] = true;

    const allConfirmed = sections.every(
      (section) => assessment.sectionConfirmed[section.key] === true,
    );
    assessment.overallStatus.allSectionsConfirmed = allConfirmed;
    if (allConfirmed) assessment.status = "completed";

    await assessment.save();
    res.json({ success: true, message: "Section confirmed successfully" });
  } catch (error) {
    console.error("Error confirming section:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// exports.generateConsolidated = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const assessment = await RiskAssessment.findById(id)
//       .populate("workArea")
//       .populate("conductedBy", "name");
//     if (!assessment) {
//       req.flash("error", "Assessment not found");
//       return res.redirect("/dashboard");
//     }

//     const allConfirmed = sections.every(
//       (section) => assessment.sectionConfirmed?.[section.key] === true,
//     );
//     if (!allConfirmed) {
//       req.flash("error", "Please confirm all sections first");
//       return res.redirect(`/risk-assessments/${assessment._id}`);
//     }

//     let consolidatedContent = `# COMPLETE RISK ASSESSMENT REPORT\n\n`;
//     consolidatedContent += `**Assessment #${assessment.assessmentNumber}**\n`;
//     consolidatedContent += `**Title:** ${assessment.title}\n`;
//     consolidatedContent += `**Work Area:** ${assessment.workArea?.name || "N/A"}\n`;
//     consolidatedContent += `**Conducted By:** ${assessment.conductedBy?.name || "N/A"}\n`;
//     consolidatedContent += `**Date:** ${new Date(assessment.assessmentDate).toLocaleDateString()}\n\n---\n\n`;

//     for (const section of sections) {
//       const activeVersion = assessment.activeVersion?.[section.key] || "human";
//       let content = "";
//       if (activeVersion === "ai") {
//         content = assessment.aiSections?.[section.key]?.content || "";
//       } else {
//         content = assessment.humanSections?.[section.key] || "";
//       }
//       if (content) {
//         consolidatedContent += `## ${section.title}\n\n${content}\n\n---\n\n`;
//       }
//     }

//     assessment.consolidatedAssessment = {
//       content: consolidatedContent,
//       pdfUploaded: false,
//       pdfUrl: "",
//       generatedAt: new Date(),
//     };
//     assessment.overallStatus.consolidatedGenerated = true;
//     await assessment.save();

//     const fileName = `consolidated_risk_assessment_${assessment.assessmentNumber}.pdf`;
//     const localPath = path.join(__dirname, `../pdfs/${fileName}`);
//     const storagePath = `risk-assessments/${fileName}`;

//     if (!fs.existsSync(path.dirname(localPath)))
//       fs.mkdirSync(path.dirname(localPath), { recursive: true });

//     try {
//       await generateRiskPDF({
//         sectionTitle: "COMPLETE RISK ASSESSMENT",
//         content: consolidatedContent,
//         filePath: localPath,
//         assessmentDetails: {
//           assessmentNumber: assessment.assessmentNumber,
//           title: assessment.title,
//           workArea: assessment.workArea?.name,
//           assessmentDate: assessment.assessmentDate,
//         },
//       });
//       await bucket.upload(localPath, {
//         destination: storagePath,
//         gzip: true,
//         metadata: { cacheControl: "public, max-age=31536000" },
//       });
//       const file = bucket.file(storagePath);
//       const [url] = await file.getSignedUrl({
//         version: "v4",
//         action: "read",
//         expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
//       });
//       assessment.consolidatedAssessment.pdfUrl = url;
//       assessment.consolidatedAssessment.pdfUploaded = true;
//       await assessment.save();
//     } catch (err) {
//       console.error("PDF failed:", err.message);
//       req.flash("error", "PDF generation failed");
//       return res.redirect(`/risk-assessments/${assessment._id}`);
//     } finally {
//       if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
//     }

//     req.flash("success", "Consolidated report generated!");
//     res.redirect(`/risk-assessments/${assessment._id}`);
//   } catch (error) {
//     console.error("Error generating consolidated:", error);
//     req.flash("error", "Failed to generate consolidated report");
//     res.redirect(`/risk-assessments/${req.params.id}`);
//   }
// };

exports.generateConsolidated = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await RiskAssessment.findById(id)
      .populate("workArea")
      .populate("conductedBy", "name");

    if (!assessment) {
      req.flash("error", "Assessment not found");
      return res.redirect("/dashboard");
    }

    const allConfirmed = sections.every(
      (section) => assessment.sectionConfirmed?.[section.key] === true,
    );

    if (!allConfirmed) {
      req.flash("error", "Please confirm all sections first");
      return res.redirect(`/risk-assessments/${assessment._id}`);
    }

    if (assessment.status !== "approved") {
      req.flash("error", "Approve the final risk assessment before downloading it");
      return res.redirect(`/risk-assessments/${assessment._id}`);
    }

    let consolidatedContent = `# COMPLETE RISK ASSESSMENT REPORT\n\n`;
    consolidatedContent += `Assessment Number: ${assessment.assessmentNumber || "N/A"}\n`;
    consolidatedContent += `Title: ${assessment.title || "N/A"}\n`;
    consolidatedContent += `Work Area: ${assessment.workArea?.name || "N/A"}\n`;
    consolidatedContent += `Conducted By: ${assessment.conductedBy?.name || "N/A"}\n`;
    consolidatedContent += `Date: ${
      assessment.assessmentDate
        ? new Date(assessment.assessmentDate).toLocaleDateString("en-GB")
        : "N/A"
    }\n\n`;

    consolidatedContent += `------------------------------------------------------------\n\n`;

    for (const section of sections) {
      const activeVersion = assessment.activeVersion?.[section.key] || "human";

      let content = "";

      if (activeVersion === "ai") {
        content = assessment.aiSections?.[section.key]?.content || "";
      } else {
        content = assessment.humanSections?.[section.key] || "";
      }

      consolidatedContent += `## ${section.title}\n\n`;
      consolidatedContent += `${content || "No content provided."}\n\n`;
      consolidatedContent += `------------------------------------------------------------\n\n`;
    }

    consolidatedContent += `## Approval and Sign-Off\n\n`;
    consolidatedContent += `Prepared By: ______________________________\n\n`;
    consolidatedContent += `Signature: ________________________________\n\n`;
    consolidatedContent += `Date: _____________________________________\n\n`;
    consolidatedContent += `Reviewed / Approved By: ___________________\n\n`;
    consolidatedContent += `Signature: ________________________________\n\n`;
    consolidatedContent += `Date: _____________________________________\n\n`;

    assessment.consolidatedAssessment = {
      content: consolidatedContent,
      pdfUploaded: false,
      pdfUrl: "",
      generatedAt: new Date(),
    };

    assessment.overallStatus.consolidatedGenerated = true;
    assessment.status = "completed";

    await assessment.save();

    req.flash(
      "success",
      "Consolidated risk assessment prepared. You can now download the editable Word document.",
    );

    res.redirect(`/risk-assessments/${assessment._id}`);
  } catch (error) {
    console.error("Error generating consolidated risk assessment:", error);
    req.flash("error", "Failed to generate consolidated risk assessment");
    res.redirect(`/risk-assessments/${req.params.id}`);
  }
};

// exports.downloadConsolidatedPDF = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const assessment = await RiskAssessment.findById(id);
//     if (!assessment) return res.status(404).send("Assessment not found");
//     if (!assessment.consolidatedAssessment?.pdfUrl)
//       return res.status(404).send("PDF not found");
//     res.redirect(assessment.consolidatedAssessment.pdfUrl);
//   } catch (error) {
//     console.error("Error downloading PDF:", error);
//     res.status(500).send("Error downloading PDF");
//   }
// };

exports.downloadConsolidatedWord = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await RiskAssessment.findById(id)
      .populate("workArea")
      .populate("conductedBy", "name");

    if (!assessment) {
      return res.status(404).send("Risk assessment not found");
    }

    const allConfirmed = sections.every(
      (section) => assessment.sectionConfirmed?.[section.key] === true,
    );

    if (!allConfirmed) {
      return res
        .status(400)
        .send(
          "Please confirm all sections before downloading the Word document.",
        );
    }

    const buffer = await generateRiskWordBuffer({
      assessment,
      sections,
    });

    const safeAssessmentNumber = assessment.assessmentNumber || Date.now();

    const fileName = `risk_assessment_${safeAssessmentNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading Word document:", error);
    return res.status(500).send("Error generating Word document");
  }
};

exports.showEditForm = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findById(req.params.id).populate(
      "workArea",
    );
    if (!assessment) {
      req.flash("error", "Risk assessment not found");
      return res.redirect("/dashboard");
    }
    res.render("risk-assessments/edit", {
      user: req.user,
      assessment,
      sections,
    });
  } catch (error) {
    console.error("Error loading edit form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

exports.updateRiskAssessment = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findById(req.params.id);
    if (!assessment)
      return res
        .status(404)
        .json({ success: false, error: "Assessment not found" });
    const { sectionKey, content } = req.body;
    if (sectionKey && assessment.humanSections) {
      assessment.humanSections[sectionKey] = content;
      await assessment.save();
      return res.json({ success: true, message: "Section updated" });
    }
    res.json({ success: true, message: "Assessment updated" });
  } catch (error) {
    console.error("Error updating:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveAssessment = async (req, res) => {
  try {
    const assessment = await RiskAssessment.findById(req.params.id);
    if (!assessment)
      return res
        .status(404)
        .json({ success: false, error: "Assessment not found" });
    const allConfirmed = sections.every(
      (section) => assessment.sectionConfirmed?.[section.key] === true,
    );
    if (!allConfirmed) {
      req.flash("error", "Confirm every section before approving the assessment");
      return res.redirect(`/risk-assessments/${assessment._id}`);
    }
    assessment.status = "approved";
    await assessment.save();
    req.flash("success", "Risk assessment approved and locked");
    res.redirect(`/risk-assessments/${assessment._id}`);
  } catch (error) {
    console.error("Error approving:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

