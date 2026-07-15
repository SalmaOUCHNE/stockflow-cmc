import dashboardService from '../services/dashboard.service.js';

const getDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData();
    res.status(200).json(data);
  } catch (error) {
    console.error('DASHBOARD ERROR:', error);

    res.status(500).json({
      message: error.message,
      detail: error.detail || null
    });
  }
};

export default {
  getDashboard
};