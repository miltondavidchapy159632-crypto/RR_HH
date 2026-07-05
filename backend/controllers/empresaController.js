const EmpresaModel = require('../models/EmpresaModel');

const empresaController = {
  async getAll(req, res) {
    try {
      const data = await EmpresaModel.findAll();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await EmpresaModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Empresa no encontrada' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { ruc, razon_social } = req.body;
      if (!ruc || !razon_social)
        return res.status(400).json({ ok: false, message: 'RUC y Razón Social son obligatorios' });
      const id = await EmpresaModel.create(req.body);
      res.status(201).json({ ok: true, message: 'Empresa creada', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) return res.status(409).json({ ok: false, message: 'El RUC ya existe' });
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const { ruc, razon_social } = req.body;
      if (!ruc || !razon_social)
        return res.status(400).json({ ok: false, message: 'RUC y Razón Social son obligatorios' });
      await EmpresaModel.update(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Empresa actualizada' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await EmpresaModel.delete(parseInt(req.params.id));
      res.json({ ok: true, message: 'Empresa desactivada' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = empresaController;
