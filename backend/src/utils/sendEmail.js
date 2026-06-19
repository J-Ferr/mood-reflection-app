const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from: "Mood Reflection App <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("RESEND ERROR:", error);
    throw error;
  }

  console.log("RESEND EMAIL SENT:", data);
};

module.exports = sendEmail;