const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const authMiddleware = require("../middleware/auth"); // middleware ko alag file se import

// Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// 🔹 Email verification route
router.get("/verify/:token", authController.verifyEmail);

// Example protected route
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: `Welcome ${req.user.role}`, user: req.user });
});

module.exports = router;
