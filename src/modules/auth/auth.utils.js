const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const hashPassword = async (plain) => bcrypt.hash(plain, 10);

const comparePassword = async (plain, hash) =>
    bcrypt.compare(plain, hash);

const signAccessToken = (payload) =>
    jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });

module.exports = {
    hashPassword,
    comparePassword,
    signAccessToken,
};