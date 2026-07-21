// ============================================================
//  SCGRH — auditoriaController.js
// ============================================================
const AuditoriaModel = require('../models/AuditoriaModel');
const ExcelJS = require('exceljs');

const auditoriaController = {

  // ── AUDITORÍAS ──────────────────────────────────────────────
  async getAll(req, res) {
    try {
      const data = await AuditoriaModel.getAllAuditorias(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async getById(req, res) {
    try {
      const audit = await AuditoriaModel.getAuditoriaById(parseInt(req.params.id));
      if (!audit) return res.status(404).json({ ok: false, message: 'Auditoría no encontrada' });
      res.json({ ok: true, data: audit });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async create(req, res) {
    try {
      const id = await AuditoriaModel.createAuditoria(req.body, req.user.id);
      res.status(201).json({ ok: true, message: 'Auditoría registrada', id });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  // ── REPORTES EXCEL ──────────────────────────────────────────
  async downloadReporteEmpleados(req, res) {
    try {
      const datos = await AuditoriaModel.getReporteEmpleados(req.user.empresa_id);
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte Empleados');

      // Estilos de cabecera
      worksheet.columns = [
        { header: 'Empleado', key: 'Empleado', width: 35 },
        { header: 'DNI', key: 'DNI', width: 15 },
        { header: 'Fecha Ingreso', key: 'Fecha Ingreso', width: 20 },
        { header: 'Fecha Fin Contrato', key: 'Fecha Fin Contrato', width: 20 },
        { header: 'Estado', key: 'Estado', width: 15 },
        { header: 'Cargo', key: 'Cargo', width: 25 },
        { header: 'Sucursal', key: 'Sucursal', width: 25 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D7EF8' } };

      datos.forEach(row => {
        worksheet.addRow(row);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_empleados.xlsx"');
      
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al generar el reporte');
    }
  }

};

module.exports = auditoriaController;
