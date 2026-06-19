const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Mood Reflection App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("EMAIL SENT:", info.messageId);
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};

module.exports = sendEmail;