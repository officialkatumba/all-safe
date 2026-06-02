const AI_MODEL = "gpt-4o-mini";

const AI_MAX_TOKENS = {
  safetyTalk: 1200,
  ppeChecklist: 2400,
  trainingRequirement: 2800,
  permit: 3200,
  environmentalAssessment: 3800,
  safetyInsight: 2800,
  emergencyProtocol: 3400,
  safetyAuditQuestions: 4000,
  safetyAuditFinal: 4500,
  ohsComplianceFinal: 5000,
  riskAssessmentSection: 2200,
  jsaSection: 2200,
};

module.exports = { AI_MODEL, AI_MAX_TOKENS };
