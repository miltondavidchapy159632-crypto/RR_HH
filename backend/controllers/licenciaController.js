const LicenciaModel = require('../models/LicenciaModel');

const licenciaController = {
  // ── Licencias ──
  async getAllLicencias(req, res) {
    try {
      const data = await LicenciaModel.findAllLicencias();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async createLicencia(req, res) {
    try {
      const { contrato_id, tipo_licencia_id, fecha_inicio, fecha_fin, dias_totales } = req.body;
      if (!contrato_id || !tipo_licencia_id || !fecha_inicio || !fecha_fin || !dias_totales) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios para la licencia' });
      }
      const id = await LicenciaModel.createLicencia(req.body);
      res.status(201).json({ ok: true, message: 'Licencia registrada en revisión', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async procesarLicencia(req, res) {
    try {
      const { id, estado } = req.body;
      if (!id || !estado) {
        return res.status(400).json({ ok: false, message: 'ID y Estado de resolución requeridos' });
      }
      const aprobadoPor = req.user.id;
      await LicenciaModel.procesarLicencia(id, estado, aprobadoPor);
      res.json({ ok: true, message: `Licencia procesada como: ${estado}` });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Permisos ──
  async getAllPermisos(req, res) {
    try {
      const data = await LicenciaModel.findAllPermisos();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async createPermiso(req, res) {
    try {
      const { contrato_id, fecha, hora_inicio, hora_fin, motivo } = req.body;
      if (!contrato_id || !fecha || !hora_inicio || !hora_fin || !motivo) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios para el permiso' });
      }
      const id = await LicenciaModel.createPermiso(req.body);
      res.status(201).json({ ok: true, message: 'Permiso registrado en revisión', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async procesarPermiso(req, res) {
    try {
      const { id, estado } = req.body;
      if (!id || !estado) {
        return res.status(400).json({ ok: false, message: 'ID y Estado de resolución requeridos' });
      }
      const aprobadoPor = req.user.id;
      await LicenciaModel.procesarPermiso(id, estado, aprobadoPor);
      res.json({ ok: true, message: `Permiso procesado como: ${estado}` });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // Catálogos
  async getTiposLicencia(req, res) {
    try {
      const data = await LicenciaModel.getTiposLicencia();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = licenciaController;
