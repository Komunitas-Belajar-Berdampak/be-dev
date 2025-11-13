const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError } = require('../utils/http');

const auth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
        ? header.slice(7)
        : null;

    if (!token) {
        return next(new ApiError(401, 'Token tidak ditemukan'));
    }

    try {
        const payload = jwt.verify(token, config.jwt.secret);
        req.user = payload;
        return next();
    } catch (err) {
        return next(new ApiError(401, 'Token tidak valid'));
    }
};

module.exports = auth;