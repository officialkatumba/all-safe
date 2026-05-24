// const Incident = require("../models/Incident");
// const RiskAssessment = require("../models/RiskAssessment");
// const SafetyTalk = require("../models/SafetyTalk");
// const PPEChecklist = require("../models/PPEChecklist");
// const SafetyObservation = require("../models/SafetyObservation");
// const Worksite = require("../models/Worksite");
// const WorkArea = require("../models/WorkArea");
// const SafetyOfficer = require("../models/SafetyOfficer");

// // Show safety officer dashboard
// // exports.showDashboard = async (req, res) => {
// //   try {
// //     const officer = await SafetyOfficer.findOne({ user: req.user._id })
// //       .populate("worksites")
// //       .populate("workAreas");

// //     if (!officer) {
// //       req.flash("error", "Safety officer profile not found");
// //       return res.redirect("/");
// //     }

// //     // Get assigned worksites and work areas
// //     const assignedWorksites = await Worksite.find({
// //       "assignedSafetyOfficers.officer": officer._id,
// //       "assignedSafetyOfficers.isActive": true,
// //     });

// //     const workAreas = await WorkArea.find({
// //       "assignedSafetyOfficers.officer": officer._id,
// //       "assignedSafetyOfficers.isActive": true,
// //     }).populate("worksite", "name");

// //     // Get statistics
// //     const stats = {
// //       incidentsReported: await Incident.countDocuments({
// //         reportedBy: officer._id,
// //       }),
// //       safetyTalks: await SafetyTalk.countDocuments({
// //         conductedBy: officer._id,
// //       }),
// //       riskAssessments: await RiskAssessment.countDocuments({
// //         assessedBy: officer._id,
// //       }),
// //       ppeChecks: await PPEChecklist.countDocuments({
// //         conductedBy: officer._id,
// //       }),
// //     };

// //     // Get recent activities
// //     const recentIncidents = await Incident.find({ reportedBy: officer._id })
// //       .sort({ createdAt: -1 })
// //       .limit(5);

// //     const recentAssessments = await RiskAssessment.find({
// //       assessedBy: officer._id,
// //     })
// //       .sort({ createdAt: -1 })
// //       .limit(5);

// //     const recentActivities = [
// //       ...recentIncidents.map((i) => ({
// //         ...i.toObject(),
// //         type: "incident",
// //         link: `/safety-officer/incidents/${i._id}`,
// //       })),
// //       ...recentAssessments.map((a) => ({
// //         ...a.toObject(),
// //         type: "assessment",
// //         link: `/safety-officer/risk-assessments/${a._id}`,
// //       })),
// //     ].sort((a, b) => b.createdAt - a.createdAt);

// //     res.render("safety-officer/dashboard", {
// //       user: req.user,
// //       officer,
// //       assignedWorksites,
// //       workAreas,
// //       stats,
// //       recentActivities,
// //     });
// //   } catch (error) {
// //     console.error("Dashboard error:", error);
// //     req.flash("error", "Error loading dashboard");
// //     res.redirect("/");
// //   }
// // };

// // Show safety officer dashboard - UPDATED
// // exports.showDashboard = async (req, res) => {
// //   try {
// //     const officer = await SafetyOfficer.findOne({ user: req.user._id })
// //       .populate("worksites")
// //       .populate("workAreas"); // This populates workAreas directly

// //     if (!officer) {
// //       req.flash("error", "Safety officer profile not found");
// //       return res.redirect("/");
// //     }

// //     // Get assigned worksites
// //     const assignedWorksites = await Worksite.find({
// //       "assignedSafetyOfficers.officer": officer._id,
// //       "assignedSafetyOfficers.isActive": true,
// //     });

// //     // Get work areas - TWO WAYS to ensure we get all assigned areas
// //     let workAreas = [];

// //     // Method 1: Get work areas from the officer's populated workAreas field
// //     if (officer.workAreas && officer.workAreas.length > 0) {
// //       workAreas = officer.workAreas;
// //     }

// //     // Method 2: Also check assignedSafetyOfficers in WorkArea collection
// //     const assignedWorkAreas = await WorkArea.find({
// //       "assignedSafetyOfficers.officer": officer._id,
// //       "assignedSafetyOfficers.isActive": true,
// //     }).populate("worksite", "name");

