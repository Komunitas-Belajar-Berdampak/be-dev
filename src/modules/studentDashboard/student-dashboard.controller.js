const { successResponse } = require('../../utils/http');
const service = require('./student-dashboard.service');

const getDashboard = async (req, res, next) => {
    try {
        const data = await service.getStudentDashboard(req.user);
        return successResponse(res, {
            message: 'data dashboard berhasil diambil!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const getGrades = async (req, res, next) => {
    try {
        const targetUserId = req.params.idStudent || null;
        const data = await service.getStudentGrades(targetUserId, req.user);
        return successResponse(res, {
            message: 'data nilai berhasil diambil!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = { getDashboard, getGrades };
