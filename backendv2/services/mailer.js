/**
 * Envoi d'emails transactionnels — Salifz
 *
 * Hors production, ou si aucun SMTP n'est configuré, les emails sont écrits
 * dans les logs serveur au lieu d'être envoyés. Ils ne transitent jamais par
 * la réponse HTTP (voir S3).
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  return transporter;
}

async function send({ to, subject, text, html }) {
  const mailer = getTransporter();

  if (!mailer) {
    console.log(`[MAILER] (non configuré) → ${to} | ${subject}\n${text}`);
    return { delivered: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@salifz.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Salifz';

  await mailer.sendMail({ from: `"${fromName}" <${from}>`, to, subject, text, html });
  return { delivered: true };
}

async function sendPasswordReset(to, resetLink, displayName) {
  const name = displayName || '';
  const subject = 'Réinitialisation de votre mot de passe Salifz';
  const text =
    `Assalamu alaykum ${name},\n\n` +
    `Vous avez demandé à réinitialiser votre mot de passe Salifz.\n` +
    `Ouvrez ce lien dans l'heure qui vient :\n\n${resetLink}\n\n` +
    `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : ` +
    `votre mot de passe reste inchangé.\n`;

  const html =
    `<p>Assalamu alaykum ${name},</p>` +
    `<p>Vous avez demandé à réinitialiser votre mot de passe Salifz.</p>` +
    `<p><a href="${resetLink}">Choisir un nouveau mot de passe</a> — ce lien expire dans une heure.</p>` +
    `<p style="color:#666">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.</p>`;

  return send({ to, subject, text, html });
}

module.exports = { send, sendPasswordReset };