// //     // Merge both sources (remove duplicates by ID)
// //     const allWorkAreas = [...workAreas, ...assignedWorkAreas];
// //     const uniqueWorkAreas = [];
// //     const seenIds = new Set();

// //     for (const area of allWorkAreas) {
// //       if (!seenIds.has(area._id.toString())) {
// //         seenIds.add(area._id.toString());
// //         uniqueWorkAreas.push(area);
// //       }
// //     }

// //     workAreas = uniqueWorkAreas;

// //     // Get statistics
// //     const stats = {
// //       incidentsReported: await Incident.countDocuments({
// //         reportedBy: officer._id,
// //       }),
// //       safetyTalks: await SafetyTalk.countDocuments({
// //         conductedBy: officer._id,
// //       }),
// //       riskAssessments: await RiskAssessment.countDocuments({
// //         assessedBy: officer._id,
// //       }),
// //       ppeChecks: await PPEChecklist.countDocuments({
// //         conductedBy: officer._id,
// //       }),
// //     };

// //     // Get recent activities
// //     const recentIncidents = await Incident.find({ reportedBy: officer._id })
// //       .sort({ createdAt: -1 })
// //       .limit(5);

// //     const recentAssessments = await RiskAssessment.find({
// //       assessedBy: officer._id,
// //     })
// //       .sort({ createdAt: -1 })
// //       .limit(5);

// //     const recentActivities = [
// //       ...recentIncidents.map((i) => ({
// //         ...i.toObject(),
// //         type: "incident",
// //         link: `/safety-officer/incidents/${i._id}`,
// //       })),
// //       ...recentAssessments.map((a) => ({
// //         ...a.toObject(),
// //         type: "assessment",
// //         link: `/safety-officer/risk-assessments/${a._id}`,
// //       })),
// //     ].sort((a, b) => b.createdAt - a.createdAt);

// //     res.render("safety-officer/dashboard", {
// //       user: req.user,
// //       officer,
// //       assignedWorksites,
// //       workAreas, // Now properly populated
// //       stats,
// //       recentActivities,
// //     });
// //   } catch (error) {
// //     console.error("Dashboard error:", error);
// //     req.flash("error", "Error loading dashboard");
// //     res.redirect("/");
// //   }
// // };

// // Show safety officer dashboard - Using officer.workAreas directly
// exports.showDashboard = async (req, res) => {
//   try {
//     // Populate workAreas from the officer's array
//     const officer = await SafetyOfficer.findOne({ user: req.user._id })
//       .populate("worksites")
//       .populate({
//         path: "workAreas",
//         populate: {
//           path: "worksite",
//           select: "name location",
//         },
//       });

//     if (!officer) {
//       req.flash("error", "Safety officer profile not found");
//       return res.redirect("/");
//     }

//     // Get assigned worksites
//     const assignedWorksites = await Worksite.find({
//       "assignedSafetyOfficers.officer": officer._id,
//       "assignedSafetyOfficers.isActive": true,
//     });

//     // Use the populated workAreas from the officer object
//     const workAreas = officer.workAreas || [];

//     // Get statistics
//     const stats = {
//       incidentsReported: await Incident.countDocuments({
//         reportedBy: officer._id,
//       }),
//       safetyTalks: await SafetyTalk.countDocuments({
//         conductedBy: officer._id,
//       }),
//       riskAssessments: await RiskAssessment.countDocuments({
//         assessedBy: officer._id,
//       }),
//       ppeChecks: await PPEChecklist.countDocuments({
//         conductedBy: officer._id,
//       }),
//     };

//     // Get recent activities
//     const recentIncidents = await Incident.find({ reportedBy: officer._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const recentAssessments = await RiskAssessment.find({
//       assessedBy: officer._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const recentActivities = [
//       ...recentIncidents.map((i) => ({
//         ...i.toObject(),
//         type: "incident",
//         link: `/safety-officer/incidents/${i._id}`,
//       })),
//       ...recentAssessments.map((a) => ({
//         ...a.toObject(),
//         type: "assessment",
//         link: `/safety-officer/risk-assessments/${a._id}`,
//       })),
//     ].sort((a, b) => b.createdAt - a.createdAt);

//     res.render("safety-officer/dashboard", {
//       user: req.user,
//       officer,
//       assignedWorksites,
//       workAreas, // This will now have the work areas from the officer's array
//       stats,
//       recentActivities,
//     });
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     req.flash("error", "Error loading dashboard");
//     res.redirect("/");
//   }
// };

