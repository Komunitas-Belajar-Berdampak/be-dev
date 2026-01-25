const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const submissionService = require('./submission.service');

const createSchema = Joi.object({
    file: Joi.string().required(),
});

const patchSchema = Joi.object({
    file: Joi.string().optional(),
}).min(1);

const gradeSchema = Joi.object({
    nilai: Joi.number().min(0).max(100).required(),
    gradedAt: Joi.date().iso().optional(),
});

const getAllSubmissions = async (req, res, next) => {
    try {
        const result = await submissionService.listAllSubmissions(
            req.params.idAssignment,
            req.user,
            req.query
        );
        return successResponse(res, {
            message: 'data berhasil diambil!',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
};

const getMySubmission = async (req, res, next) => {
    try {
        const data = await submissionService.getMySubmission(
            req.params.idAssignment,
            req.user
        );
        return successResponse(res, {
            message: 'data berhasil diambil!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const createSubmission = async (req, res, next) => {
    try {
        const { error, value } = createSchema.validate(req.body);
        if (error) throw error;

        const data = await submissionService.createSubmission(
            req.params.idAssignment,
            req.user,
            value.file
        );

        return successResponse(res, {
            statusCode: 201,
            message: 'tugas sudah tersubmit!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateMySubmission = async (req, res, next) => {
    try {
        const { error, value } = patchSchema.validate(req.body);
        if (error) throw error;

        const data = await submissionService.updateMySubmission(
            req.params.idAssignment,
            req.user,
            value.file
        );

        return successResponse(res, {
            message: 'submission berhasil diubah!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const gradeSubmission = async (req, res, next) => {
    try {
        const { error, value } = gradeSchema.validate(req.body);
        if (error) throw error;

        await submissionService.gradeSubmission(
        req.params.idAssignment,
        req.params.idSubmission,
        req.user,
        value.nilai,
        value.gradedAt
        );

        return successResponse(res, { message: 'nilai berhasil disimpan!' });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getAllSubmissions,
    getMySubmission,
    createSubmission,
    updateMySubmission,
    gradeSubmission,
};
