const { successResponse } = require('../../utils/http');
const userService = require('./user.service');

const getUsers = async (req, res, next) => {
    try {
        const result = await userService.listUsers(req.query);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data: result.items,
        pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data: user,
        });
    } catch (err) {
        return next(err);
    }
};

const createUser = async (req, res, next) => {
    try {
        const created = await userService.createUser(req.body);
        return successResponse(res, {
        statusCode: 201,
        message: 'user berhasil dibuat',
        data: created,
        });
    } catch (err) {
        return next(err);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const updated = await userService.updateUser(
        req.params.id,
        req.body,
        );
        return successResponse(res, {
        message: 'user berhasil diubah!',
        data: updated,
        });
    } catch (err) {
        return next(err);
    }
};

const patchUser = async (req, res, next) => {
    try {
        await userService.patchUser(req.user.sub, req.body);
        return successResponse(res, {
        message: 'data berhasil diubah!',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    patchUser,
};