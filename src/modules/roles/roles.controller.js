const { successResponse } = require('../../utils/http');
const rolesService = require('./roles.service');

const getRoles = async (req, res, next) => {
    try {
        const roles = await rolesService.listRoles();
        return successResponse(res, {
            message: 'Data role berhasil diambil!',
            data: roles,
        });
    } catch (err) {
        return next(err);
    }
};

const createRole = async (req, res, next) => {
    try {
        const role = await rolesService.createRole(req.body);
        return successResponse(res, {
            statusCode: 201,
            message: 'Role berhasil dibuat!',
            data: role,
        });
    } catch (err) {
        return next(err);
    }
};

const updateRole = async (req, res, next) => {
    try {
        const role = await rolesService.updateRole(
            req.params.id,
            req.body,
        );
        return successResponse(res, {
            message: 'Role berhasil diubah!',
            data: role,
        });
    } catch (err) {
        return next(err);
    }
};

const deleteRole = async (req, res, next) => {
    try {
        await rolesService.deleteRole(req.params.id);
        return successResponse(res, {
            message: 'Role berhasil dihapus!',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
};