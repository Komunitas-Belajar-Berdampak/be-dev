const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const { uploadFile } = require('../../libs/s3');
const service = require('./private-file.service');

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
        const filePath = await uploadFile(req.file, 'private-files');
        const fileSize = `${(req.file.size / 1024).toFixed(1)} KB`;

        const data = await service.createForUser(req.user.sub, {
            filePath,
            fileSize,
            tipe: req.file.mimetype,
            status: req.body.status,
        });

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
