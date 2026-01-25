const mongoose = require('mongoose');
const User = require('./user.model');
const Role = require('../roles/roles.model');
const { ApiError } = require('../../utils/http');
const { hashPassword, comparePassword } = require('../auth/auth.utils');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const mapUserListItem = (u) => {
    const primaryRole =
        Array.isArray(u.roleIds) && u.roleIds.length > 0
        ? u.roleIds[0].nama
        : null;

    return {
        id: u._id.toString(),
        nrp: u.nrp,
        nama: u.nama,
        angkatan: u.angkatan,
        prodi: u.idProdi?.namaProdi || null,
        status: u.status,
        role: primaryRole,
    };
};

const mapUserDetail = (u) => {
    const primaryRole =
        Array.isArray(u.roleIds) && u.roleIds.length > 0
        ? u.roleIds[0].nama
        : null;

    return {
        id: u._id.toString(),
        nrp: u.nrp,
        nama: u.nama,
        namaRole: primaryRole,
        angkatan: u.angkatan,
        prodi: u.idProdi?.namaProdi || null,
        email: u.email,
        alamat: u.alamat,
        jenisKelamin: u.jenisKelamin,
        status: u.status,
        fotoProfil: u.fotoProfil || null,
    };
};

const listUsers = async (filters) => {
    const { role, angkatan, prodi, status } = filters;
    const { page, limit, skip } = parsePagination(filters);

    const query = {};
    if (angkatan) query.angkatan = angkatan;
    if (status) query.status = status;

    if (prodi) {
        if (!mongoose.isValidObjectId(prodi)) throw new ApiError(400, 'Parameter prodi tidak valid');
        query.idProdi = prodi;
    }

    if (role) {
        let roleIdFilter = null;
        if (mongoose.isValidObjectId(role)) {
        roleIdFilter = role;
        } else {
        const roleDoc = await Role.findOne({ nama: { $regex: `^${role}$`, $options: 'i' } }).lean();
        if (!roleDoc) {
            return {
            items: [],
            pagination: buildPagination({ page, limit, totalItems: 0 }),
            };
        }
        roleIdFilter = roleDoc._id;
        }
        query.roleIds = roleIdFilter;
    }

    const totalItems = await User.countDocuments(query);

    const users = await User.find(query)
        .populate('idProdi', 'namaProdi')
        .populate('roleIds', 'nama')
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: users.map(mapUserListItem),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getUserById = async (id) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID user tidak valid');
    }

    const user = await User.findById(id)
        .populate('idProdi', 'namaProdi')
        .populate('roleIds', 'nama')
        .lean();

    if (!user) {
        throw new ApiError(404, 'User tidak ditemukan');
    }

    return mapUserDetail(user);
};

const createUser = async (payload) => {
    const {
        nrp,
        idRole,
        idProdi,
        nama,
        angkatan,
        email,
        alamat,
        jenisKelamin,
        status,
        password,
        fotoProfil,
    } = payload;

    const existsNrp = await User.findOne({ nrp }).lean();
    if (existsNrp) {
        throw new ApiError(400, 'NRP sudah digunakan');
    }

    const existsEmail = await User.findOne({ email }).lean();
    if (existsEmail) {
        throw new ApiError(400, 'Email sudah digunakan');
    }

    if (!mongoose.isValidObjectId(idRole)) {
        throw new ApiError(400, 'idRole tidak valid');
    }
    const role = await Role.findById(idRole).lean();
    if (!role) {
        throw new ApiError(404, 'Role tidak ditemukan');
    }

    if (!mongoose.isValidObjectId(idProdi)) {
        throw new ApiError(400, 'idProdi tidak valid');
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
        nrp,
        nama,
        angkatan,
        idProdi,
        email,
        alamat,
        jenisKelamin,
        status,
        passwordHash,
        roleIds: [idRole],
        fotoProfil,
    });

    const created = await User.findById(user._id)
        .populate('idProdi', 'namaProdi')
        .populate('roleIds', 'nama')
        .lean();

    return mapUserDetail(created);
};

const updateUser = async (id, payload) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID user tidak valid');
    }

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User tidak ditemukan');
    }

    const {
        nrp,
        idRole,
        idProdi,
        nama,
        angkatan,
        email,
        alamat,
        jenisKelamin,
        status,
        password,
        fotoProfil,
    } = payload;

    if (nrp && nrp !== user.nrp) {
        const existsNrp = await User.findOne({ nrp, _id: { $ne: id } }).lean();
        if (existsNrp) {
        throw new ApiError(400, 'NRP sudah digunakan');
        }
        user.nrp = nrp;
    }

    if (email && email !== user.email) {
        const existsEmail = await User.findOne({
        email,
        _id: { $ne: id },
        }).lean();
        if (existsEmail) {
        throw new ApiError(400, 'Email sudah digunakan');
        }
        user.email = email;
    }

    if (idRole) {
        if (!mongoose.isValidObjectId(idRole)) {
        throw new ApiError(400, 'idRole tidak valid');
        }
        const role = await Role.findById(idRole).lean();
        if (!role) {
        throw new ApiError(404, 'Role tidak ditemukan');
        }
        user.roleIds = [idRole];
    }

    if (idProdi) {
        if (!mongoose.isValidObjectId(idProdi)) {
        throw new ApiError(400, 'idProdi tidak valid');
        }
        user.idProdi = idProdi;
    }

    if (nama !== undefined) user.nama = nama;
    if (angkatan !== undefined) user.angkatan = angkatan;
    if (alamat !== undefined) user.alamat = alamat;
    if (jenisKelamin !== undefined) user.jenisKelamin = jenisKelamin;
    if (status !== undefined) user.status = status;
    if (fotoProfil !== undefined) user.fotoProfil = fotoProfil;

    if (password) {
        user.passwordHash = await hashPassword(password);
    }

    await user.save();

    const updated = await User.findById(user._id)
        .populate('idProdi', 'namaProdi')
        .populate('roleIds', 'nama')
        .lean();

    return mapUserDetail(updated);
};

const patchUser = async (id, payload) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID user tidak valid');
    }

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User tidak ditemukan');
    }

    const { passwordLama, passwordBaru, fotoProfil, alamat, nama } = payload;

    if (passwordBaru) {
        if (!passwordLama) {
            throw new ApiError(400, 'passwordLama wajib diisi saat mengganti password');
        }
        const ok = await comparePassword(passwordLama, user.passwordHash);
        if (!ok) {
            throw new ApiError(400, 'Password lama tidak cocok');
        }
        user.passwordHash = await hashPassword(passwordBaru);
    }

    if (fotoProfil !== undefined) user.fotoProfil = fotoProfil;
    if (alamat !== undefined) user.alamat = alamat;
    if (nama !== undefined) user.nama = nama;

    await user.save();
};

module.exports = {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    patchUser,
};