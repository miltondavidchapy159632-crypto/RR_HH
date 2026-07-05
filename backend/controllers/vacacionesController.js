const VacacionesModel = require('../models/VacacionesModel');

const vacacionesController = {
  async getSaldos(req, res) {
    try {
      const data = await VacacionesModel.getSaldos();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async createSaldo(req, res) {
    try {
      const { contrato_id, periodo_laboral } = req.body;
      if (!contrato_id || !periodo_laboral) {
        return res.status(400).json({ ok: false, message: 'Contrato y Periodo son requeridos' });
      }
      const id = await VacacionesModel.createSaldo(req.body);
      res.status(201).json({ ok: true, message: 'Saldo vacacional inicializado', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ ok: false, message: 'El saldo vacacional para este periodo ya existe' });
      }
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getSolicitudes(req, res) {
    try {
      const data = await VacacionesModel.getSolicitudes();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async createSolicitud(req, res) {
    try {
      const { vacaciones_id, fecha_inicio, fecha_fin, dias_solicitados } = req.body;
      if (!vacaciones_id || !fecha_inicio || !fecha_fin || !dias_solicitados) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
      }
      const id = await VacacionesModel.createSolicitud(req.body);
      res.status(201).json({ ok: true, message: 'Solicitud de vacaciones registrada en revisión', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async procesar(req, res) {
    try {
      const { id, estado } = req.body; // estado: 'APROBADA' o 'RECHAZADA'
      if (!id || !estado) {
        return res.status(400).json({ ok: false, message: 'ID y Estado de resolución son obligatorios' });
      }
      const aprobadoPor = req.user.id;
      await VacacionesModel.procesarSolicitud(id, estado, aprobadoPor);
      res.json({ ok: true, message: `Solicitud de vacaciones procesada como: ${estado}` });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = vacacionesController;
