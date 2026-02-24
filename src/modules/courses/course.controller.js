const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const courseService = require('./course.service');

const createCourseSchema = Joi.object({
    kodeMatkul: Joi.string().required(),
    namaMatkul: Joi.string().required(),
    sks: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('aktif', 'tidak aktif').required(),
    idPeriode: Joi.string().required(),
    idPengajar: Joi.array().items(Joi.string()).min(1).required(),
    idMahasiswa: Joi.array().items(Joi.string()).default([]),
    kelas: Joi.string().required(),
    deskripsi: Joi.object().optional(),
});

const updateCourseSchema = Joi.object({
    kodeMatkul: Joi.string().optional(),
    namaMatkul: Joi.string().optional(),
    sks: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('aktif', 'tidak aktif').optional(),
    idPeriode: Joi.string().optional(),
    idPengajar: Joi.array().items(Joi.string()).min(1).optional(),
    idMahasiswa: Joi.array().items(Joi.string()).optional(),
    kelas: Joi.string().optional(),
    deskripsi: Joi.object().optional(),
}).min(1);

const patchDeskripsiSchema = Joi.object({
    deskripsi: Joi.object().required(),
});

const getCourses = async (req, res, next) => {
    try {
        const result = await courseService.listCourses(req.query, req.user);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data: result.items,
        pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
};

const getCourseById = async (req, res, next) => {
    try {
        const data = await courseService.getCourseById(req.params.id);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const createCourse = async (req, res, next) => {
    try {
        const { error, value } = createCourseSchema.validate(req.body);
        if (error) throw error;

        const data = await courseService.createCourse(value);
        return successResponse(res, {
        statusCode: 201,
        message: 'data berhasil dibuat!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateCourse = async (req, res, next) => {
    try {
        const { error, value } = updateCourseSchema.validate(req.body);
        if (error) throw error;

        const data = await courseService.updateCourse(req.params.id, value);
        return successResponse(res, {
        message: 'data berhasil diperbarui!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const patchDeskripsi = async (req, res, next) => {
    try {
        const { error, value } = patchDeskripsiSchema.validate(req.body);
        if (error) throw error;

        await courseService.patchDeskripsi(req.params.id, value.deskripsi);
        return successResponse(res, {
        message: 'deskripsi matakuliah berhasil diupdate!',
        });
    } catch (err) {
        return next(err);
    }
};

const deleteCourse = async (req, res, next) => {
    try {
        await courseService.deleteCourse(req.params.id);
        return successResponse(res, {
        message: 'data berhasil dihapus!',
        });
    } catch (err) {
        return next(err);
    }
};

const addPengajarSchema = Joi.object({
    idPengajar: Joi.array().items(Joi.string()).min(1).required(),
});

const addPengajar = async (req, res, next) => {
    try {
        const { error, value } = addPengajarSchema.validate(req.body);
        if (error) throw error;

        const data = await courseService.addPengajar(req.params.id, value.idPengajar);
        return successResponse(res, {
        statusCode: 201,
        message: 'Dosen berhasil ditambahkan ke matakuliah!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const removePengajar = async (req, res, next) => {
    try {
        await courseService.removePengajar(req.params.id, req.params.dosenId);
        return successResponse(res, {
        message: 'Dosen berhasil dihapus dari matakuliah!',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    patchDeskripsi,
    deleteCourse,
    addPengajar,
    removePengajar,
};
