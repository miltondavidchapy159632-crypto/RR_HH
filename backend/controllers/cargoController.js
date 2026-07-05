const CargoModel = require('../models/CargoModel');

const cargoController = {
  async getAll(req, res) {
    try {
      const data = await CargoModel.findAll(req.query.area_id ? parseInt(req.query.area_id) : null);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await CargoModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Cargo no encontrado' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { area_id, codigo, nombre } = req.body;
      if (!area_id || !codigo || !nombre)
        return res.status(400).json({ ok: false, message: 'Área, Código y Nombre son obligatorios' });
      const id = await CargoModel.create(req.body);
      res.status(201).json({ ok: true, message: 'Cargo creado', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) return res.status(409).json({ ok: false, message: 'El código ya existe' });
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      await CargoModel.update(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Cargo actualizado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await CargoModel.delete(parseInt(req.params.id));
      res.json({ ok: true, message: 'Cargo desactivado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = cargoController;
