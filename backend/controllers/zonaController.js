// ============================================================
//  SCGRH — zonaController.js
// ============================================================
const ZonaModel = require('../models/ZonaModel');

const zonaController = {

  // ── ZONAS ───────────────────────────────────────────────────
  async getZonas(req, res) {
    try {
      res.json({ ok: true, data: await ZonaModel.findAllZonas(req.user.empresa_id) });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async getSucursales(req, res) {
    try {
      res.json({ ok: true, data: await ZonaModel.getSucursales(req.user.empresa_id) });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async createZona(req, res) {
    try {
      const id = await ZonaModel.createZona(req.body);
      res.status(201).json({ ok: true, message: 'Zona creada', id });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async updateZona(req, res) {
    try {
      await ZonaModel.updateZona(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Zona actualizada' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  // ── ASIGNACIONES ────────────────────────────────────────────
  async getAsignaciones(req, res) {
    try {
      const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
      const data = await ZonaModel.findAsignacionesByDate(req.user.empresa_id, fecha);
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async getOptionsAsignacion(req, res) {
    try {
      res.json({ ok: true, data: await ZonaModel.getOptionsForAsignacion(req.user.empresa_id) });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async createAsignacion(req, res) {
    try {
      const id = await ZonaModel.createAsignacion(req.body, req.user.id);
      res.status(201).json({ ok: true, message: 'Personal asignado a la zona', id });
    } catch (err) { 
      if(err.message.includes('UNIQUE')) return res.status(409).json({ ok:false, message: 'El colaborador ya está asignado a esa zona en esa fecha/turno.'});
      res.status(500).json({ ok: false, message: err.message }); 
    }
  },

  async deleteAsignacion(req, res) {
    try {
      await ZonaModel.deleteAsignacion(parseInt(req.params.id));
      res.json({ ok: true, message: 'Asignación eliminada' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  }

};

module.exports = zonaController;
