// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/forgot-password/verify', authController.resetPassword);
module.exports = router;
