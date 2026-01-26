const { successResponse } = require('../../utils/http');
const authService = require('./auth.service');

const login = async (req, res, next) => {
    try {
        const { nrp, password } = req.body;
        const result = await authService.login(nrp, password);

        return successResponse(res, {
        message: 'login berhasil!',
        data: result,
        });
    } catch (err) {
        return next(err);
    }
};

const logout = async (req, res, next) => {
    try {
        return successResponse(res, {
        message: 'logged out berhasil!',
        });
    } catch (err) {
        return next(err);
    }
};

const getMe = async (req, res, next) => {
    try {
        return successResponse(res, {
        message: 'user terverifikasi!',
        user: {
            nrp: req.user.nrp,
            nama: req.user.nama,
            namaRole: req.user.roles.join(','),
        },
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    login,
    logout,
    getMe,
};