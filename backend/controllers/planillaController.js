const PlanillaModel = require('../models/PlanillaModel');

const planillaController = {
  async getAll(req, res) {
    try {
      const data = await PlanillaModel.findAll();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await PlanillaModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Planilla no encontrada' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getDetalle(req, res) {
    try {
      const data = await PlanillaModel.getDetallePlanilla(parseInt(req.params.id));
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { empresa_id, periodo } = req.body;
      if (!empresa_id || !periodo) {
        return res.status(400).json({ ok: false, message: 'Empresa y Periodo (YYYY-MM) son obligatorios' });
      }
      const id = await PlanillaModel.create(req.body);
      res.status(201).json({ ok: true, message: 'Cabecera de planilla creada en Borrador', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ ok: false, message: 'La planilla para este periodo y sucursal ya existe' });
      }
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async calcular(req, res) {
    try {
      const planillaId = parseInt(req.body.id);
      if (!planillaId) return res.status(400).json({ ok: false, message: 'ID de planilla requerido' });

      await PlanillaModel.calcular(planillaId);
      res.json({ ok: true, message: 'Planilla calculada exitosamente. Se generó la pre-nómina.' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async aprobar(req, res) {
    try {
      const planillaId = parseInt(req.body.id);
      if (!planillaId) return res.status(400).json({ ok: false, message: 'ID de planilla requerido' });

      const aprobadoPor = req.user.id;
      await PlanillaModel.aprobar(planillaId, aprobadoPor);
      res.json({ ok: true, message: 'Planilla aprobada. Boletas de pago y archivo bancario BCP generados.' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getBoleta(req, res) {
    try {
      const data = await PlanillaModel.getBoletaDetallada(parseInt(req.params.detalle_id));
      if (!data.cabecera) return res.status(404).json({ ok: false, message: 'Boleta de pago no encontrada' });
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getArchivosBancarios(req, res) {
    try {
      const data = await PlanillaModel.getArchivosBancarios();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = planillaController;
