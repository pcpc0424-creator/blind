import nodemailer from 'nodemailer';
import config from '../config';

// Create transporter
// Priority: 1. AWS SES (if credentials exist), 2. Local Postfix/sendmail, 3. Console logging (dev)
const hasAwsCredentials = config.email.awsAccessKeyId && config.email.awsSecretAccessKey;

let transporter: nodemailer.Transporter | { sendMail: (options: any) => Promise<{ messageId: string }> };

if (hasAwsCredentials) {
  // Use AWS SES
  transporter = nodemailer.createTransport({
    host: 'email-smtp.ap-northeast-2.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: config.email.awsAccessKeyId,
      pass: config.email.awsSecretAccessKey,
    },
  });
} else if (!config.isDev) {
  // Use local Postfix/sendmail in production
  transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
  });
} else {
  // Console logging for development
  transporter = {
    sendMail: async (options: any) => {
      console.log('\n📧 Email sent (Development Mode):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.html || options.text);
      console.log('\n');
      return { messageId: 'dev-' + Date.now() };
    },
  };
}

export const emailService = {
  /**
   * Send verification code email
   */
  async sendVerificationCode(email: string, code: string, companyName: string) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9fafb;
            border-radius: 12px;
            padding: 40px;
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #8b5cf6;
            font-size: 28px;
            margin: 0;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
          }
          .company {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #8b5cf6;
            letter-spacing: 8px;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            margin: 20px 0;
          }
          .expiry {
            color: #6b7280;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #9ca3af;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>Blind</h1>
          </div>
          <div class="content">
            <p class="company">${companyName} Employee Verification</p>
            <h2>Email Verification Code</h2>
            <p>Please enter the verification code below to complete your registration.</p>
            <div class="code">${code}</div>
            <p class="expiry">This code will expire in 10 minutes.</p>
          </div>
          <div class="footer">
            <p>This email was sent in response to a registration request.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Blind" <${config.email.from}>`,
      to: email,
      subject: `[Blind] Email Verification Code: ${code}`,
      html,
    });
  },

  /**
   * Send password reset verification code
   */
  async sendPasswordResetCode(email: string, code: string) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9fafb;
            border-radius: 12px;
            padding: 40px;
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #8b5cf6;
            font-size: 28px;
            margin: 0;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #8b5cf6;
            letter-spacing: 8px;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            margin: 20px 0;
          }
          .expiry {
            color: #6b7280;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #9ca3af;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>Blind</h1>
          </div>
          <div class="content">
            <h2>Password Reset Verification Code</h2>
            <p>Please enter the verification code below to reset your password.</p>
            <div class="code">${code}</div>
            <p class="expiry">This code will expire in 10 minutes.</p>
          </div>
          <div class="footer">
            <p>This email was sent in response to a password reset request.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Blind" <${config.email.from}>`,
      to: email,
      subject: `[Blind] Password Reset Verification Code: ${code}`,
      html,
    });
  },

  /**
   * Send password reset email (legacy - URL based)
   */
  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${config.webUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9fafb;
            border-radius: 12px;
            padding: 40px;
          }
          .logo h1 {
            color: #8b5cf6;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
          }
          .button {
            display: inline-block;
            background: #8b5cf6;
            color: white;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #9ca3af;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>Blind</h1>
          </div>
          <div class="content">
            <h2>Password Reset</h2>
            <p>Click the button below to reset your password.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          </div>
          <div class="footer">
            <p>If you did not request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Blind" <${config.email.from}>`,
      to: email,
      subject: '[Blind] Password Reset',
      html,
    });
  },
};
