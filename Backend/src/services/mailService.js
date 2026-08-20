import nodemailer from 'nodemailer';

let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  try {
    await transporter.verify();
    console.log('SMTP transporter verified')
  } catch (err) {
    console.error('SMTP verify failed:', err && err.message ? err.message : err)
  }
  return transporter;
}

export const sendMail = async (opts = {}) => {
  const t = await initTransporter();
  if (!t) {
    console.log('SMTP not configured — skipping sendMail, opts:', opts);
    return null;
  }
  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_HOST}`,
      to: opts.to,
      subject: opts.subject || '(no subject)',
      text: opts.text || '',
      html: opts.html || undefined,
    });
    console.log('Mail sent:', info && info.messageId ? info.messageId : '')
    return info;
  } catch (err) {
    console.error('sendMail error:', err && err.message ? err.message : err)
    throw err
  }
}

export default { sendMail };
