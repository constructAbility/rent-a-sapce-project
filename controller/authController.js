const User = require("../model/user");
const bcrypt = require("bcryptjs");
const sendEmail = require("../util/sendEmail");


function generateUniqueId(role) {
  const prefix = role.toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPass = await bcrypt.hash(password, 10);
    const uniqueId = generateUniqueId(role);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = new User({
      uniqueId,
      name,
      email,
      password: hashedPass,
      role,
      otp,
      otpExpires,
    });

    await newUser.save();

    await sendEmail(
      email,
      "Verify your email with OTP",
      `<h2>Hello ${name},</h2>
       <p>Your verification OTP is:</p>
       <h1>${otp}</h1>
       <p>This OTP will expire in 10 minutes.</p>`
    );

    res.status(201).json({
      message: "Registered successfully. Please check your email for OTP to verify your account.",
      uniqueId,
    });
  } catch (err) {
    res.status(500).json({ message: "Error in register", error: err.message });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully via OTP!" });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(
      email,
      "Your OTP Code",
      `<h2>Hello ${user.name}</h2>
       <p>Your new OTP is:</p>
       <h1>${otp}</h1>
       <p>This OTP will expire in 10 minutes.</p>`
    );

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to resend OTP", error: err.message });
  }
};

// Login (unchanged from your original code, but ensures user is verified)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "1d" });

    res.json({ message: "Login success", token, role: user.role, uniqueId: user.uniqueId });
  } catch (err) {
    res.status(500).json({ message: "Error in login", error: err.message });
  }
};

// Request password reset via OTP
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(
      email,
      "Password Reset OTP",
      `<h2>Hello ${user.name}</h2>
       <p>Your OTP to reset your password is:</p>
       <h1>${otp}</h1>
       <p>This OTP will expire in 10 minutes.</p>`
    );

    res.json({ message: "OTP sent to your email for password reset." });
  } catch (err) {
    res.status(500).json({ message: "Error sending password reset OTP", error: err.message });
  }
};


// Reset password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpires < Date.now()) return res.status(400).json({ message: "OTP expired" });

    const hashedPass = await bcrypt.hash(newPassword, 10);
    user.password = hashedPass;

    // Invalidate OTP
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password", error: err.message });
  }
};