// // Report Incident
// exports.reportIncident = async (req, res) => {
//   try {
//     const {
//       workAreaId,
//       incidentType,
//       severity,
//       title,
//       description,
//       immediateActions,
//       requiresInvestigation,
//     } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });

//     const incident = new Incident({
//       workArea: workAreaId,
//       type: incidentType,
//       severity,
//       title,
//       description,
//       immediateActions,
//       reportedBy: officer._id,
//       reportedAt: new Date(),
//       status: "reported",
//       requiresInvestigation: requiresInvestigation === "true",
//     });

//     await incident.save();

//     // Update officer stats
//     await SafetyOfficer.findByIdAndUpdate(officer._id, {
//       $inc: { incidentsReported: 1 },
//     });

//     req.flash("success", "Incident reported successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error reporting incident:", error);
//     req.flash("error", "Error reporting incident");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Create Risk Assessment
// exports.createRiskAssessment = async (req, res) => {
//   try {
//     const { workAreaId, activity, hazards, riskLevels, controls } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });

//     const hazardsArray = [];
//     if (hazards) {
//       for (let i = 0; i < hazards.length; i++) {
//         hazardsArray.push({
//           hazard: hazards[i],
//           riskLevel: riskLevels[i],
//           controls: controls[i],
//         });
//       }
//     }

//     const assessment = new RiskAssessment({
//       workArea: workAreaId,
//       activity,
//       hazards: hazardsArray,
//       assessedBy: officer._id,
//       assessmentDate: new Date(),
//       status: "draft",
//     });

//     await assessment.save();

//     req.flash("success", "Risk assessment created successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error creating risk assessment:", error);
//     req.flash("error", "Error creating risk assessment");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Generate Safety Talk
// exports.generateSafetyTalk = async (req, res) => {
//   try {
//     const { workAreaId, topic, focusArea } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });
//     const workArea = await WorkArea.findById(workAreaId).populate("worksite");

//     // Generate AI-powered safety talk content
//     let talkContent = generateSafetyTalkContent(topic, focusArea, workArea);

//     const safetyTalk = new SafetyTalk({
//       workArea: workAreaId,
//       title: topic || `Safety Talk - ${new Date().toLocaleDateString()}`,
//       content: talkContent,
//       focusArea,
//       conductedBy: officer._id,
//       date: new Date(),
//       status: "scheduled",
//     });

//     await safetyTalk.save();

//     req.flash("success", "Safety talk generated successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error generating safety talk:", error);
//     req.flash("error", "Error generating safety talk");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Create PPE Checklist
// exports.createPPEChecklist = async (req, res) => {
//   try {
//     const { workAreaId, shift, ppeItems, observations } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });

//     const checklist = new PPEChecklist({
//       workArea: workAreaId,
//       shift,
//       ppeItems: ppeItems || [],
//       observations,
//       conductedBy: officer._id,
//       date: new Date(),
//       status: "completed",
//     });

//     await checklist.save();

//     req.flash("success", "PPE checklist submitted successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error creating PPE checklist:", error);
//     req.flash("error", "Error creating PPE checklist");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Create Safety Observation
// exports.createObservation = async (req, res) => {
//   try {
//     const { workAreaId, type, description, recommendations } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });

//     const observation = new SafetyObservation({
//       workArea: workAreaId,
//       type,
//       description,
//       recommendations,
//       observedBy: officer._id,
//       date: new Date(),
//     });

//     await observation.save();

//     req.flash("success", "Safety observation recorded successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error creating observation:", error);
//     req.flash("error", "Error creating observation");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Helper function to generate safety talk content
// function generateSafetyTalkContent(topic, focusArea, workArea) {
//   const templates = {
//     general: `Today's safety topic focuses on maintaining a safe work environment at ${workArea?.name || "our work area"}. Remember that safety is everyone's responsibility. Always be aware of your surroundings and report any hazards immediately. Stay vigilant and look out for your colleagues.`,

//     ppe: `Personal Protective Equipment (PPE) is your last line of defense against workplace hazards. Always inspect your PPE before use. Ensure hard hats are not damaged, safety glasses are clean, and gloves are free from tears. Remember: No PPE = No work!`,

//     hazard: `Hazard identification is crucial for preventing incidents. Take 5 minutes before starting any task to identify potential hazards. Ask yourself: What could go wrong? What safeguards are in place? What can I do to make this task safer?`,

