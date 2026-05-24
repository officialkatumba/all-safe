const express = require("express");
const router = express.Router();
const systemOwnerController = require("../controllers/systemOwnerController");

router.get(
  "/dashboard",
  systemOwnerController.ensureSystemOwner,
  systemOwnerController.dashboard,
);

module.exports = router;
