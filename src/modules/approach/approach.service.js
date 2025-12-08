const mongoose = require('mongoose');
const Approach = require('./approach.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');

const mapResponse = (doc, mahasiswa) => ({
    id: doc._id.toString(),
    mahasiswa: {
        id: mahasiswa._id.toString(),
        nrp: mahasiswa.nrp,
        nama: mahasiswa.nama,
    },
    gayaBelajar: doc.gayaBelajar || [],
});

const getApproachByUser = async (idUser) => {
    if (!mongoose.isValidObjectId(idUser)) {
        throw new ApiError(400, 'ID user tidak valid');
    }

    const mahasiswa = await User.findById(idUser).lean();
    if (!mahasiswa) throw new ApiError(404, 'Mahasiswa tidak ditemukan');

    const doc = await Approach.findOne({ idMahasiswa: idUser }).lean();
    if (!doc) {
        throw new ApiError(404, 'Profil gaya belajar belum dibuat');
    }

    return mapResponse(doc, mahasiswa);
};

const createApproach = async (idUser, gayaBelajar) => {
    if (!mongoose.isValidObjectId(idUser)) {
        throw new ApiError(400, 'ID user tidak valid');
    }

    const mahasiswa = await User.findById(idUser).lean();
    if (!mahasiswa) throw new ApiError(404, 'Mahasiswa tidak ditemukan');

    const existing = await Approach.findOne({ idMahasiswa: idUser }).lean();
    if (existing) {
        throw new ApiError(400, 'Profil gaya belajar sudah ada, gunakan PATCH untuk mengubah');
    }

    const doc = await Approach.create({
        idMahasiswa: idUser,
        gayaBelajar,
    });

    return mapResponse(doc.toObject(), mahasiswa);
};

const updateApproach = async (idUser, gayaBelajar) => {
    if (!mongoose.isValidObjectId(idUser)) {
        throw new ApiError(400, 'ID user tidak valid');
    }

    const mahasiswa = await User.findById(idUser).lean();
    if (!mahasiswa) throw new ApiError(404, 'Mahasiswa tidak ditemukan');

    let doc = await Approach.findOne({ idMahasiswa: idUser });
    if (!doc) {
        throw new ApiError(404, 'Profil gaya belajar belum dibuat');
    }

    doc.gayaBelajar = gayaBelajar || [];
    await doc.save();

    return mapResponse(doc.toObject(), mahasiswa);
};

module.exports = {
    getApproachByUser,
    createApproach,
    updateApproach,
};
