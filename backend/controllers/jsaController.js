const JSA = require("../models/JSA");
const WorkArea = require("../models/WorkArea");
const Incident = require("../models/Incident");
const SafetyObservation = require("../models/SafetyObservation");
const PPEChecklist = require("../models/PPEChecklist");
const { OpenAI } = require("openai");
const {
  professionalSafetyGuidance,
  miningContextGuidance,
} = require("../utils/aiPromptGuidance");
const fs = require("fs");
const path = require("path");
const { generateJSAWordBuffer } = require("../utils/jsaWordGenerator");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const jsaSections = [
  {
    key: "jobSteps",
    title: "Job Steps / Procedure",
    icon: "fas fa-list-ol",
    color: "primary",
  },
  {
    key: "hazardAnalysis",
    title: "Hazard Analysis",
    icon: "fas fa-exclamation-triangle",
    color: "danger",
  },
  {
    key: "controlMeasures",
    title: "Control Measures",
    icon: "fas fa-shield-alt",
    color: "success",
  },
  {
    key: "emergencyProcedures",
    title: "Emergency Procedures",
    icon: "fas fa-ambulance",
    color: "danger",
  },
  {
    key: "approvalSection",
    title: "Approvals & Sign-off",
    icon: "fas fa-signature",
    color: "secondary",
  },
];

