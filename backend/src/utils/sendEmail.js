const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    logger: true,
    debug: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    console.log("Attempting to send email...");

    const info = await transporter.sendMail({
      from: `"Mood Reflection App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("EMAIL SENT:", info.messageId);
  } catch (error) {
    console.error("EMAIL ERROR NAME:", error.name);
    console.error("EMAIL ERROR CODE:", error.code);
    console.error("EMAIL ERROR MESSAGE:", error.message);
    throw error;
  }
};

module.exports = sendEmail;