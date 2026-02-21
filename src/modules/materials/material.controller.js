const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const materialService = require('./material.service');

const materialCreateSchema = Joi.object({
    namaFile: Joi.string().required(),
    tipe: Joi.string().required(),
    pathFile: Joi.string().required(),
    visibility: Joi.string().valid('HIDE', 'VISIBLE').optional(),
    deskripsi: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
});

const materialUpdateSchema = Joi.object({
    namaFile: Joi.string().optional(),
    tipe: Joi.string().optional(),
    pathFile: Joi.string().optional(),
    visibility: Joi.string().valid('HIDE', 'VISIBLE').optional(),
    deskripsi: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
}).min(1);

const getMaterialsByCourse = async (req, res, next) => {
    try {
        const result = await materialService.listMaterialsByCourse(req.params.idCourse, req.user, req.query);
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
};

const getMaterialsByMeeting = async (req, res, next) => {
    try {
        const result = await materialService.listMaterialsByMeeting(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.user,
        req.query
        );
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
};

const getMaterialDetail = async (req, res, next) => {
    try {
        const data = await materialService.getMaterialById(
            req.params.idMaterial,
            req.user
        );
        return successResponse(res, { message: 'data berhasil diambil!', data });
    } catch (err) {
        return next(err);
    }
};

const createMaterial = async (req, res, next) => {
    try {
        const { error, value } = materialCreateSchema.validate(req.body);
        if (error) throw error;

        const data = await materialService.createMaterial(
            req.params.idCourse,
            Number(req.params.pertemuan),
            value
        );

        return successResponse(res, {
            statusCode: 201,
            message: 'materi berhasil dibuat!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateMaterial = async (req, res, next) => {
    try {
        const { error, value } = materialUpdateSchema.validate(req.body);
        if (error) throw error;

        await materialService.updateMaterialById(
            req.params.idMaterial,
            value
        );

        return successResponse(res, { message: 'materi berhasil diubah!' });
    } catch (err) {
        return next(err);
    }
};

const deleteMaterial = async (req, res, next) => {
    try {
        await materialService.deleteMaterialById(
            req.params.idMaterial
        );

        return successResponse(res, { message: 'materi berhasil dihapus!' });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getMaterialsByCourse,
    getMaterialsByMeeting,
    getMaterialDetail,
    createMaterial,
    updateMaterial,
    deleteMaterial,
};
