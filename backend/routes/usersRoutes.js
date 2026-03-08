const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Login routes
router.get("/login", userController.showLoginForm);
router.post("/login", userController.loginUser);

// Logout route
router.get("/logout", userController.logoutUser);

// Password change routes
router.get("/change-password", userController.showChangePasswordForm);
router.post("/change-password", userController.changePassword);

// Forgot password routes
router.get("/forgot-password", userController.showForgotForm);
router.post("/forgot-password", userController.requestResetPassword);

// Reset password routes
router.get("/reset-password/:token", userController.showResetForm);
router.post("/reset-password/:token", userController.resetPassword);

module.exports = router;
