const { successResponse } = require('../../utils/http');
const dashboardCourseService = require('./course-dashboard.service');

const getCourseDashboard = async (req, res, next) => {
    try {
        const data = await dashboardCourseService.getDashboardByCourse(
            req.params.idCourse,
            req.user
        );
        return successResponse(res, {
            message: 'data dashboard berhasil diambil!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const getMeetingDashboard = async (req, res, next) => {
    try {
        const data = await dashboardCourseService.getDashboardByMeeting(
            req.params.idCourse,
            req.params.pertemuan
        );
        return successResponse(res, {
            message: 'data dashboard pertemuan berhasil diambil!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = { getCourseDashboard, getMeetingDashboard };