//     emergency: `Emergency preparedness saves lives. Know your emergency exits, assembly points, and emergency contacts. If you discover a fire, sound the alarm immediately. Never assume someone else has reported an emergency.`,

//     ergonomics: `Good ergonomics prevent musculoskeletal injuries. Take regular breaks, stretch your muscles, and use proper lifting techniques. Keep your work area organized to avoid trips and falls.`,
//   };

//   return templates[focusArea] || templates.general;
// }

//***********************************************************************//

// // backend/controllers/safetyOfficerController.js
// const Incident = require("../models/Incident");
// const RiskAssessment = require("../models/RiskAssessment");
// const SafetyTalk = require("../models/SafetyTalk");
// const PPEChecklist = require("../models/PPEChecklist");
// const SafetyObservation = require("../models/SafetyObservation");
// const Worksite = require("../models/Worksite");
// const WorkArea = require("../models/WorkArea");
// const SafetyOfficer = require("../models/SafetyOfficer");

// // Show safety officer dashboard - Using officer.workAreas directly
// exports.showDashboard = async (req, res) => {
//   try {
//     // Populate workAreas from the officer's array
//     const officer = await SafetyOfficer.findOne({ user: req.user._id })
//       .populate("worksites")
//       .populate({
//         path: "workAreas",
//         populate: {
//           path: "worksite",
//           select: "name location",
//         },
//       });

//     if (!officer) {
//       req.flash("error", "Safety officer profile not found");
//       return res.redirect("/");
//     }

//     // Get assigned worksites (alternative method for safety)
//     const assignedWorksites = await Worksite.find({
//       "assignedSafetyOfficers.officer": officer._id,
//       "assignedSafetyOfficers.isActive": true,
//     });

//     // Use the populated workAreas from the officer object
//     const workAreas = officer.workAreas || [];

//     // Get statistics
//     const stats = {
//       incidentsReported: await Incident.countDocuments({
//         reportedBy: officer._id,
//       }),
//       safetyTalks: await SafetyTalk.countDocuments({
//         conductedBy: officer._id,
//       }),
//       riskAssessments: await RiskAssessment.countDocuments({
//         assessedBy: officer._id,
//       }),
//       ppeChecks: await PPEChecklist.countDocuments({
//         conductedBy: officer._id,
//       }),
//     };

//     // Get recent activities
//     const recentIncidents = await Incident.find({ reportedBy: officer._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const recentAssessments = await RiskAssessment.find({
//       assessedBy: officer._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     const recentActivities = [
//       ...recentIncidents.map((i) => ({
//         ...i.toObject(),
//         type: "incident",
//         link: `/safety-officer/incidents/${i._id}`,
//       })),
//       ...recentAssessments.map((a) => ({
//         ...a.toObject(),
//         type: "assessment",
//         link: `/safety-officer/risk-assessments/${a._id}`,
//       })),
//     ].sort((a, b) => b.createdAt - a.createdAt);

//     res.render("safety-officer/dashboard", {
//       user: req.user,
//       officer,
//       assignedWorksites,
//       workAreas, // This will have the work areas from the officer's array
//       stats,
//       recentActivities,
//     });
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     req.flash("error", "Error loading dashboard");
//     res.redirect("/");
//   }
// };

// // Report Incident
// exports.reportIncident = async (req, res) => {
//   try {
//     const {
//       workAreaId,
//       incidentType,
//       severity,
//       title,
//       description,
//       immediateActions,
//       requiresInvestigation,
//     } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });

//     const incident = new Incident({
//       workArea: workAreaId,
//       type: incidentType,
//       severity,
//       title,
//       description,
//       immediateActions,
//       reportedBy: officer._id,
//       reportedAt: new Date(),
//       status: "reported",
//       requiresInvestigation: requiresInvestigation === "true",
//     });

//     await incident.save();

//     // Update officer stats
//     await SafetyOfficer.findByIdAndUpdate(officer._id, {
//       $inc: { incidentsReported: 1 },
//     });

//     req.flash("success", "Incident reported successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error reporting incident:", error);
//     req.flash("error", "Error reporting incident");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Create Risk Assessment
// exports.createRiskAssessment = async (req, res) => {
//   try {
//     const { workAreaId, activity, hazards, riskLevels, controls } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });

