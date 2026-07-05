const TurnoModel = require('../models/TurnoModel');

const turnoController = {
  async getAll(req, res) {
    try {
      const data = await TurnoModel.findAll(req.query.empresa_id ? parseInt(req.query.empresa_id) : null);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await TurnoModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Turno no encontrado' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { empresa_id, codigo, nombre, hora_entrada, hora_salida } = req.body;
      if (!empresa_id || !codigo || !nombre || !hora_entrada || !hora_salida) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
      }
      const id = await TurnoModel.create(req.body);
      res.status(201).json({ ok: true, message: 'Turno creado', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ ok: false, message: 'El código de turno ya existe' });
      }
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      await TurnoModel.update(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Turno actualizado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await TurnoModel.delete(parseInt(req.params.id));
      res.json({ ok: true, message: 'Turno desactivado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = turnoController;
