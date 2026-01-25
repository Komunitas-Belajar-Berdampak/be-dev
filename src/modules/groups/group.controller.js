const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const groupService = require('./group.service');
const membershipService = require('./membership.service');
const threadService = require('./thread.service');
const postService = require('./post.service');
const taskService = require('./task.service');

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

const createThreadSchema = Joi.object({
    judul: Joi.string().required(),
    idAssignment: Joi.string().optional(),
});

const createPostSchema = Joi.object({
    konten: Joi.object().required(),
});

const updatePostSchema = Joi.object({
    konten: Joi.object().required(),
});

const createTaskSchema = Joi.object({
    task: Joi.string().required(),
    IdMahasiswa: Joi.array().items(Joi.string()).required(),
    status: Joi.string()
        .valid('DO', 'IN PROGRESS', 'DONE')
        .required(),
});

const updateTaskSchema = Joi.object({
    task: Joi.string().optional(),
    IdMahasiswa: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('DO', 'IN PROGRESS', 'DONE').optional(),
}).min(1);


const getGroupsByCourse = async (req, res, next) => {
    try {
        const result = await groupService.listGroupsByCourse(req.params.idCourse, req.query);
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
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
        const result = await membershipService.listMemberships(req.params.idGroup, req.query);
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
};

const getThreadsByGroup = async (req, res, next) => {
    try {
        const result = await threadService.listThreadsByGroup(req.params.idGroup, req.query);
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
};

const createThread = async (req, res, next) => {
    try {
        const { error, value } = createThreadSchema.validate(req.body);
        if (error) throw error;

        const data = await threadService.createThread(
        req.params.idGroup,
        value,
        req.user,
        );

        return successResponse(res, {
        statusCode: 201,
        message: 'thread dibuat!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const getPostsByThread = async (req, res, next) => {
    try {
        const result = await postService.listPostsByThread(req.params.idThread, req.query);
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
};

const createPost = async (req, res, next) => {
    try {
        const { error, value } = createPostSchema.validate(req.body);
        if (error) throw error;

        const data = await postService.createPost(
        req.params.idThread,
        req.user,
        value.konten,
        );

        return successResponse(res, {
        statusCode: 201,
        message: 'post dibuat!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const updatePostController = async (req, res, next) => {
    try {
        const { error, value } = updatePostSchema.validate(req.body);
        if (error) throw error;

        await postService.updatePost(
        req.params.idThread,
        req.params.idPost,
        req.user,
        value.konten,
        );

        return successResponse(res, {
        message: 'post berhasil diedit!',
        });
    } catch (err) {
        return next(err);
    }
};

const deletePostController = async (req, res, next) => {
    try {
        await postService.deletePost(
        req.params.idThread,
        req.params.idPost,
        req.user,
        );
        return successResponse(res, {
        message: 'post berhasil dihapus!',
        });
    } catch (err) {
        return next(err);
    }
};

const getTasksByThread = async (req, res, next) => {
    try {
        const result = await taskService.listTasksByThread(req.params.idThread, req.query);
        return successResponse(res, { message: 'data berhasil diambil!', data: result.items, pagination: result.pagination });
    } catch (err) { return next(err); }
};

const createTask = async (req, res, next) => {
    try {
        const { error, value } = createTaskSchema.validate(req.body);
        if (error) throw error;

        const data = await taskService.createTask(
        req.params.idThread,
        value,
        req.user,
        );

        return successResponse(res, {
        statusCode: 201,
        message: 'data berhasil ditambah!',
        data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateTaskController = async (req, res, next) => {
    try {
        const { error, value } = updateTaskSchema.validate(req.body);
        if (error) throw error;

        await taskService.updateTask(
        req.params.idThread,
        req.params.idTask,
        value,
        req.user,
        );

        return successResponse(res, {
        message: 'task diubah!',
        });
    } catch (err) {
        return next(err);
    }
};

const deleteTaskController = async (req, res, next) => {
    try {
        await taskService.deleteTask(
        req.params.idThread,
        req.params.idTask,
        req.user,
        );

        return successResponse(res, {
        message: 'task dihapus!',
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
    getThreadsByGroup,
    createThread,
    getPostsByThread,
    createPost,
    updatePostController,
    deletePostController,
    getTasksByThread,
    createTask,
    updateTaskController,
    deleteTaskController,
};
