const ContratoModel = require('../models/ContratoModel');

const contratoController = {
  async getAll(req, res) {
    try {
      const data = await ContratoModel.findAll();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await ContratoModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Contrato no encontrado' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { expediente_id, puesto_id, tipo_contrato_id, codigo, fecha_inicio, salario_base } = req.body;
      if (!expediente_id || !puesto_id || !tipo_contrato_id || !codigo || !fecha_inicio || !salario_base) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios para el contrato' });
      }
      const creadorId = req.user.id;
      const id = await ContratoModel.create(req.body, creadorId);
      res.status(201).json({ ok: true, message: 'Contrato creado y registrado', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ ok: false, message: 'El código de contrato ya existe, o ya tiene un contrato VIGENTE' });
      }
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      await ContratoModel.update(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Contrato actualizado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await ContratoModel.delete(parseInt(req.params.id));
      res.json({ ok: true, message: 'Contrato rescindido' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getCatalogs(req, res) {
    try {
      const catalogs = await ContratoModel.getCatalogs();
      res.json({ ok: true, data: catalogs });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = contratoController;
