const AreaModel = require('../models/AreaModel');

const areaController = {
  async getAll(req, res) {
    try {
      const data = await AreaModel.findAll(req.query.empresa_id ? parseInt(req.query.empresa_id) : null);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await AreaModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Área no encontrada' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { empresa_id, codigo, nombre } = req.body;
      if (!empresa_id || !codigo || !nombre)
        return res.status(400).json({ ok: false, message: 'Empresa, Código y Nombre son obligatorios' });
      const id = await AreaModel.create(req.body);
      res.status(201).json({ ok: true, message: 'Área creada', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) return res.status(409).json({ ok: false, message: 'El código ya existe' });
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      await AreaModel.update(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Área actualizada' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await AreaModel.delete(parseInt(req.params.id));
      res.json({ ok: true, message: 'Área desactivada' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = areaController;