//     const hazardsArray = [];
//     if (hazards) {
//       for (let i = 0; i < hazards.length; i++) {
//         hazardsArray.push({
//           hazard: hazards[i],
//           riskLevel: riskLevels[i],
//           controls: controls[i],
//         });
//       }
//     }

//     const assessment = new RiskAssessment({
//       workArea: workAreaId,
//       activity,
//       hazards: hazardsArray,
//       assessedBy: officer._id,
//       assessmentDate: new Date(),
//       status: "draft",
//     });

//     await assessment.save();

//     req.flash("success", "Risk assessment created successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error creating risk assessment:", error);
//     req.flash("error", "Error creating risk assessment");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Generate Safety Talk
// exports.generateSafetyTalk = async (req, res) => {
//   try {
//     const { workAreaId, topic, focusArea } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });
//     const workArea = await WorkArea.findById(workAreaId).populate("worksite");

//     // Generate AI-powered safety talk content
//     let talkContent = generateSafetyTalkContent(topic, focusArea, workArea);

//     const safetyTalk = new SafetyTalk({
//       workArea: workAreaId,
//       title: topic || `Safety Talk - ${new Date().toLocaleDateString()}`,
//       content: talkContent,
//       focusArea,
//       conductedBy: officer._id,
//       date: new Date(),
//       status: "scheduled",
//     });

//     await safetyTalk.save();

//     req.flash("success", "Safety talk generated successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error generating safety talk:", error);
//     req.flash("error", "Error generating safety talk");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Create PPE Checklist
// exports.createPPEChecklist = async (req, res) => {
//   try {
//     const { workAreaId, shift, ppeItems, observations } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });

//     const checklist = new PPEChecklist({
//       workArea: workAreaId,
//       shift,
//       ppeItems: ppeItems || [],
//       observations,
//       conductedBy: officer._id,
//       date: new Date(),
//       status: "completed",
//     });

//     await checklist.save();

//     req.flash("success", "PPE checklist submitted successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error creating PPE checklist:", error);
//     req.flash("error", "Error creating PPE checklist");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Create Safety Observation
// exports.createObservation = async (req, res) => {
//   try {
//     const { workAreaId, type, description, recommendations } = req.body;

//     const officer = await SafetyOfficer.findOne({ user: req.user._id });

//     const observation = new SafetyObservation({
//       workArea: workAreaId,
//       type,
//       description,
//       recommendations,
//       observedBy: officer._id,
//       date: new Date(),
//     });

//     await observation.save();

//     req.flash("success", "Safety observation recorded successfully");
//     res.redirect("/safety-officer/dashboard");
//   } catch (error) {
//     console.error("Error creating observation:", error);
//     req.flash("error", "Error creating observation");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Get work area details for safety officer
// exports.getWorkArea = async (req, res) => {
//   try {
//     const workArea = await WorkArea.findById(req.params.id)
//       .populate("worksite", "name location")
//       .populate("assignedSafetyOfficers.officer", "name email")
//       .populate("activePermits");

//     if (!workArea) {
//       req.flash("error", "Work area not found");
//       return res.redirect("/safety-officer/dashboard");
//     }

//     // Verify the safety officer is assigned to this work area
//     const officer = await SafetyOfficer.findOne({ user: req.user._id });
//     const isAssigned = officer.workAreas?.some(
//       (id) => id.toString() === workArea._id.toString(),
//     );

//     if (!isAssigned && req.user.role !== "system_admin") {
//       req.flash("error", "You don't have access to this work area");
//       return res.redirect("/safety-officer/dashboard");
//     }

//     // Get recent incidents
//     const recentIncidents = await Incident.find({ workArea: workArea._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     // Get active risk assessments
//     const activeAssessments = await RiskAssessment.find({
//       workArea: workArea._id,
//       status: "active",
//     }).limit(5);

//     // Get all risk assessments
//     const riskAssessments = await RiskAssessment.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // Get safety talks
//     const safetyTalks = await SafetyTalk.find({
//       workArea: workArea._id,
//     })
//       .sort({ date: -1 })
//       .limit(10);

//     // Get permits
//     const permits = await Permit.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // Get JSA
//     const JSA = require("../models/JSA");
//     const jsa = await JSA.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     // Get PPE Checklists
//     const PPEChecklist = require("../models/PPEChecklist");
//     const ppeChecklists = await PPEChecklist.find({
//       workArea: workArea._id,
//     })
//       .sort({ createdAt: -1 })
//       .limit(10);

