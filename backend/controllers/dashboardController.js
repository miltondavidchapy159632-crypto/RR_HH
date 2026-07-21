// ============================================================
//  SCGRH — dashboardController.js
// ============================================================
const DashboardModel = require('../models/DashboardModel');

const dashboardController = {
  async getAdvancedStats(req, res) {
    try {
      const stats = await DashboardModel.getAdvancedStats(req.user.empresa_id);
      res.json({ ok: true, data: stats });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = dashboardController;
