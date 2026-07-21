// ============================================================
//  SCGRH — Servicio de Email
//  Templates HTML premium para cada evento del sistema
// ============================================================
const { getTransporter } = require('../config/mailer');

const FROM = process.env.SMTP_FROM || '"SCGRH Restaurante del Futuro" <no-reply@scgrh.com>';

// ── Plantilla base ───────────────────────────────────────────
function baseTemplate(titulo, contenido, color = '#2D7EF8') {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#161b22;border-radius:16px;overflow:hidden;border:1px solid #30363d;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${color},${color}cc);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
              🍽️ Restaurante del Futuro
            </h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,.8);font-size:13px;">
              Sistema de Recursos Humanos
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 20px;color:#e6edf3;font-size:20px;font-weight:600;">${titulo}</h2>
            ${contenido}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0d1117;padding:20px 40px;text-align:center;border-top:1px solid #30363d;">
            <p style="margin:0;color:#8b949e;font-size:12px;">
              Este es un mensaje automático del sistema SCGRH. Por favor no responder.
            </p>
            <p style="margin:6px 0 0;color:#8b949e;font-size:12px;">
              © 2026 Restaurante del Futuro · UNP Ingeniería Informática
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function pill(texto, color) {
  return `<span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600;">${texto}</span>`;
}

function infoRow(label, value) {
  return `
  <tr>
    <td style="padding:10px 0;color:#8b949e;font-size:13px;border-bottom:1px solid #21262d;width:180px;">${label}</td>
    <td style="padding:10px 0;color:#e6edf3;font-size:13px;font-weight:500;border-bottom:1px solid #21262d;">${value}</td>
  </tr>`;
}

// ── Enviar email genérico ────────────────────────────────────
async function sendEmail(to, subject, html) {
  const transporter = getTransporter();
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    return info;
  } catch (err) {
    console.error('[EmailService] Error enviando email:', err.message);
    // No lanzar excepción — el email es secundario, no debe romper la operación
  }
}

// ═══════════════════════════════════════════════════════════════
//  TEMPLATES POR MÓDULO
// ═══════════════════════════════════════════════════════════════

// ── Vacaciones aprobadas/rechazadas ─────────────────────────
async function notificarVacaciones({ to, nombre, estado, fechaInicio, fechaFin, dias, aprobadoPor }) {
  const aprobado   = estado === 'APROBADA';
  const color      = aprobado ? '#00c896' : '#ff4d4f';
  const estadoText = aprobado ? 'APROBADA ✅' : 'RECHAZADA ❌';

  const contenido = `
  <p style="color:#8b949e;font-size:14px;margin:0 0 24px;">
    Hola <strong style="color:#e6edf3;">${nombre}</strong>, tu solicitud de vacaciones ha sido procesada.
  </p>
  ${pill(estadoText, color)}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    ${infoRow('Estado',       estadoText)}
    ${infoRow('Fecha inicio', fechaInicio)}
    ${infoRow('Fecha fin',    fechaFin)}
    ${infoRow('Días',         dias + ' día(s) hábil(es)')}
    ${infoRow('Procesado por', aprobadoPor)}
  </table>
  ${!aprobado ? '<p style="margin-top:20px;color:#ff4d4f;font-size:13px;">Puedes comunicarte con tu jefe inmediato para mayor información.</p>' : ''}`;

  return sendEmail(to, `Solicitud de vacaciones ${estadoText}`, baseTemplate('Solicitud de Vacaciones', contenido, color));
}

// ── Licencia aprobada/rechazada ──────────────────────────────
async function notificarLicencia({ to, nombre, estado, tipoLicencia, fechaInicio, fechaFin, aprobadoPor }) {
  const aprobado   = estado === 'APROBADA';
  const color      = aprobado ? '#00c896' : '#ff4d4f';
  const estadoText = aprobado ? 'APROBADA ✅' : 'RECHAZADA ❌';

  const contenido = `
  <p style="color:#8b949e;font-size:14px;margin:0 0 24px;">
    Hola <strong style="color:#e6edf3;">${nombre}</strong>, tu solicitud de licencia ha sido procesada.
  </p>
  ${pill(estadoText, color)}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    ${infoRow('Estado',        estadoText)}
    ${infoRow('Tipo',          tipoLicencia)}
    ${infoRow('Fecha inicio',  fechaInicio)}
    ${infoRow('Fecha fin',     fechaFin)}
    ${infoRow('Procesado por', aprobadoPor)}
  </table>`;

  return sendEmail(to, `Licencia ${tipoLicencia} — ${estadoText}`, baseTemplate('Solicitud de Licencia', contenido, color));
}

