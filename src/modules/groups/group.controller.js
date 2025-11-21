const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const groupService = require('./group.service');
const membershipService = require('./membership.service');

const createGroupSchema = Joi.object({
    nama: Joi.string().optional(),
    deskripsi: Joi.string().allow('', null).optional(),
    idMahasiswa: Joi.array().items(Joi.string()).optional(),
    status: Joi.boolean().optional(), 
    kapasitas: Joi.number().integer().min(1).required(),
});

const updateGroupSchema = Joi.object({
    nama: Joi.string().optional(),
    deskripsi: Joi.string().allow('', null).optional(),
    idMahasiswa: Joi.array().items(Joi.string()).optional(),
    status: Joi.boolean().optional(),
    kapasitas: Joi.number().integer().min(1).optional(),
}).min(1);

const getGroupsByCourse = async (req, res, next) => {
    try {
        const data = await groupService.listGroupsByCourse(req.params.idCourse);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getGroupDetail = async (req, res, next) => {
    try {
        const data = await groupService.getGroupDetail(
        req.params.idCourse,
        req.params.idGroup,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getUserDetailInGroup = async (req, res, next) => {
    try {
        const data = await groupService.getUserDetailInGroup(
        req.params.idCourse,
        req.params.idGroup,
        req.params.idUser,
        );
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const createGroup = async (req, res, next) => {
    try {
        const { error, value } = createGroupSchema.validate(req.body);
        if (error) throw error;

        const data = await groupService.createGroup(req.params.idCourse, value);

        return successResponse(res, {
        statusCode: 201,
        message: 'kelompok berhasil dibuat!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateGroup = async (req, res, next) => {
    try {
        const { error, value } = updateGroupSchema.validate(req.body);
        if (error) throw error;

        await groupService.updateGroup(
        req.params.idCourse,
        req.params.idGroup,
        value,
        );

        return successResponse(res, {
        message: 'kelompok berhasil diubah!',
        });
    } catch (err) {
        return next(err);
    }
};

const deleteGroup = async (req, res, next) => {
    try {
        await groupService.deleteGroup(req.params.idCourse, req.params.idGroup);
        return successResponse(res, {
        message: 'kelompok berhasil dihapus!',
        });
    } catch (err) {
        return next(err);
    }
};

const getMemberships = async (req, res, next) => {
    try {
        const data = await membershipService.listMemberships(req.params.idGroup);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const joinGroup = async (req, res, next) => {
    try {
        const result = await membershipService.joinGroup(
        req.params.idGroup,
        req.user.sub,
        );
        return successResponse(res, {
        message: 'pengajuan join terkirim!',
        data: {
            status: result.status,
        },
        });
    } catch (err) {
        return next(err);
    }
};

const approveMembership = async (req, res, next) => {
    try {
        await membershipService.approveMembership(
        req.params.idGroup,
        req.params.idMembership,
        );
        return successResponse(res, {
        message: 'anggota berhasil di-approve!',
        });
    } catch (err) {
        return next(err);
    }
};

const rejectMembership = async (req, res, next) => {
    try {
        await membershipService.rejectMembership(
        req.params.idGroup,
        req.params.idMembership,
        );
        return successResponse(res, {
        message: 'pengajuan ditolak!',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getGroupsByCourse,
    getGroupDetail,
    getUserDetailInGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    getMemberships,
    joinGroup,
    approveMembership,
    rejectMembership,
};
