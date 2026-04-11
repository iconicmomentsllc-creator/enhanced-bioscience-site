import nodemailer from "nodemailer";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

export function getAccessRequestRecipient() {
  return (
    process.env.ACCESS_REQUEST_TO?.trim() ||
    "enhancedbioscience@gmail.com"
  );
}

function getFromAddress() {
  const from = process.env.SMTP_FROM?.trim();
  if (from) return from;
  return process.env.SMTP_USER;
}

export async function sendAccessRequestEmail({ name, email, message }) {
  const to = getAccessRequestRecipient();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = message ? escapeHtml(message) : "";

  const html = `
 <h2>New catalog access request</h2>
    <p><strong>Name:</strong> ${safeName}</p>
    <p><strong>Email:</strong> ${safeEmail}</p>
    ${
      safeMessage
        ? `<p><strong>Message:</strong></p><p style="white-space:pre-wrap">${safeMessage}</p>`
        : ""
    }
    <hr />
    <p style="color:#666;font-size:12px">Reply to this person to send their access code.</p>
  `.trim();

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    replyTo: email,
    subject: `Catalog access request — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n${message ? `Message:\n${message}\n` : ""}`,
    html,
  });
}
