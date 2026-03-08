const { validationResult } = require("express-validator");

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map((error) => error.msg);

    // Handle based on request type
    if (req.path.includes("/api/")) {
      return res.status(400).json({ errors: errorMessages });
    } else {
      req.flash("error", errorMessages[0]);
      return res.redirect("back");
    }
  };
};

module.exports = validate;
