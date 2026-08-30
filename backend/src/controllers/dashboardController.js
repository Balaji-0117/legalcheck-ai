/**
 * Dashboard Controller
 * Computes metrics, violation statistics, and history overview for enforcement officers.
 */

const db = require('../models/db');

function getDashboardStats(req, res) {
  try {
    const stats = db.getStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics: ' + error.message
    });
  }
}

module.exports = {
  getDashboardStats
};
