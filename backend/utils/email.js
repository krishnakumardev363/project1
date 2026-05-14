import nodemailer from "nodemailer";

const getTransporter = () => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("MAIL_USER or MAIL_PASS is not set in .env");
  }
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

const baseTemplate = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family: 'Segoe UI', sans-serif; }
    .wrap { max-width:480px; margin:40px auto; background:#1e293b; border-radius:16px; overflow:hidden; border:1px solid #334155; }
    .header { background:#0d9488; padding:28px 32px; }
    .header h1 { margin:0; color:#f0fdf9; font-size:20px; font-weight:600; }
    .body { padding:32px; }
    .body p { color:#94a3b8; font-size:14px; line-height:1.6; margin:0 0 20px; }
    .otp-box { background:#0f172a; border:1px solid #334155; border-radius:12px; padding:20px; text-align:center; margin:24px 0; }
    .otp { font-size:36px; font-weight:700; letter-spacing:12px; color:#14b8a6; font-family:monospace; }
    .expires { color:#64748b; font-size:12px; margin-top:8px; }
    .footer { padding:20px 32px; border-top:1px solid #334155; text-align:center; }
    .footer p { color:#475569; font-size:12px; margin:0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header"><h1>NoteNest</h1></div>
    <div class="body">
      <p style="color:#e2e8f0;font-size:16px;font-weight:500;margin-bottom:8px;">${title}</p>
      ${body}
    </div>
    <div class="footer"><p>If you didn't request this, you can safely ignore this email.</p></div>
  </div>
</body>
</html>`;

export const sendOTPEmail = async ({ to, name, otp, type }) => {
  const transporter = getTransporter();

  const isReset = type === "reset";
  const title = isReset ? "Reset your password" : "Verify your email";
  const intro = isReset
    ? `Hi <strong style="color:#e2e8f0">${name}</strong>, use this OTP to reset your password.`
    : `Hi <strong style="color:#e2e8f0">${name}</strong>, thanks for signing up! Use this OTP to verify your email.`;

  const expires = Number(process.env.OTP_EXPIRES_MINUTES) || 10;

  const body = `
    <p>${intro}</p>
    <div class="otp-box">
      <div class="otp">${otp}</div>
      <div class="expires">Expires in ${expires} minutes</div>
    </div>
    <p>Enter this code on the verification page. Do not share it with anyone.</p>`;

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || `NoteNest <${process.env.MAIL_USER}>`,
    to,
    subject: isReset ? "Your password reset OTP" : "Verify your email — OTP",
    html: baseTemplate(title, body),
  });

  console.log(`📧 OTP email sent to ${to} | messageId: ${info.messageId}`);
  return info;
};