//     res.render("safety-officer/work-area-view", {
//       user: req.user,
//       workArea,
//       recentIncidents,
//       activeAssessments,
//       riskAssessments,
//       safetyTalks,
//       permits,
//       jsa,
//       ppeChecklists,
//     });
//   } catch (error) {
//     console.error("Error viewing work area:", error);
//     req.flash("error", "Error loading work area");
//     res.redirect("/safety-officer/dashboard");
//   }
// };

// // Helper function to generate safety talk content
// function generateSafetyTalkContent(topic, focusArea, workArea) {
//   const templates = {
//     general: `Today's safety topic focuses on maintaining a safe work environment at ${workArea?.name || "our work area"}. Remember that safety is everyone's responsibility. Always be aware of your surroundings and report any hazards immediately. Stay vigilant and look out for your colleagues.`,

//     ppe: `Personal Protective Equipment (PPE) is your last line of defense against workplace hazards. Always inspect your PPE before use. Ensure hard hats are not damaged, safety glasses are clean, and gloves are free from tears. Remember: No PPE = No work!`,

//     hazard: `Hazard identification is crucial for preventing incidents. Take 5 minutes before starting any task to identify potential hazards. Ask yourself: What could go wrong? What safeguards are in place? What can I do to make this task safer?`,

//     emergency: `Emergency preparedness saves lives. Know your emergency exits, assembly points, and emergency contacts. If you discover a fire, sound the alarm immediately. Never assume someone else has reported an emergency.`,

//     ergonomics: `Good ergonomics prevent musculoskeletal injuries. Take regular breaks, stretch your muscles, and use proper lifting techniques. Keep your work area organized to avoid trips and falls.`,
//   };

//   return templates[focusArea] || templates.general;
// }

// backend/controllers/safetyOfficerController.js
const Incident = require("../models/Incident");
const RiskAssessment = require("../models/RiskAssessment");
const SafetyTalk = require("../models/SafetyTalk");
const PPEChecklist = require("../models/PPEChecklist");
const SafetyObservation = require("../models/SafetyObservation");
const Worksite = require("../models/Worksite");
const WorkArea = require("../models/WorkArea");
const SafetyOfficer = require("../models/SafetyOfficer");
const Permit = require("../models/Permit");

