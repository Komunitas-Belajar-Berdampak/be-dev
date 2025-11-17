const { successResponse } = require('../../utils/http');
const service = require('./academic-term.service');

const getTerms = async (req, res, next) => {
    try {
        const data = await service.listTerms();
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
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
    createTerm,
    deleteTerm,
};