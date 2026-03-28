const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const { uploadFile } = require('../../libs/s3');
const assignmentService = require('./assignment.service');

const parseJsonField = (value) => {
    if (!value || typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return undefined; }
};

const createSchema = Joi.object({
    judul: Joi.string().required(),
    statusTugas: Joi.boolean().required(),
    tenggat: Joi.date().iso().required(),
    deskripsi: Joi.object().optional(),
    lampiran: Joi.string().optional(),
    status: Joi.string().valid('HIDE', 'VISIBLE').optional(),
});

const updateSchema = Joi.object({
    judul: Joi.string().optional(),
    statusTugas: Joi.boolean().optional(),
    tenggat: Joi.date().iso().optional(),
    deskripsi: Joi.object().optional(),
    lampiran: Joi.string().optional(),
    status: Joi.string().valid('HIDE', 'VISIBLE').optional(),
}).min(1);

const getAssignmentsByCourse = async (req, res, next) => {
    try {
        const result = await assignmentService.listAssignmentsByCourse(req.params.idCourse, req.user, req.query);
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
};

const getAssignmentsByMeeting = async (req, res, next) => {
    try {
        const result = await assignmentService.listAssignmentsByMeeting(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.user,
        req.query
        );
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
};

const getAssignmentDetail = async (req, res, next) => {
    try {
        const data = await assignmentService.getAssignmentById(
            req.params.idAssignment,
            req.user
        );
        return successResponse(res, { message: 'data berhasil diambil!', data });
    } catch (err) {
        return next(err);
    }
};

const createAssignment = async (req, res, next) => {
    try {
        const rawStatusTugas = req.body.statusTugas;
        const body = {
            ...req.body,
            deskripsi: parseJsonField(req.body.deskripsi),
            // FormData selalu kirim string; coerce ke boolean sebelum Joi validasi
            statusTugas:
                rawStatusTugas === true || rawStatusTugas === 'true' ? true
                : rawStatusTugas === false || rawStatusTugas === 'false' ? false
                : rawStatusTugas,
        };

        const { error, value } = createSchema.validate(body);
        if (error) throw error;

        if (req.file) {
            value.lampiran = await uploadFile(req.file, 'assignments');
        }

        const data = await assignmentService.createAssignment(
            req.params.idCourse,
            Number(req.params.pertemuan),
            value
        );

        return successResponse(res, {
            statusCode: 201,
            message: 'tugas berhasil dibuat!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateAssignment = async (req, res, next) => {
    try {
        const rawStatusTugas = req.body.statusTugas;
        const body = {
            ...req.body,
            deskripsi: parseJsonField(req.body.deskripsi),
            // FormData selalu kirim string; coerce ke boolean sebelum Joi validasi
            ...(rawStatusTugas !== undefined && {
                statusTugas:
                    rawStatusTugas === true || rawStatusTugas === 'true' ? true
                    : rawStatusTugas === false || rawStatusTugas === 'false' ? false
                    : rawStatusTugas,
            }),
        };

        const { error, value } = updateSchema.validate(body);
        if (error) throw error;

        if (req.file) {
            value.lampiran = await uploadFile(req.file, 'assignments');
        }

        await assignmentService.updateAssignmentById(
            req.params.idAssignment,
            value
        );

        return successResponse(res, { message: 'tugas berhasil diubah!' });
    } catch (err) {
        return next(err);
    }
};

const deleteAssignment = async (req, res, next) => {
    try {
        await assignmentService.deleteAssignmentById(
            req.params.idAssignment
        );
        return successResponse(res, { message: 'tugas berhasil dihapus!' });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getAssignmentsByCourse,
    getAssignmentsByMeeting,
    getAssignmentDetail,
    createAssignment,
    updateAssignment,
    deleteAssignment,
};