const { ApiError } = require('../utils/http');

const requireRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Token tidak ditemukan'));
    }

    if (!allowedRoles.length) {
        return next();
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];

    const ok = allowedRoles.some((role) => userRoles.includes(role));
    if (!ok) {
        return next(
        new ApiError(
            403,
            'Anda tidak boleh mengakses resource ini',
        ),
        );
    }

    return next();
};

module.exports = requireRoles;