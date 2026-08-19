const { getDashboardSummary } = require('../services/dashboard.service');

async function getDashboardSummaryController(req, res) {
  const data = await getDashboardSummary(req.auth.tenantId);
  res.status(200).json({ data });
}

module.exports = {
  getDashboardSummaryController,
};
