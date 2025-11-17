const { successResponse } = require('../../utils/http');
const service = require('./faculty.service');

const getFaculties = async (req, res, next) => {
    try {
        const data = await service.listFaculties();
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const createFaculty = async (req, res, next) => {
    try {
        const fac = await service.createFaculty(req.body);
        return successResponse(res, {
        statusCode: 201,
        message: 'fakultas telah dibuat!',
        data: fac,
        });
    } catch (err) {
        return next(err);
    }
};

const updateFaculty = async (req, res, next) => {
    try {
        const fac = await service.updateFaculty(req.params.id, req.body);
        return successResponse(res, {
        message: 'nama fakultas telah diubah!',
        data: fac,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getFaculties,
    createFaculty,
    updateFaculty,
};