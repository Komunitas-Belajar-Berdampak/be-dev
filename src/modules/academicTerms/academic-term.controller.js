const { successResponse } = require('../../utils/http');
const service = require('./academic-term.service');

const getTerms = async (req, res, next) => {
    try {
        const result = await service.listTerms(req.query);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data: result.items,
        pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
};

const createTerm = async (req, res, next) => {
    try {
        const term = await service.createTerm(req.body);
        return successResponse(res, {
        statusCode: 201,
        message: 'Periode akademik berhasil dibuat!',
        data: term,
        });
    } catch (err) {
        return next(err);
    }
};

const getTermById = async (req, res, next) => {
    try {
        const term = await service.getTermById(req.params.id);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data: term,
        });
    } catch (err) {
        return next(err);
    }
};

const updateTerm = async (req, res, next) => {
    try {
        const term = await service.updateTerm(req.params.id, req.body);
        return successResponse(res, {
        message: 'Periode akademik berhasil diperbarui!',
        data: term,
        });
    } catch (err) {
        return next(err);
    }
};

const patchTermSemester = async (req, res, next) => {
    try {
        const term = await service.patchTermSemester(req.params.id, req.body.semesterType);
        return successResponse(res, {
        message: 'Semester periode berhasil diperbarui!',
        data: term,
        });
    } catch (err) {
        return next(err);
    }
};

const setSemesters = async (req, res, next) => {
    try {
        const term = await service.setSemesters(req.params.id, req.body.semesters);
        return successResponse(res, {
            message: 'Semester berhasil disimpan!',
            data: term,
        });
    } catch (err) {
        return next(err);
    }
};

const deleteTerm = async (req, res, next) => {
    try {
        await service.deleteTerm(req.params.id);
        return successResponse(res, {
        message: 'Periode akademik berhasil dihapus!',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getTerms,
    getTermById,
    createTerm,
    updateTerm,
    patchTermSemester,
    setSemesters,
    deleteTerm,
};