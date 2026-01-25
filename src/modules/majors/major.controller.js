const { successResponse } = require('../../utils/http');
const service = require('./major.service');

const getMajors = async (req, res, next) => {
    try {
        const result = await service.listMajors(req.query);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data: result.items,
        pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
};

const createMajor = async (req, res, next) => {
    try {
        const data = await service.createMajor(req.body);
        return successResponse(res, {
        statusCode: 201,
        message: 'prodi berhasil dibuat',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateMajor = async (req, res, next) => {
    try {
        const data = await service.updateMajor(req.params.id, req.body);
        return successResponse(res, {
        message: 'prodi berhasil diubah!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getMajors,
    createMajor,
    updateMajor,
};