// ========== SHOW CREATE FORM ==========
exports.showCreateForm = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const workArea = await WorkArea.findById(workAreaId).populate("worksite");
    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/dashboard");
    }
    res.render("jsa/create", {
      user: req.user,
      workArea,
      jsaSections,
    });
  } catch (error) {
    console.error("Error loading create form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

// ========== CREATE JSA ==========
exports.createJSA = async (req, res) => {
  try {
    const { workAreaId } = req.params;
    const {
      title,
      jobTask,
      location,
      shift,
      requiredTraining,
      jobSteps,
      hazardAnalysis,
      controlMeasures,
      emergencyProcedures,
      approvalSection,
    } = req.body;

    const workArea = await WorkArea.findById(workAreaId);
    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect(`/jsa/new/${workAreaId}`);
    }

    // Parse PPE items from dynamic form
    const ppeItems = [];
    if (req.body.ppeItems) {
      const items = Array.isArray(req.body.ppeItems)
        ? req.body.ppeItems
        : [req.body.ppeItems];
      const conditions = Array.isArray(req.body.ppeCondition)
        ? req.body.ppeCondition
        : [req.body.ppeCondition];
      for (let i = 0; i < items.length; i++) {
        if (items[i] && items[i].trim()) {
          ppeItems.push({
            item: items[i],
            condition: conditions[i] || "Good condition",
            quantity: "As needed",
          });
        }
      }
    }

    // Parse tools from dynamic form
    const tools = [];
    if (req.body.tools) {
      const items = Array.isArray(req.body.tools)
        ? req.body.tools
        : [req.body.tools];
      const conditions = Array.isArray(req.body.toolCondition)
        ? req.body.toolCondition
        : [req.body.toolCondition];
      for (let i = 0; i < items.length; i++) {
        if (items[i] && items[i].trim()) {
          tools.push({
            name: items[i],
            condition: conditions[i] || "Good",
            inspected: false,
          });
        }
      }
    }

    // Parse training
    let trainingArray = [];
    if (requiredTraining) {
      trainingArray = requiredTraining.split("\n").filter((t) => t.trim());
    }

    const newJSA = new JSA({
      workArea: workAreaId,
      title: title || `JSA - ${jobTask} - ${new Date().toLocaleDateString()}`,
      jobTask,
      location: location || workArea.name,
      shift: shift || "all",
      preparedBy: req.user.safetyOfficer,
      date: new Date(),
      requiredPPE: ppeItems,
      requiredTraining: trainingArray,
      toolsAndEquipment: tools,
      humanSections: {
        jobSteps: jobSteps || "",
        hazardAnalysis: hazardAnalysis || "",
        controlMeasures: controlMeasures || "",
        emergencyProcedures: emergencyProcedures || "",
        approvalSection: approvalSection || "",
      },
      aiSections: {},
      activeVersion: {},
      sectionConfirmed: {},
      consolidatedJSA: { content: "", pdfUrl: "", pdfUploaded: false },
      overallStatus: {
        allSectionsConfirmed: false,
        consolidatedGenerated: false,
      },
      status: "draft",
    });

    await newJSA.save();

    if (!workArea.documents) workArea.documents = {};
    if (!workArea.documents.jsas) workArea.documents.jsas = [];
    workArea.documents.jsas.push(newJSA._id);
    await workArea.save();

    req.flash(
      "success",
      "JSA created successfully! You can now enhance sections with AI.",
    );
    res.redirect(`/jsa/${newJSA._id}`);
  } catch (error) {
    console.error("Error creating JSA:", error);
    req.flash("error", "Error creating JSA: " + error.message);
    res.redirect(`/jsa/new/${req.params.workAreaId}`);
  }
};

// ========== VIEW JSA ==========
exports.getJSA = async (req, res) => {
  try {
    const jsa = await JSA.findById(req.params.id)
      .populate("workArea", "name worksite")
      .populate("preparedBy", "name")
      .populate("reviewedBy", "name")
      .populate("approvedBy", "name");

    if (!jsa) {
      req.flash("error", "JSA not found");
      return res.redirect("/dashboard");
    }

    const sectionConfirmedObj = jsa.sectionConfirmed || {};
    const confirmedCount = jsaSections.filter(
      (section) => sectionConfirmedObj[section.key] === true,
    ).length;
    const allConfirmedNow = confirmedCount === jsaSections.length;

    res.render("jsa/view", {
      user: req.user,
      jsa,
      jsaSections,
      confirmedCount,
      allConfirmedNow,
    });
  } catch (error) {
    console.error("Error viewing JSA:", error);
    req.flash("error", "Error loading JSA");
    res.redirect("/dashboard");
  }
};

// ========== GET SECTION CONTENT ==========
exports.getSectionContent = async (req, res) => {
  try {
    const { id, sectionKey } = req.params;
    const jsa = await JSA.findById(id);
    if (!jsa)
      return res.status(404).json({ success: false, error: "JSA not found" });

    const activeVersion = jsa.activeVersion?.[sectionKey] || "human";
    let content = "";
    if (activeVersion === "ai") {
      content = jsa.aiSections?.[sectionKey]?.content || "";
    } else {
      content = jsa.humanSections?.[sectionKey] || "";
    }

    res.json({
      success: true,
      content,
      activeVersion,
      isConfirmed: jsa.sectionConfirmed?.[sectionKey] || false,
      hasAI: !!jsa.aiSections?.[sectionKey]?.content,
    });
  } catch (error) {
    console.error("Error getting section content:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== GET AI SECTION ==========
exports.getAISection = async (req, res) => {
  try {
    const { id, sectionKey } = req.params;
    const jsa = await JSA.findById(id);
    if (!jsa) return res.status(404).json({ success: false });
    const content = jsa.aiSections?.[sectionKey]?.content || "";
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== ENHANCE SECTION WITH AI ==========
exports.enhanceSection = async (req, res) => {
  try {
    const { id, sectionKey } = req.params;
    const jsa = await JSA.findById(id).populate("workArea");
    if (!jsa)
      return res.status(404).json({ success: false, error: "JSA not found" });

    const humanContent = jsa.humanSections?.[sectionKey] || "";
    if (!humanContent)
      return res
        .status(400)
        .json({ success: false, error: "No human content to enhance" });

    const sectionTitles = {
      jobSteps: "Job Steps / Procedure",
      hazardAnalysis: "Hazard Analysis",
      controlMeasures: "Control Measures",
      emergencyProcedures: "Emergency Procedures",
      approvalSection: "Approvals & Sign-off",
    };

    const prompt = `You are a senior safety professional enhancing a Job Safety Analysis (JSA) for field use.

${professionalSafetyGuidance}
${miningContextGuidance}

Enhance the following **${sectionTitles[sectionKey]}** section.

HUMAN WRITTEN CONTENT:
${humanContent}

Enhance by improving task sequence, identifying missed hazards, adding practical controls, clarifying supervisor verification, and keeping the final text suitable for safety officer review. Return ONLY enhanced content.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const enhancedContent = completion.choices[0].message.content.trim();
    if (!jsa.aiSections) jsa.aiSections = {};
    jsa.aiSections[sectionKey] = {
      content: enhancedContent,
      confirmed: false,
    };
    await jsa.save();

    res.json({ success: true, enhancedContent, humanContent });
  } catch (error) {
    console.error("Error enhancing section:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== CONFIRM SECTION ==========
exports.confirmSection = async (req, res) => {
  try {
    const { id, sectionKey } = req.params;
    const { useAI } = req.body;
    const jsa = await JSA.findById(id);
    if (!jsa)
      return res.status(404).json({ success: false, error: "JSA not found" });

    if (!jsa.activeVersion) jsa.activeVersion = {};
    jsa.activeVersion[sectionKey] = useAI ? "ai" : "human";

    if (!jsa.sectionConfirmed) jsa.sectionConfirmed = {};
    jsa.sectionConfirmed[sectionKey] = true;

    const allConfirmed = jsaSections.every(
      (section) => jsa.sectionConfirmed[section.key] === true,
    );
    jsa.overallStatus.allSectionsConfirmed = allConfirmed;
    if (allConfirmed) jsa.status = "completed";

    await jsa.save();
    res.json({ success: true, message: "Section confirmed successfully" });
  } catch (error) {
    console.error("Error confirming section:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== GENERATE CONSOLIDATED PDF ==========
exports.generateConsolidated = async (req, res) => {
  try {
    const { id } = req.params;
    const jsa = await JSA.findById(id)
      .populate("workArea")
      .populate("preparedBy", "name");
    if (!jsa) {
      req.flash("error", "JSA not found");
      return res.redirect("/dashboard");
    }

    const allConfirmed = jsaSections.every(
      (section) => jsa.sectionConfirmed?.[section.key] === true,
    );
    if (!allConfirmed) {
      req.flash("error", "Please confirm all sections first");
      return res.redirect(`/jsa/${jsa._id}`);
    }

    let consolidatedContent = `# JOB SAFETY ANALYSIS (JSA)\n\n`;
    consolidatedContent += `**JSA #${jsa.jsaNumber}**\n`;
    consolidatedContent += `**Job/Task:** ${jsa.jobTask}\n`;
    consolidatedContent += `**Work Area:** ${jsa.workArea?.name || "N/A"}\n`;
    consolidatedContent += `**Location:** ${jsa.location}\n`;
    consolidatedContent += `**Prepared By:** ${jsa.preparedBy?.name || "N/A"}\n`;
    consolidatedContent += `**Date:** ${new Date(jsa.date).toLocaleDateString()}\n`;
    consolidatedContent += `**Shift:** ${jsa.shift}\n\n---\n\n`;

    for (const section of jsaSections) {
      const activeVersion = jsa.activeVersion?.[section.key] || "human";
      let content = "";
      if (activeVersion === "ai") {
        content = jsa.aiSections?.[section.key]?.content || "";
      } else {
        content = jsa.humanSections?.[section.key] || "";
      }
      if (content) {
        consolidatedContent += `## ${section.title}\n\n${content}\n\n---\n\n`;
      }
    }

    // Add PPE section
    if (jsa.requiredPPE && jsa.requiredPPE.length > 0) {
      consolidatedContent += `## Required PPE\n\n`;
      consolidatedContent += `| PPE Item | Quantity | Condition |\n`;
      consolidatedContent += `|----------|----------|-----------|\n`;
      jsa.requiredPPE.forEach((ppe) => {
        consolidatedContent += `| ${ppe.item} | ${ppe.quantity || "As needed"} | ${ppe.condition || "Good"} |\n`;
      });
      consolidatedContent += `\n---\n\n`;
    }

    // Add Training section
    if (jsa.requiredTraining && jsa.requiredTraining.length > 0) {
      consolidatedContent += `## Required Training/Certifications\n\n`;
      jsa.requiredTraining.forEach((t) => {
        consolidatedContent += `- ${t}\n`;
      });
      consolidatedContent += `\n---\n\n`;
    }

    jsa.consolidatedJSA = {
      content: consolidatedContent,
      pdfUploaded: false,
      pdfUrl: "",
      generatedAt: new Date(),
    };
    jsa.overallStatus.consolidatedGenerated = true;
    await jsa.save();

    const fileName = `jsa_${jsa.jsaNumber}.pdf`;
    const localPath = path.join(__dirname, `../pdfs/${fileName}`);
    const storagePath = `jsa/${fileName}`;

    if (!fs.existsSync(path.dirname(localPath))) {
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
    }

    try {
      await generateJSAPDF({
        title: `JSA #${jsa.jsaNumber} - ${jsa.jobTask}`,
        content: consolidatedContent,
        filePath: localPath,
        jsaDetails: {
          jsaNumber: jsa.jsaNumber,
          jobTask: jsa.jobTask,
          workArea: jsa.workArea?.name,
          date: jsa.date,
        },
      });
      await bucket.upload(localPath, {
        destination: storagePath,
        gzip: true,
        metadata: { cacheControl: "public, max-age=31536000" },
      });
      const file = bucket.file(storagePath);
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      jsa.consolidatedJSA.pdfUrl = url;
      jsa.consolidatedJSA.pdfUploaded = true;
      await jsa.save();
    } catch (err) {
      console.error("PDF failed:", err.message);
      req.flash("error", "PDF generation failed");
      return res.redirect(`/jsa/${jsa._id}`);
    } finally {
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    req.flash("success", "Complete JSA generated!");
    res.redirect(`/jsa/${jsa._id}`);
  } catch (error) {
    console.error("Error generating consolidated:", error);
    req.flash("error", "Failed to generate consolidated JSA");
    res.redirect(`/jsa/${req.params.id}`);
  }
};

// ========== DOWNLOAD PDF ==========
exports.downloadPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const jsa = await JSA.findById(id);
    if (!jsa) return res.status(404).send("JSA not found");
    if (!jsa.consolidatedJSA?.pdfUrl)
      return res.status(404).send("PDF not found");
    res.redirect(jsa.consolidatedJSA.pdfUrl);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).send("Error downloading PDF");
  }
};

// ========== EDIT JSA ==========
exports.showEditForm = async (req, res) => {
  try {
    const jsa = await JSA.findById(req.params.id).populate("workArea");
    if (!jsa) {
      req.flash("error", "JSA not found");
      return res.redirect("/dashboard");
    }
    res.render("jsa/edit", { user: req.user, jsa, jsaSections });
  } catch (error) {
    console.error("Error loading edit form:", error);
    req.flash("error", "Error loading form");
    res.redirect("/dashboard");
  }
};

exports.updateJSA = async (req, res) => {
  try {
    const jsa = await JSA.findById(req.params.id);
    if (!jsa)
      return res.status(404).json({ success: false, error: "JSA not found" });
    const { sectionKey, content } = req.body;
    if (sectionKey && jsa.humanSections) {
      jsa.humanSections[sectionKey] = content;
      await jsa.save();
      return res.json({ success: true, message: "Section updated" });
    }
    res.json({ success: true, message: "JSA updated" });
  } catch (error) {
    console.error("Error updating:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========== APPROVE JSA ==========
exports.approveJSA = async (req, res) => {
  try {
    const jsa = await JSA.findById(req.params.id);
    if (!jsa)
      return res.status(404).json({ success: false, error: "JSA not found" });
    jsa.status = "approved";
    jsa.approvedBy = req.user.safetyOfficer;
    await jsa.save();
    res.json({ success: true, message: "JSA approved" });
  } catch (error) {
    console.error("Error approving:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.downloadWord = async (req, res) => {
  try {
    const { id } = req.params;

    const jsa = await JSA.findById(id)
      .populate("workArea")
      .populate("preparedBy", "name")
      .populate("reviewedBy", "name")
      .populate("approvedBy", "name");

    if (!jsa) {
      return res.status(404).send("JSA not found");
    }

    const allConfirmed = jsaSections.every(
      (section) => jsa.sectionConfirmed?.[section.key] === true,
    );

    if (!allConfirmed) {
      return res
        .status(400)
        .send(
          "Please confirm all JSA sections before downloading the Word document.",
        );
    }

    const buffer = await generateJSAWordBuffer({
      jsa,
      jsaSections,
    });

    const safeNumber = jsa.jsaNumber || Date.now();
    const fileName = `jsa_${safeNumber}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(buffer);
  } catch (error) {
    console.error("Error downloading JSA Word document:", error);
    return res.status(500).send("Error generating JSA Word document");
  }
};
