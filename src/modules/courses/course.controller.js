const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const courseService = require('./course.service');
const meetingService = require('../meetings/meeting.service');
const materialService = require('../materials/material.service');
const assignmentService = require('../assignments/assignment.service');

const createCourseSchema = Joi.object({
    kodeMatkul: Joi.string().required(),
    namaMatkul: Joi.string().required(),
    sks: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('aktif', 'tidak aktif').required(),
    idPeriode: Joi.string().required(),
    idPengajar: Joi.string().required(),
    idMahasiswa: Joi.array().items(Joi.string()).default([]),
    kelas: Joi.string().required(),
});

const updateCourseSchema = Joi.object({
    kodeMatkul: Joi.string().optional(),
    namaMatkul: Joi.string().optional(),
    sks: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('aktif', 'tidak aktif').optional(),
    idPeriode: Joi.string().optional(),
    idPengajar: Joi.string().optional(),
    idMahasiswa: Joi.array().items(Joi.string()).optional(),
    kelas: Joi.string().optional(),
}).min(1);

const patchDeskripsiSchema = Joi.object({
    deskripsi: Joi.object().required(),
});

const upsertMeetingSchema = Joi.object({
    judul: Joi.string().required(),
    deskripsi: Joi.object().optional(),
});

const materialCreateSchema = Joi.object({
    namaFile: Joi.string().required(),
    tipe: Joi.string().required(),
    pathFile: Joi.string().required(),
    visibility: Joi.string().valid('HIDE', 'VISIBLE').optional(),
    deskripsi: Joi.object().optional(),
});

const materialUpdateSchema = Joi.object({
    namaFile: Joi.string().optional(),
    tipe: Joi.string().optional(),
    pathFile: Joi.string().optional(),
    visibility: Joi.string().valid('HIDE', 'VISIBLE').optional(),
    deskripsi: Joi.object().optional(),
}).min(1);

const assignmentCreateSchema = Joi.object({
    judul: Joi.string().required(),
    statusTugas: Joi.boolean().required(), 
    tenggat: Joi.date().iso().required(),
    status: Joi.string().valid('HIDE', 'VISIBLE').optional(),
    deskripsi: Joi.object().optional(),
    lampiran: Joi.string().optional(),
});

const assignmentUpdateSchema = Joi.object({
    judul: Joi.string().optional(),
    statusTugas: Joi.boolean().optional(),
    tenggat: Joi.date().iso().optional(),
    status: Joi.string().valid('HIDE', 'VISIBLE').optional(),
    deskripsi: Joi.object().optional(),
    lampiran: Joi.string().optional(),
}).min(1);

const getCourses = async (req, res, next) => {
    try {
        const data = await courseService.listCourses(req.query);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
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

const getMeetings = async (req, res, next) => {
    try {
        const data = await meetingService.listMeetingsByCourse(
        req.params.idCourse,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getMeetingDetail = async (req, res, next) => {
    try {
        const data = await meetingService.getMeetingByNumber(
        req.params.idCourse,
        Number(req.params.pertemuan),
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const putMeeting = async (req, res, next) => {
    try {
        const { error, value } = upsertMeetingSchema.validate(req.body);
        if (error) throw error;

        const m = await meetingService.upsertMeeting(
        req.params.idCourse,
        Number(req.params.pertemuan),
        value,
        );
        return successResponse(res, {
        message: `pertemuan ke - ${m.pertemuan} berhasil diubah!`,
        });
    } catch (err) {
        return next(err);
    }
};

const getAllMaterialsByCourse = async (req, res, next) => {
    try {
        const data = await materialService.listMaterialsByCourse(
        req.params.idCourse,
        req.user,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getMaterialsByMeeting = async (req, res, next) => {
    try {
        const data = await materialService.listMaterialsByMeeting(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.user,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getMaterialDetail = async (req, res, next) => {
    try {
        const data = await materialService.getMaterialDetail(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.params.idMaterial,
        req.user,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getAssignmentsByCourse = async (req, res, next) => {
    try {
        const data = await assignmentService.listAssignmentsByCourse(
        req.params.idCourse,
        req.user,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getAssignmentsByMeeting = async (req, res, next) => {
    try {
        const data = await assignmentService.listAssignmentsByMeeting(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.user,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getAssignmentDetail = async (req, res, next) => {
    try {
        const data = await assignmentService.getAssignmentDetail(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.params.idAssignment,
        req.user,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const createAssignment = async (req, res, next) => {
    try {
        const { error, value } = assignmentCreateSchema.validate(req.body);
        if (error) throw error;

        const data = await assignmentService.createAssignment(
        req.params.idCourse,
        Number(req.params.pertemuan),
        value,
        );

        return successResponse(res, {
        statusCode: 201,
        message: 'tugas berhasil dibuat!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateAssignment = async (req, res, next) => {
    try {
        const { error, value } = assignmentUpdateSchema.validate(req.body);
        if (error) throw error;

        await assignmentService.updateAssignment(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.params.idAssignment,
        value,
        );

        return successResponse(res, {
        message: 'tugas berhasil diubah!',
        });
    } catch (err) {
        return next(err);
    }
};

const deleteAssignment = async (req, res, next) => {
    try {
        await assignmentService.deleteAssignment(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.params.idAssignment,
        );

        return successResponse(res, {
        message: 'tugas berhasil dihapus!',
        });
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
        value,
        );
        return successResponse(res, {
        statusCode: 201,
        message: 'data berhasil diambil!',
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

        await materialService.updateMaterial(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.params.idMaterial,
        value,
        );
        return successResponse(res, {
        message: 'materi berhasil diubah!',
        });
    } catch (err) {
        return next(err);
    }
};

const deleteMaterial = async (req, res, next) => {
    try {
        await materialService.deleteMaterial(
        req.params.idCourse,
        Number(req.params.pertemuan),
        req.params.idMaterial,
        );
        return successResponse(res, {
        message: 'materi berhasil dihapus!',
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
    getMeetings,
    getMeetingDetail,
    putMeeting,
    getAllMaterialsByCourse,
    getMaterialsByMeeting,
    getMaterialDetail,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getAssignmentsByCourse,
    getAssignmentsByMeeting,
    getAssignmentDetail,
    createAssignment,
    updateAssignment,
    deleteAssignment,
};