// Show safety officer dashboard
exports.showDashboard = async (req, res) => {
  try {
    // First find the safety officer profile
    const officer = await SafetyOfficer.findOne({ user: req.user._id });

    if (!officer) {
      req.flash("error", "Safety officer profile not found");
      return res.redirect("/");
    }

    // Get worksites assigned to this officer - populate the worksites
    const assignedWorksites = await Worksite.find({
      "assignedSafetyOfficers.officer": officer._id,
      "assignedSafetyOfficers.isActive": true,
    }).populate("assignedSafetyOfficers.officer", "name email");

    // Get work areas - TWO METHODS to ensure we get all assigned areas
    let workAreas = [];

    // Method 1: Get work areas directly from the officer's workAreas array (populated)
    if (officer.workAreas && officer.workAreas.length > 0) {
      workAreas = await WorkArea.find({
        _id: { $in: officer.workAreas },
      }).populate("worksite", "name location");
    }

    // Method 2: Also check for work areas where officer is in assignedSafetyOfficers
    const assignedWorkAreas = await WorkArea.find({
      "assignedSafetyOfficers.officer": officer._id,
      "assignedSafetyOfficers.isActive": true,
    }).populate("worksite", "name location");

    // Merge both sources and remove duplicates
    const allWorkAreas = [...workAreas, ...assignedWorkAreas];
    const uniqueWorkAreas = [];
    const seenIds = new Set();

    for (const area of allWorkAreas) {
      if (!seenIds.has(area._id.toString())) {
        seenIds.add(area._id.toString());
        uniqueWorkAreas.push(area);
      }
    }

    workAreas = uniqueWorkAreas;

    // Get statistics
    const stats = {
      incidentsReported: await Incident.countDocuments({
        reportedBy: officer._id,
      }),
      safetyTalks: await SafetyTalk.countDocuments({
        conductedBy: officer._id,
      }),
      riskAssessments: await RiskAssessment.countDocuments({
        assessedBy: officer._id,
      }),
      ppeChecks: await PPEChecklist.countDocuments({
        conductedBy: officer._id,
      }),
    };

    // Get recent activities
    const recentIncidents = await Incident.find({ reportedBy: officer._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAssessments = await RiskAssessment.find({
      assessedBy: officer._id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivities = [
      ...recentIncidents.map((i) => ({
        ...i.toObject(),
        type: "incident",
        link: `/safety-officer/incidents/${i._id}`,
        description: i.title || i.description,
        createdAt: i.createdAt,
      })),
      ...recentAssessments.map((a) => ({
        ...a.toObject(),
        type: "assessment",
        link: `/safety-officer/risk-assessments/${a._id}`,
        description: a.title || a.activity,
        createdAt: a.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render("safety-officer/dashboard", {
      user: req.user,
      officer,
      assignedWorksites,
      workAreas,
      stats,
      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/");
  }
};

// Report Incident
exports.reportIncident = async (req, res) => {
  try {
    const {
      workAreaId,
      incidentType,
      severity,
      title,
      description,
      immediateActions,
      requiresInvestigation,
    } = req.body;

    const officer = await SafetyOfficer.findOne({ user: req.user._id });

    const incident = new Incident({
      workArea: workAreaId,
      type: incidentType,
      severity,
      title,
      description,
      immediateActions,
      reportedBy: officer._id,
      reportedAt: new Date(),
      status: "reported",
      requiresInvestigation: requiresInvestigation === "true",
    });

    await incident.save();

    // Update officer stats
    await SafetyOfficer.findByIdAndUpdate(officer._id, {
      $inc: { incidentsReported: 1 },
    });

    req.flash("success", "Incident reported successfully");
    res.redirect("/safety-officer/dashboard");
  } catch (error) {
    console.error("Error reporting incident:", error);
    req.flash("error", "Error reporting incident");
    res.redirect("/safety-officer/dashboard");
  }
};

// Create Risk Assessment
exports.createRiskAssessment = async (req, res) => {
  try {
    const { workAreaId, activity, hazards, riskLevels, controls } = req.body;

    const officer = await SafetyOfficer.findOne({ user: req.user._id });

    const hazardsArray = [];
    if (hazards) {
      for (let i = 0; i < hazards.length; i++) {
        hazardsArray.push({
          hazard: hazards[i],
          riskLevel: riskLevels[i],
          controls: controls[i],
        });
      }
    }

    const assessment = new RiskAssessment({
      workArea: workAreaId,
      activity,
      hazards: hazardsArray,
      assessedBy: officer._id,
      assessmentDate: new Date(),
      status: "draft",
    });

    await assessment.save();

    req.flash("success", "Risk assessment created successfully");
    res.redirect("/safety-officer/dashboard");
  } catch (error) {
    console.error("Error creating risk assessment:", error);
    req.flash("error", "Error creating risk assessment");
    res.redirect("/safety-officer/dashboard");
  }
};

// Generate Safety Talk
exports.generateSafetyTalk = async (req, res) => {
  try {
    const { workAreaId, topic, focusArea } = req.body;

    const officer = await SafetyOfficer.findOne({ user: req.user._id });
    const workArea = await WorkArea.findById(workAreaId).populate("worksite");

    // Generate AI-powered safety talk content
    let talkContent = generateSafetyTalkContent(topic, focusArea, workArea);

    const safetyTalk = new SafetyTalk({
      workArea: workAreaId,
      title: topic || `Safety Talk - ${new Date().toLocaleDateString()}`,
      content: talkContent,
      focusArea,
      conductedBy: officer._id,
      date: new Date(),
      status: "scheduled",
    });

    await safetyTalk.save();

    req.flash("success", "Safety talk generated successfully");
    res.redirect("/safety-officer/dashboard");
  } catch (error) {
    console.error("Error generating safety talk:", error);
    req.flash("error", "Error generating safety talk");
    res.redirect("/safety-officer/dashboard");
  }
};

// Create PPE Checklist
exports.createPPEChecklist = async (req, res) => {
  try {
    const { workAreaId, shift, ppeItems, observations } = req.body;

    const officer = await SafetyOfficer.findOne({ user: req.user._id });

    const checklist = new PPEChecklist({
      workArea: workAreaId,
      shift,
      ppeItems: ppeItems || [],
      observations,
      conductedBy: officer._id,
      date: new Date(),
      status: "completed",
    });

    await checklist.save();

    req.flash("success", "PPE checklist submitted successfully");
    res.redirect("/safety-officer/dashboard");
  } catch (error) {
    console.error("Error creating PPE checklist:", error);
    req.flash("error", "Error creating PPE checklist");
    res.redirect("/safety-officer/dashboard");
  }
};

// Create Safety Observation
exports.createObservation = async (req, res) => {
  try {
    const { workAreaId, type, description, recommendations } = req.body;

    const officer = await SafetyOfficer.findOne({ user: req.user._id });

    const observation = new SafetyObservation({
      workArea: workAreaId,
      type,
      description,
      recommendations,
      observedBy: officer._id,
      date: new Date(),
    });

    await observation.save();

    req.flash("success", "Safety observation recorded successfully");
    res.redirect("/safety-officer/dashboard");
  } catch (error) {
    console.error("Error creating observation:", error);
    req.flash("error", "Error creating observation");
    res.redirect("/safety-officer/dashboard");
  }
};

// Get work area details for safety officer
exports.getWorkArea = async (req, res) => {
  try {
    const workArea = await WorkArea.findById(req.params.id)
      .populate("worksite", "name location")
      .populate("assignedSafetyOfficers.officer", "name email")
      .populate("activePermits");

    if (!workArea) {
      req.flash("error", "Work area not found");
      return res.redirect("/safety-officer/dashboard");
    }

    // Verify the safety officer is assigned to this work area
    const officer = await SafetyOfficer.findOne({ user: req.user._id });
    const isAssigned =
      officer.workAreas?.some(
        (id) => id.toString() === workArea._id.toString(),
      ) ||
      workArea.assignedSafetyOfficers?.some(
        (a) =>
          a.officer.toString() === officer._id.toString() &&
          a.isActive !== false,
      );

    if (
      !isAssigned &&
      req.user.role !== "enterprise_admin" &&
      req.user.role !== "system_admin"
    ) {
      req.flash("error", "You don't have access to this work area");
      return res.redirect("/safety-officer/dashboard");
    }

    // Get recent incidents
    const recentIncidents = await Incident.find({ workArea: workArea._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get active risk assessments
    const activeAssessments = await RiskAssessment.find({
      workArea: workArea._id,
      status: "active",
    }).limit(5);

    // Get all risk assessments
    const riskAssessments = await RiskAssessment.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get safety talks
    const safetyTalks = await SafetyTalk.find({
      workArea: workArea._id,
    })
      .sort({ date: -1 })
      .limit(10);

    // Get permits
    const permits = await Permit.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get JSA
    const JSA = require("../models/JSA");
    const jsa = await JSA.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get PPE Checklists
    const ppeChecklists = await PPEChecklist.find({
      workArea: workArea._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.render("safety-officer/work-area-view", {
      user: req.user,
      workArea,
      recentIncidents,
      activeAssessments,
      riskAssessments,
      safetyTalks,
      permits,
      jsa,
      ppeChecklists,
    });
  } catch (error) {
    console.error("Error viewing work area:", error);
    req.flash("error", "Error loading work area");
    res.redirect("/safety-officer/dashboard");
  }
};

// Helper function to generate safety talk content
function generateSafetyTalkContent(topic, focusArea, workArea) {
  const templates = {
    general: `Today's safety topic focuses on maintaining a safe work environment at ${workArea?.name || "our work area"}. Remember that safety is everyone's responsibility. Always be aware of your surroundings and report any hazards immediately. Stay vigilant and look out for your colleagues.`,

    ppe: `Personal Protective Equipment (PPE) is your last line of defense against workplace hazards. Always inspect your PPE before use. Ensure hard hats are not damaged, safety glasses are clean, and gloves are free from tears. Remember: No PPE = No work!`,

    hazard: `Hazard identification is crucial for preventing incidents. Take 5 minutes before starting any task to identify potential hazards. Ask yourself: What could go wrong? What safeguards are in place? What can I do to make this task safer?`,

    emergency: `Emergency preparedness saves lives. Know your emergency exits, assembly points, and emergency contacts. If you discover a fire, sound the alarm immediately. Never assume someone else has reported an emergency.`,

    ergonomics: `Good ergonomics prevent musculoskeletal injuries. Take regular breaks, stretch your muscles, and use proper lifting techniques. Keep your work area organized to avoid trips and falls.`,
  };

  return templates[focusArea] || templates.general;
}
