const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../util/mail");

// Function to generate unique ID
function generateUniqueId(role) {
  // Example: OWNER-1234 or USER-5678
  const prefix = role.toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

// 🔹 Register User/Owner
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPass = await bcrypt.hash(password, 10);

    let uniqueId;
    let isUnique = false;

    // Ensure uniqueId is not duplicate
    while (!isUnique) {
      uniqueId = generateUniqueId(role);
      const exists = await User.findOne({ uniqueId });
      if (!exists) isUnique = true;
    }

    const newUser = new User({
      uniqueId,
      name,
      email,
      password: hashedPass,
      role,
    });

    await newUser.save();

    // Verification token
    const verifyToken = jwt.sign(
      { id: newUser._id },
      process.env.VERIFY_SECRET || "VERIFY_SECRET",
      { expiresIn: "1d" }
    );
    const verifyLink = `${process.env.BASE_URL || "http://localhost:5000"}/api/auth/verify/${verifyToken}`;

    await sendEmail(
      email,
      "Verify your email",
      `<h2>Hello ${name}</h2>
       <p>Please verify your email by clicking the link below:</p>
       <a href="${verifyLink}">${verifyLink}</a>`
    );

    res.status(201).json({
      message: "Registered successfully. Please check your email to verify.",
      uniqueId,
    });
  } catch (err) {
    res.status(500).json({ message: "Error in register", error: err.message });
  }
};

// 🔹 Email verification
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(
      token,
      process.env.VERIFY_SECRET || "VERIFY_SECRET"
    );

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.json({ message: "Email already verified!" });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully! You can now login." });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// 🔹 Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Please verify your email first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login success",
      token,
      role: user.role,
      uniqueId: user.uniqueId,
    });
  } catch (err) {
    res.status(500).json({ message: "Error in login", error: err.message });
  }
};
