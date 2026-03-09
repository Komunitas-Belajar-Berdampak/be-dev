const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const { uploadFile } = require('../../libs/s3');
const materialService = require('./material.service');

const materialUpdateSchema = Joi.object({
    namaFile: Joi.string().optional(),
    tipe: Joi.string().optional(),
    pathFile: Joi.string().optional(),
    visibility: Joi.string().valid('HIDE', 'VISIBLE').optional(),
    deskripsi: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
}).min(1);

const parseJsonField = (value) => {
    if (!value || typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return undefined; }
};

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
        if (!req.file) {
            return next(new (require('../../utils/http').ApiError)(400, 'File materi wajib disertakan'));
        }

        const pathFile = await uploadFile(req.file, 'materials');

        const payload = {
            namaFile: req.body.namaFile || req.file.originalname,
            tipe: req.file.mimetype,
            pathFile,
            visibility: req.body.visibility,
            deskripsi: parseJsonField(req.body.deskripsi),
        };

        const data = await materialService.createMaterial(
            req.params.idCourse,
            Number(req.params.pertemuan),
            payload
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
        const body = {
            ...req.body,
            deskripsi: parseJsonField(req.body.deskripsi),
        };

        const { error, value } = materialUpdateSchema.validate(body);
        if (error) throw error;

        if (req.file) {
            value.pathFile = await uploadFile(req.file, 'materials');
            value.tipe = req.file.mimetype;
            if (!value.namaFile) value.namaFile = req.file.originalname;
        }

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
