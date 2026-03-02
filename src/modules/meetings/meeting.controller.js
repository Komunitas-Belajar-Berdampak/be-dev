const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const meetingService = require('./meeting.service');

const postMeetingSchema = Joi.object({
    pertemuan: Joi.number().integer().min(1).max(16).required(),
    judul: Joi.string().required(),
    deskripsi: Joi.object().optional(),
});

const upsertMeetingSchema = Joi.object({
    judul: Joi.string().optional(),
    deskripsi: Joi.object().optional(),
}).min(1);

const postMeeting = async (req, res, next) => {
    try {
        const { error, value } = postMeetingSchema.validate(req.body);
        if (error) throw error;

        const m = await meetingService.upsertMeeting(
            req.params.idCourse,
            value.pertemuan,
            { judul: value.judul, deskripsi: value.deskripsi }
        );

        return successResponse(res, {
            statusCode: 201,
            message: `pertemuan ke-${m.pertemuan} berhasil dibuat!`,
            data: m,
        });
    } catch (err) {
        return next(err);
    }
};

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
    postMeeting,
    getMeetings,
    getMeetingDetail,
    putMeeting,
};
