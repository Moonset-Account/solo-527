import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'league@example.com';
const EMAIL_ENABLED = !!(SMTP_HOST && SMTP_USER);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    console.log(`[Email Disabled] To: ${to}, Subject: ${subject}`);
    return false;
  }
  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
    return true;
  } catch (err) {
    console.error('[Email Error]', err);
    return false;
  }
}

export function isEmailEnabled(): boolean {
  return EMAIL_ENABLED;
}
