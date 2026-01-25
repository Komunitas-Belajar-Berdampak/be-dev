const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const meetingService = require('./meeting.service');

const upsertMeetingSchema = Joi.object({
    judul: Joi.string().optional(),
    deskripsi: Joi.object().optional(),
}).min(1);

const getMeetings = async (req, res, next) => {
    try {
        const result = await meetingService.listMeetingsByCourse(req.params.idCourse, req.query);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data: result.items,
        pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
};

const getMeetingDetail = async (req, res, next) => {
    try {
        const data = await meetingService.getMeetingByNumber(
            req.params.idCourses,
            Number(req.params.pertemuan)
        );
        return successResponse(res, {
            message: 'data berhasil diambil!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const putMeeting = async (req, res, next) => {
    try {
        const { error, value } = upsertMeetingSchema.validate(req.body);
        if (error) throw error;

        const m = await meetingService.updateMeetingById(
            req.params.idPertemuan,
            value
        );

        return successResponse(res, {
            message: `pertemuan ke-${m.pertemuan} berhasil diubah!`,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getMeetings,
    getMeetingDetail,
    putMeeting,
};
