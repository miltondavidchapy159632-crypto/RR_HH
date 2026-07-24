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
  },

  async downloadReporteCalidad(req, res) {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_calidad.pdf"');
      
      doc.pipe(res);
      
      const auditorias = await AuditoriaModel.getAllAuditorias(req.user.empresa_id);
      
      doc.fontSize(22).fillColor('#2d7ef8').text('Reporte de Calidad de Auditorías', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666666').text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);
      
      let promedio = 0;
      if (auditorias.length > 0) {
        const sum = auditorias.reduce((acc, a) => acc + (a.puntaje_total || 0), 0);
        promedio = (sum / auditorias.length).toFixed(1);
      }
      
      doc.fontSize(14).fillColor('#333333').text(`Total Auditorías Realizadas: ${auditorias.length}`);
      doc.text(`Puntaje Promedio General: ${promedio}%`);
      doc.moveDown(1.5);
      
      doc.fontSize(16).fillColor('#111111').text('Últimas Auditorías Registradas', { underline: true });
      doc.moveDown(0.8);
      
      auditorias.slice(0, 20).forEach(a => {
        doc.fontSize(12).fillColor('#222222').text(`• Zona: ${a.zona_nombre} (${a.tipo})`);
        doc.fontSize(10).fillColor('#555555').text(`   Fecha: ${new Date(a.fecha_auditoria).toLocaleDateString()}  |  Auditor: ${a.auditor}  |  Puntaje: ${a.puntaje_total}%`);
        doc.moveDown(0.5);
      });
      
      if (auditorias.length === 0) {
        doc.fontSize(12).text('No hay auditorías registradas en el sistema.', { align: 'center' });
      }
      
      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al generar el PDF');
    }
  }

};

module.exports = auditoriaController;
