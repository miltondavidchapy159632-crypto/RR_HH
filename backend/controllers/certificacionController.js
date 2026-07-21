// ============================================================
//  SCGRH — certificacionController.js
// ============================================================
const CertModel = require('../models/CertificacionModel');
const { getPool, sql } = require('../config/database');

const certificacionController = {

  // ── CATÁLOGO ──────────────────────────────────────────────
  async getAllCatalogo(req, res) {
    try {
      res.json({ ok: true, data: await CertModel.findAllCatalogo() });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async createCatalogo(req, res) {
    try {
      if (!req.body.codigo || !req.body.nombre) 
        return res.status(400).json({ ok: false, message: 'Faltan campos (codigo, nombre)' });
      const id = await CertModel.createCatalogo(req.body);
      res.status(201).json({ ok: true, message: 'Certificación agregada al catálogo', id });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async updateCatalogo(req, res) {
    try {
      await CertModel.updateCatalogo(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Catálogo actualizado' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  // ── CERTIFICACIONES POR EMPLEADO ──────────────────────────
  async getEmpleados(req, res) {
    try {
      const data = await CertModel.findAllEmpleados(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },
  
  async getStats(req, res) {
    try {
      const data = await CertModel.getDashboardStats(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async getCatalogosForSelects(req, res) {
    try {
      const pool = getPool();
      const [certRes, contRes] = await Promise.all([
        pool.request().query(`SELECT id, codigo, nombre FROM certificaciones_catalogo WHERE activo=1`),
        pool.request().input('eid', sql.Int, req.user.empresa_id).query(`
          SELECT co.id AS contrato_id, per.nombres + ' ' + per.apellido_paterno AS nombre_completo, car.nombre AS cargo_nombre
          FROM contratos co
          INNER JOIN expedientes_laborales el ON el.id=co.expediente_id
          INNER JOIN personas per ON per.id=el.persona_id
          INNER JOIN puestos pu ON pu.id=co.puesto_id
          INNER JOIN cargos car ON car.id=pu.cargo_id
          INNER JOIN areas a ON a.id=car.area_id
          WHERE co.estado='VIGENTE' AND a.empresa_id=@eid
          ORDER BY per.nombres
        `)
      ]);
      res.json({ ok: true, data: { certificaciones: certRes.recordset, contratos: contRes.recordset } });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async createEmpleadoCert(req, res) {
    try {
      const id = await CertModel.createEmpleadoCert(req.body, req.user.id);
      res.status(201).json({ ok: true, message: 'Certificación registrada al colaborador', id });
    } catch (err) { 
      if(err.message.includes('UNIQUE')) return res.status(409).json({ ok:false, message: 'El colaborador ya tiene registrada esta certificación con esa fecha.'});
      res.status(500).json({ ok: false, message: err.message }); 
    }
  },

  async updateEstado(req, res) {
    try {
      await CertModel.updateEstado(parseInt(req.params.id), req.body.estado);
      res.json({ ok: true, message: 'Estado actualizado' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async deleteEmpleadoCert(req, res) {
    try {
      await CertModel.deleteEmpleadoCert(parseInt(req.params.id));
      res.json({ ok: true, message: 'Registro eliminado' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  }

};

module.exports = certificacionController;
