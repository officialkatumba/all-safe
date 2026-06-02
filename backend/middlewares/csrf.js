const crypto = require("crypto");

function ensureCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function verifyCsrfToken(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const expected = req.session.csrfToken;
  const supplied = req.get("x-csrf-token") || req.body?._csrf;

  if (
    expected &&
    supplied &&
    expected.length === supplied.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
  ) {
    return next();
  }

  return res.status(403).send("Invalid or missing CSRF token");
}

module.exports = { ensureCsrfToken, verifyCsrfToken };
