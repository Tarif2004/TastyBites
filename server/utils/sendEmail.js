import nodemailer from "nodemailer";

/* =========================================
   EMAIL DISPATCH UTILITY
========================================= */

const createTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
};

export const sendEmailOtp = async ({ to, otp, purpose }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || '"TastyBites 90" <noreply@tastybites.com>';
  const subject = `Your TastyBites 90 Verification Code: ${otp}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin: 0; font-size: 24px;">🍔 TastyBites 90</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Email Account Verification</p>
      </div>

      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; color: #9f1239; font-size: 14px; font-weight: bold;">Your Verification Code is:</p>
        <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #be123c;">${otp}</span>
        <p style="margin: 10px 0 0 0; color: #9f1239; font-size: 12px;">Valid for 10 minutes. Do not share this code with anyone.</p>
      </div>

      <p style="color: #475569; font-size: 13px; line-height: 1.5;">If you did not request this email verification code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">© ${new Date().getFullYear()} TastyBites 90 Gastropub. All rights reserved.</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[SMTP-EMAIL-SENT] OTP sent to ${to}`);
    return { isSent: true, demoMode: false };
  } else {
    console.log(`\n=================================================`);
    console.log(`[DEV-MODE EMAIL OTP] Target Email: ${to}`);
    console.log(`[DEV-MODE EMAIL OTP] Verification OTP Code: ${otp}`);
    console.log(`=================================================\n`);
    return { isSent: true, demoMode: true, demoOtp: otp };
  }
};
