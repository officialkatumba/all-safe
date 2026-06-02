const { OpenAI } = require("openai");
const { AI_MODEL } = require("./aiConfig");
const { trackUsage } = require("./usageTracker");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseStructuredJson(text) {
  const cleaned = String(text || "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw error;
    return JSON.parse(match[0]);
  }
}

function validateReviewComments(value) {
  const comments = String(value || "").trim();

  if (!comments) {
    throw new Error("Enter safety officer comments before regenerating");
  }

  if (comments.length > 4000) {
    throw new Error("Safety officer comments must be 4000 characters or fewer");
  }

  return comments;
}

function ensureReviewable(record) {
  if (record.officerReview?.status === "approved") {
    throw new Error("This document has already been approved");
  }
}

function isApproved(record) {
  return record.officerReview?.status === "approved";
}

async function trackAiCompletion({
  completion,
  user,
  workArea,
  module,
  description,
  relatedModel,
  relatedId,
  maxTokens,
}) {
  await trackUsage({
    user,
    workArea,
    eventType: "ai_generation",
    module,
    description,
    relatedModel,
    relatedId,
    metadata: {
      model: AI_MODEL,
      maxTokens,
      usage: completion.usage,
    },
  });
}

async function regenerateStructuredOutput({
  currentOutput,
  comments,
  documentType,
  maxTokens,
  user,
  workArea,
  relatedModel,
  relatedId,
  extraInstructions = "",
}) {
  const reviewComments = validateReviewComments(comments);
  const prompt = `You are revising a professional ${documentType} after a safety officer review.

CURRENT STRUCTURED OUTPUT:
${JSON.stringify(currentOutput, null, 2)}

SAFETY OFFICER COMMENTS:
${reviewComments}

YOUR TASK:
Apply the officer's comments accurately. Preserve useful content and the exact JSON keys, value types, enum values, structure, style, and operational purpose of the current output. Do not add commentary outside the JSON. Do not mention the revision process in the final document.
${extraInstructions}

Return ONLY valid JSON with the same structure as CURRENT STRUCTURED OUTPUT.`;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.35,
    max_tokens: maxTokens,
  });

  await trackUsage({
    user,
    workArea,
    eventType: "ai_generation",
    module: relatedModel,
    description: `${documentType} regenerated with safety officer comments`,
    relatedModel,
    relatedId,
    metadata: {
      model: AI_MODEL,
      maxTokens,
      usage: completion.usage,
      action: "officer_review_regeneration",
    },
  });

  return {
    comments: reviewComments,
    output: parseStructuredJson(completion.choices[0].message.content),
  };
}

function recordRevision(record, { comments, previousOutput, submittedBy }) {
  const nextVersion = (record.version || 1) + 1;

  record.previousVersions.push({
    version: record.version || 1,
    output: previousOutput,
    officerComments: comments,
    generatedAt: record.updatedAt || record.createdAt || new Date(),
  });
  record.version = nextVersion;
  record.officerReview.status = "revised";
  record.officerReview.history.push({
    comments,
    submittedBy,
    submittedAt: new Date(),
    generatedVersion: nextVersion,
  });

  return nextVersion;
}

function approveReviewedDocument(record, userId) {
  if (!record.officerReview?.history?.length) {
    throw new Error("Regenerate the document with safety officer comments before approval");
  }

  record.officerReview.status = "approved";
  record.officerReview.approvedBy = userId;
  record.officerReview.approvedAt = new Date();
}

module.exports = {
  approveReviewedDocument,
  ensureReviewable,
  isApproved,
  recordRevision,
  regenerateStructuredOutput,
  trackAiCompletion,
  validateReviewComments,
};
