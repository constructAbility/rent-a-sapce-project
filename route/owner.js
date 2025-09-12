const express = require("express");
const router = express.Router();
const ownerController = require("../controller/ownerController");
const authMiddleware = require("../middleware/auth");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Add property
router.post("/add", authMiddleware, upload.array("photos", 5), ownerController.addProperty);

// Get owner's properties
router.get("/my-properties", authMiddleware, ownerController.getOwnerProperties);

module.exports = router;
