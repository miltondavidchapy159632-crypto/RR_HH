// ============================================================
//  SCGRH — Configuración Nodemailer
//  Soporta: Gmail, Outlook/SMTP genérico, o Ethereal (dev)
// ============================================================
const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host    = process.env.SMTP_HOST;
  const port    = parseInt(process.env.SMTP_PORT || '587');
  const user    = process.env.SMTP_USER;
  const pass    = process.env.SMTP_PASS;
  const secure  = process.env.SMTP_SECURE === 'true';

  // Si no hay config SMTP → usar cuenta de prueba Ethereal (solo dev)
  if (!host || !user) {
    console.warn('[Mailer] ⚠️  Sin config SMTP. Los emails se simularán en consola.');
    _transporter = {
      sendMail: async (opts) => {
        console.log('─────────────────────────────────────');
        console.log('[EMAIL SIMULADO]');
        console.log('  Para:   ', opts.to);
        console.log('  Asunto: ', opts.subject);
        console.log('─────────────────────────────────────');
        return { messageId: 'simulado-' + Date.now() };
      }
    };
    return _transporter;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  return _transporter;
}

module.exports = { getTransporter };
