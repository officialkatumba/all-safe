function hasUnsafeKey(value) {
  if (!value || typeof value !== "object") return false;

  return Object.entries(value).some(([key, nestedValue]) => {
    return key.startsWith("$") || key.includes(".") || hasUnsafeKey(nestedValue);
  });
}

function rejectUnsafeKeys(req, res, next) {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query)) {
    return res.status(400).send("Invalid request");
  }

  return next();
}

module.exports = { rejectUnsafeKeys };
