const UsageEvent = require("../models/UsageEvent");

async function trackUsage({
  company,
  user,
  worksite,
  workArea,
  eventType,
  module,
  description,
  relatedModel,
  relatedId,
  metadata,
}) {
  try {
    await UsageEvent.create({
      company,
      user,
      worksite,
      workArea,
      eventType,
      module,
      description,
      relatedModel,
      relatedId,
      metadata,
    });
  } catch (error) {
    console.error("Usage tracking failed:", error.message);
  }
}

module.exports = { trackUsage };
