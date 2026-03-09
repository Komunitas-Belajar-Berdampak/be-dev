const { successResponse } = require('../../utils/http');
const dashboardService = require('./dashboard.service');

const getStats = async (req, res, next) => {
    try {
        const data = await dashboardService.getDashboardStats();
        return successResponse(res, {
            message: 'data dashboard berhasil diambil!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = { getStats };
