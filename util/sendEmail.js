// utils/sendEmail.js
const nodemailer = require("nodemailer");

async function sendEmail(to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password REQUIRED
      },
    });

    const info = await transporter.sendMail({
      from: `"SSA Enterprises" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to} (messageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error("❌ Email send error:", err.message || err);
    throw err;
  }
}

module.exports = sendEmail;
