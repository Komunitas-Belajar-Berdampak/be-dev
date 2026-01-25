const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const service = require('./private-file.service');

const createSchema = Joi.object({
    filePath: Joi.string().required(),
    fileSize: Joi.string().required(),
    status: Joi.string().valid('VISIBLE', 'PRIVATE').optional(),
    tipe: Joi.string().optional(), // kalau mau kirim MIME type
});

const patchSchema = Joi.object({
    status: Joi.string().valid('VISIBLE', 'PRIVATE').required(),
});

const listPrivateFiles = async (req, res, next) => {
    try {
        const result = await service.listByUser(req.user.sub, req.query);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data: result.items,
        pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
};

const createPrivateFile = async (req, res, next) => {
    try {
        const { error, value } = createSchema.validate(req.body);
        if (error) throw error;

        const data = await service.createForUser(req.user.sub, value);

        return successResponse(res, {
        statusCode: 201,
        message: 'data berhasil disimpan!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const patchPrivateFileStatus = async (req, res, next) => {
    try {
        const { error, value } = patchSchema.validate(req.body);
        if (error) throw error;

        await service.updateStatus(req.user.sub, req.params.id, value.status);

        return successResponse(res, {
        message: 'status file diubah!',
        });
    } catch (err) {
        return next(err);
    }
};

const deletePrivateFile = async (req, res, next) => {
    try {
        await service.deleteFile(req.user.sub, req.params.id);

        return successResponse(res, {
        message: 'file dihapus!',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    listPrivateFiles,
    createPrivateFile,
    patchPrivateFileStatus,
    deletePrivateFile,
};
