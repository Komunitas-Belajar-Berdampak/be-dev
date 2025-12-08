const Joi = require('joi');
const { ApiError, successResponse } = require('../../utils/http');
const service = require('./approach.service');

const bodySchema = Joi.object({
    gayaBelajar: Joi.array().items(Joi.string()).required(),
});

// hanya pemilik atau SUPER_ADMIN / DOSEN yang boleh akses
function ensureCanAccess(req, targetUserId) {
    const isOwner = req.user.sub === targetUserId;
    const roles = req.user.roles || [];
    const isPrivileged =
        roles.includes('SUPER_ADMIN') || roles.includes('DOSEN');

    if (!isOwner && !isPrivileged) {
        throw new ApiError(403, 'Anda tidak boleh mengakses resource ini');
    }
}

const getApproach = async (req, res, next) => {
    try {
        const targetUserId = req.params.idUser;
        ensureCanAccess(req, targetUserId);

        const data = await service.getApproachByUser(targetUserId);

        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const createApproach = async (req, res, next) => {
    try {
        const targetUserId = req.params.idUser;
        ensureCanAccess(req, targetUserId);

        const { error, value } = bodySchema.validate(req.body);
        if (error) throw error;

        const data = await service.createApproach(
        targetUserId,
        value.gayaBelajar,
        );

        return successResponse(res, {
        statusCode: 201,
        message: 'data berhasil dibuat!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateApproach = async (req, res, next) => {
    try {
        const targetUserId = req.params.idUser;
        ensureCanAccess(req, targetUserId);

        const { error, value } = bodySchema.validate(req.body);
        if (error) throw error;

        await service.updateApproach(targetUserId, value.gayaBelajar);

        return successResponse(res, {
        message: 'gaya belajar telah diubah!',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getApproach,
    createApproach,
    updateApproach,
};
