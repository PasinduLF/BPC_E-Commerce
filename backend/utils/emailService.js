const nodemailer = require('nodemailer');
const { templates } = require('./emailTemplates');

let transporter;

const smtpConfigured = () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
    if (transporter) return transporter;
    if (!smtpConfigured()) return null;

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return transporter;
};

const getSender = () => {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'Beauty P&C';
    return `"${fromName}" <${fromEmail}>`;
};

const sendTemplatedEmail = async ({ to, templateName, data = {} }) => {
    if (!to || !templateName || !templates[templateName]) {
        return { sent: false, reason: 'Invalid email payload' };
    }

    const template = templates[templateName](data);
    const mailer = getTransporter();

    if (!mailer) {
        console.warn(`[email] SMTP not configured. Skipping "${templateName}" email to ${to}`);
        return { sent: false, reason: 'SMTP not configured' };
    }

    try {
        await mailer.sendMail({
            from: getSender(),
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });

        return { sent: true };
    } catch (error) {
        console.error(`[email] Failed to send "${templateName}" to ${to}:`, error.message);
        return { sent: false, reason: error.message };
    }
};

const sendEmailSafely = (payload) => {
    sendTemplatedEmail(payload).catch((error) => {
        console.error('[email] Unexpected send error:', error.message);
    });
};

module.exports = {
    sendTemplatedEmail,
    sendEmailSafely,
};
