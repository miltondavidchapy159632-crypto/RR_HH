// ============================================================
//  SCGRH — desvinculacionController.js
// ============================================================
const DesvinculacionModel = require('../models/DesvinculacionModel');
const { sendEmail }       = require('../services/emailService'); // Re-usamos el servicio de correo para notificar

const desvinculacionController = {

  async getCatalogos(req, res) {
    try {
      const data = await DesvinculacionModel.getCatalogos(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async getAll(req, res) {
    try {
      const data = await DesvinculacionModel.findAll(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async getById(req, res) {
    try {
      const data = await DesvinculacionModel.findById(parseInt(req.params.id));
      if (!data) return res.status(404).json({ ok: false, message: 'Solicitud no encontrada' });
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async create(req, res) {
    try {
      const { contrato_id, motivo_cese_id, fecha_cese_propuesta } = req.body;
      if (!contrato_id || !motivo_cese_id || !fecha_cese_propuesta) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
      }
      const id = await DesvinculacionModel.create(req.body, req.user.id);

      // Notificar por email a RRHH y Gerencia sobre la solicitud de cese
      try {
        await sendEmail({
          to: 'rrhh@restaurantedelfuturo.com',
          subject: `[SCGRH] Nueva Solicitud de Desvinculación #${id}`,
          html: `<p>Se ha registrado una nueva solicitud de desvinculación en el sistema.</p>
                 <p>Por favor revise el módulo de desvinculación para iniciar el proceso de offboarding.</p>`
        });
      } catch (emailErr) {
        console.warn('No se pudo enviar el correo de notificación:', emailErr.message);
      }

      res.status(201).json({ ok: true, message: 'Solicitud de desvinculación creada', id });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async cambiarEstado(req, res) {
    try {
      const { estado } = req.body;
      const validos = ['INICIADA', 'EN_PROCESO', 'VALIDADA', 'APROBADA', 'CERRADA', 'CANCELADA'];
      if (!validos.includes(estado)) return res.status(400).json({ ok: false, message: 'Estado inválido' });
      
      await DesvinculacionModel.cambiarEstado(parseInt(req.params.id), estado, req.user.id);
      res.json({ ok: true, message: `Solicitud marcada como ${estado}` });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async toggleValidacion(req, res) {
    try {
      const { completado } = req.body;
      await DesvinculacionModel.toggleValidacion(parseInt(req.params.val_id), completado, req.user.id);
      res.json({ ok: true, message: 'Estado de validación actualizado' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async addActivo(req, res) {
    try {
      const { activo } = req.body;
      if (!activo) return res.status(400).json({ ok: false, message: 'El nombre del activo es obligatorio' });
      await DesvinculacionModel.addActivoDevolucion({ ...req.body, solicitud_id: parseInt(req.params.id) });
      res.json({ ok: true, message: 'Activo agregado al checklist de devolución' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async updateActivo(req, res) {
    try {
      const { estado, observacion } = req.body;
      await DesvinculacionModel.updateEstadoActivo(parseInt(req.params.activo_id), estado, observacion, req.user.id);
      res.json({ ok: true, message: 'Estado del activo actualizado' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async upsertLiquidacion(req, res) {
    try {
      await DesvinculacionModel.upsertLiquidacion(parseInt(req.params.id), req.body, req.user.id);
      res.json({ ok: true, message: 'Cálculo de liquidación guardado' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  }
};

module.exports = desvinculacionController;
