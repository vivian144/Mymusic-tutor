const nodemailer = require('nodemailer');

const isDev = process.env.NODE_ENV !== 'production';

const getTransporter = () => {
  if (isDev) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (isDev) {
    console.log(`[Email DEV] to=${to} | subject=${subject}\n  ${text || html}\n`);
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `MyMusic Tutor <noreply@mymusictutor.in>`,
    to,
    subject,
    html,
    text
  });
};

const sendVerificationEmail = async (toEmail, verifyUrl) => {
  await sendEmail({
    to: toEmail,
    subject: 'Verify your MyMusic Tutor email',
    html: `
      <p>Hi there!</p>
      <p>Please verify your email address by clicking the link below. This link expires in 24 hours.</p>
      <p><a href="${verifyUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email</a></p>
      <p>Or copy this URL into your browser:<br>${verifyUrl}</p>
      <p>If you didn't create a MyMusic Tutor account, you can safely ignore this email.</p>
      <p>— MyMusic Tutor Team</p>
    `,
    text: `Verify your MyMusic Tutor email\n\nClick this link (expires in 24 hours):\n${verifyUrl}\n\nIf you didn't create an account, ignore this email.`
  });
};

const sendPasswordChangedEmail = async (toEmail, fullName) => {
  await sendEmail({
    to: toEmail,
    subject: 'Your MyMusic Tutor password was changed',
    html: `
      <p>Hi ${fullName},</p>
      <p>Your MyMusic Tutor account password was successfully reset.</p>
      <p>If you did not request this change, please contact support immediately.</p>
      <p>— MyMusic Tutor Team</p>
    `,
    text: `Hi ${fullName},\n\nYour MyMusic Tutor password was successfully reset.\nIf you did not request this, contact support immediately.\n\n— MyMusic Tutor Team`
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordChangedEmail };
