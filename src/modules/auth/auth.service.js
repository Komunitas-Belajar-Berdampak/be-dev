const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');
const { comparePassword, signAccessToken } = require('./auth.utils');

const login = async (nrp, password) => {
    const user = await User.findOne({ nrp })
        .populate('roleIds')
        .lean();

    if (!user) {
        throw new ApiError(401, 'NRP atau password salah');
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
        throw new ApiError(401, 'NRP atau password salah');
    }

    const roleNames = (user.roleIds || []).map((r) => r.nama);

    const token = signAccessToken({
        sub: user._id.toString(),
        nrp: user.nrp,
        nama: user.nama,
        roles: roleNames,
    });

    return {
        token,
        user: {
        id: user._id,
        nrp: user.nrp,
        nama: user.nama,
        namaRole: roleNames, 
        },
    };
};

module.exports = { login };