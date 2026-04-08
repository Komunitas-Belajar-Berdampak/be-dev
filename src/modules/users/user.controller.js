const { successResponse, ApiError } = require('../../utils/http');
const { uploadFile } = require('../../libs/s3');
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

const getUserByNrp = async (req, res, next) => {
    try {
        const isSuperAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('SUPER_ADMIN');

        const user = await userService.getUserByNrp(req.params.nrp);

        const isOwner = user.id === req.user.sub;

        if (!isSuperAdmin && !isOwner) {
            delete user.email;
            delete user.alamat;
            delete user.isDefaultPassword;
        }

        return successResponse(res, {
            message: 'data berhasil diambil!',
            data: user,
        });
    } catch (err) {
        return next(err);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const isSuperAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('SUPER_ADMIN');
        const isOwner = req.params.id === req.user.sub;

        const user = await userService.getUserById(req.params.id);

        if (!isSuperAdmin && !isOwner) {
            delete user.email;
            delete user.alamat;
            delete user.isDefaultPassword;
        }

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

const uploadAvatar = async (req, res, next) => {
    try {
        const avatarUrl = await uploadFile(req.file, 'profiles');
        await userService.patchUser(req.user.sub, { fotoProfil: avatarUrl });
        return successResponse(res, {
            message: 'foto profil berhasil diperbarui!',
            data: { fotoProfil: avatarUrl },
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getUsers,
    getUserByNrp,
    getUserById,
    createUser,
    updateUser,
    patchUser,
    uploadAvatar,
};