// ── Boleta de pago disponible ────────────────────────────────
async function notificarBoleta({ to, nombre, periodo, nroBoleta, totalNeto }) {
  const contenido = `
  <p style="color:#8b949e;font-size:14px;margin:0 0 24px;">
    Hola <strong style="color:#e6edf3;">${nombre}</strong>, tu boleta de pago del período <strong style="color:#F0A500;">${periodo}</strong> ya está disponible en el sistema.
  </p>
  <div style="background:#0d1117;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;border:1px solid #30363d;">
    <p style="margin:0 0 8px;color:#8b949e;font-size:13px;">NETO A PAGAR</p>
    <p style="margin:0;color:#2D7EF8;font-size:36px;font-weight:800;">S/ ${totalNeto}</p>
    <p style="margin:8px 0 0;color:#8b949e;font-size:12px;">Boleta N°: ${nroBoleta}</p>
  </div>
  <p style="color:#8b949e;font-size:13px;">Ingresa al sistema para descargar tu boleta en PDF.</p>`;

  return sendEmail(to, `Boleta de pago disponible — Período ${periodo}`, baseTemplate('Boleta de Pago', contenido, '#2D7EF8'));
}

// ── Resultado de entrevista ──────────────────────────────────
async function notificarEntrevista({ to, nombre, vacante, empresa, resultado, fecha, observaciones }) {
  const aprobado   = resultado === 'APROBADO';
  const color      = aprobado ? '#00c896' : (resultado === 'PENDIENTE' ? '#F0A500' : '#ff4d4f');
  const estadoText = aprobado ? 'APROBADO ✅' : (resultado === 'PENDIENTE' ? 'PENDIENTE ⏳' : 'NO APROBADO ❌');

  const contenido = `
  <p style="color:#8b949e;font-size:14px;margin:0 0 24px;">
    Estimado/a <strong style="color:#e6edf3;">${nombre}</strong>, te informamos el resultado de tu entrevista.
  </p>
  ${pill(estadoText, color)}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    ${infoRow('Puesto',    vacante)}
    ${infoRow('Empresa',   empresa)}
    ${infoRow('Resultado', estadoText)}
    ${infoRow('Fecha',     fecha)}
  </table>
  ${observaciones ? `<div style="margin-top:20px;background:#21262d;border-radius:8px;padding:16px;border-left:3px solid ${color};"><p style="margin:0;color:#8b949e;font-size:12px;margin-bottom:4px;">Observaciones:</p><p style="margin:0;color:#e6edf3;font-size:13px;">${observaciones}</p></div>` : ''}`;

  return sendEmail(to, `Resultado de entrevista — ${vacante}`, baseTemplate('Resultado de Entrevista', contenido, color));
}

// ── Oferta laboral emitida ───────────────────────────────────
async function notificarOfertaLaboral({ to, nombre, cargo, empresa, sucursal, salario, fechaInicio, beneficios }) {
  const contenido = `
  <p style="color:#8b949e;font-size:14px;margin:0 0 24px;">
    Estimado/a <strong style="color:#e6edf3;">${nombre}</strong>, nos complace extenderte una oferta laboral formal.
  </p>
  ${pill('🎉 OFERTA LABORAL EMITIDA', '#F0A500')}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    ${infoRow('Cargo',         cargo)}
    ${infoRow('Empresa',       empresa)}
    ${infoRow('Sede',          sucursal)}
    ${infoRow('Salario base',  'S/ ' + salario)}
    ${infoRow('Inicio',        fechaInicio)}
    ${beneficios ? infoRow('Beneficios', beneficios) : ''}
  </table>
  <p style="margin-top:20px;color:#8b949e;font-size:13px;">Por favor comunícate con el área de RRHH para confirmar tu aceptación o resolver cualquier consulta.</p>`;

  return sendEmail(to, `🎉 Oferta laboral — ${cargo} en ${empresa}`, baseTemplate('Oferta Laboral', contenido, '#F0A500'));
}

// ── Certificación por vencer ─────────────────────────────────
async function notificarCertificacionVencimiento({ to, nombre, certificacion, fechaVencimiento, diasRestantes }) {
  const urgente = diasRestantes <= 30;
  const color   = urgente ? '#ff4d4f' : '#F0A500';

  const contenido = `
  <p style="color:#8b949e;font-size:14px;margin:0 0 24px;">
    Hola <strong style="color:#e6edf3;">${nombre}</strong>, te recordamos que una de tus certificaciones está próxima a vencer.
  </p>
  ${pill(urgente ? '⚠️ URGENTE' : '🔔 AVISO', color)}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    ${infoRow('Certificación',  certificacion)}
    ${infoRow('Vence el',       fechaVencimiento)}
    ${infoRow('Días restantes', diasRestantes + ' día(s)')}
  </table>
  <p style="margin-top:20px;color:${color};font-size:13px;font-weight:600;">
    Por favor coordina con tu supervisor la renovación a tiempo.
  </p>`;

  return sendEmail(to, `⚠️ Certificación por vencer: ${certificacion}`, baseTemplate('Alerta de Certificación', contenido, color));
}

module.exports = {
  notificarVacaciones,
  notificarLicencia,
  notificarBoleta,
  notificarEntrevista,
  notificarOfertaLaboral,
  notificarCertificacionVencimiento
};
