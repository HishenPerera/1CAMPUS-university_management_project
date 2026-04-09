const nodemailer = require("nodemailer");

// SendGrid SMTP transporter
// Free: 100 emails/day — works on localhost — sends to ANY real email
// Setup: https://sendgrid.com → Create API Key → Verify a single sender email
// SMTP username is ALWAYS the literal word "apikey" (not your email)
// SMTP password is your SendGrid API key (starts with SG.)
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",                         // ALWAYS this literal string
    pass: process.env.SENDGRID_API_KEY,     // Your SG.xxxx key from SendGrid dashboard
  },
});

/**
 * Sends the enrollment welcome email to a newly enrolled student.
 *
 * @param {Object} params
 * @param {string} params.toEmail          - The student's personal email from the application
 * @param {string} params.studentName      - Full name of the student
 * @param {string} params.portalEmail      - Generated 1CAMPUS portal login email
 * @param {string} params.tempPassword     - Generated temporary password
 * @param {string} params.regNumber        - Student registration number
 * @param {string} params.degreeProgram    - Degree programme name
 */
const sendEnrollmentEmail = async ({
  toEmail,
  studentName,
  portalEmail,
  tempPassword,
  regNumber,
  degreeProgram,
}) => {
  const year = new Date().getFullYear();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to 1CAMPUS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; }
    .wrapper { max-width: 620px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 40px 32px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; letter-spacing: 1px; }
    .header p { color: #a8c6fa; font-size: 14px; margin-top: 6px; }
    .badge { display: inline-block; background: linear-gradient(90deg, #e94560, #f5a623); color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 5px 16px; border-radius: 20px; margin-top: 16px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px; }
    .text { font-size: 15px; color: #4a5568; line-height: 1.7; margin-bottom: 20px; }
    .credentials-box { background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%); border: 1px solid #c3dafe; border-radius: 12px; padding: 24px 28px; margin: 24px 0; }
    .credentials-box h3 { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #5a67d8; margin-bottom: 16px; }
    .cred-row { margin-bottom: 14px; }
    .cred-label { font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .cred-value { font-size: 15px; font-weight: 700; color: #2d3748; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-family: 'Courier New', monospace; }
    .warning-box { background: #fff7ed; border-left: 4px solid #f6ad55; border-radius: 8px; padding: 14px 18px; margin: 20px 0; }
    .warning-box p { font-size: 13px; color: #744210; line-height: 1.6; }
    .steps { margin: 24px 0; }
    .steps h3 { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #5a67d8; margin-bottom: 14px; }
    .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
    .step-num { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 12px; font-weight: 700; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; margin-top: 2px; }
    .step-text { font-size: 14px; color: #4a5568; line-height: 1.6; }
    .footer { background: #f7fafc; text-align: center; padding: 24px 32px; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #a0aec0; line-height: 1.7; }
    .footer .brand { font-size: 14px; font-weight: 700; color: #5a67d8; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>&#127891; 1CAMPUS</h1>
      <p>University Management Portal</p>
      <span class="badge">Enrollment Confirmed</span>
    </div>

    <div class="body">
      <p class="greeting">Dear ${studentName},</p>
      <p class="text">
        Congratulations! Your application has been reviewed and approved by the Student Administration team.
        You have been officially enrolled at <strong>1CAMPUS University</strong> and your student portal
        account is now ready.
      </p>
      <p class="text">
        Your programme: <strong>${degreeProgram}</strong>
      </p>

      <div class="credentials-box">
        <h3>&#128272; Your Portal Login Credentials</h3>

        <div class="cred-row">
          <div class="cred-label">Registration Number</div>
          <div class="cred-value">${regNumber}</div>
        </div>

        <div class="cred-row">
          <div class="cred-label">Portal Login Email</div>
          <div class="cred-value">${portalEmail}</div>
        </div>

        <div class="cred-row">
          <div class="cred-label">Temporary Password</div>
          <div class="cred-value">${tempPassword}</div>
        </div>
      </div>

      <div class="warning-box">
        <p>&#9888;&#65039; <strong>Important:</strong> This is a temporary password. You will be prompted to
        change it the first time you log in to the portal. Please keep these credentials private and do
        not share them with anyone.</p>
      </div>

      <div class="steps">
        <h3>&#128203; Getting Started</h3>
        <div class="step">
          <span class="step-num">1</span>
          <span class="step-text">Open the 1CAMPUS student portal and click <strong>Login</strong>.</span>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <span class="step-text">Enter your <strong>portal email</strong> and the <strong>temporary password</strong> above.</span>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <span class="step-text">You will be prompted to set a new secure password on first login.</span>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <span class="step-text">Complete your student profile and explore your enrolled modules.</span>
        </div>
      </div>

      <p class="text">
        If you have any questions or encounter any issues accessing your account, please contact the
        Student Administration office or raise a support ticket from within the portal.
      </p>
    </div>

    <div class="footer">
      <p class="brand">1CAMPUS University</p>
      <p>
        This is an automated message from the Student Administration system.<br />
        Please do not reply directly to this email.<br />
        &copy; ${year} 1CAMPUS University. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const info = await transporter.sendMail({
    from: `"1CAMPUS University" <${process.env.SENDGRID_FROM_EMAIL}>`,
    to: toEmail,
    subject: `🎓 Welcome to 1CAMPUS – Your Portal Credentials (${regNumber})`,
    html,
  });

  console.log(`[EMAIL] Message sent: ${info.messageId}`);
  return info;
};

module.exports = { sendEnrollmentEmail };
