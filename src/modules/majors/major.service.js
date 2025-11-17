const mongoose = require('mongoose');
const Major = require('./major.model');
const Faculty = require('../faculties/faculty.model');
const { ApiError } = require('../../utils/http');

const listMajors = async () => {
    const majors = await Major.find()
        .populate('idFakultas', 'namaFakultas')
        .sort({ namaProdi: 1 })
        .lean();

    return majors.map((m) => ({
        id: m._id.toString(),
        kodeProdi: m.kodeProdi,
        namaFakultas: m.idFakultas?.namaFakultas || null,
        namaProdi: m.namaProdi,
    }));
};

const createMajor = async ({ kodeProdi, namaProdi, idFakultas }) => {
    if (!mongoose.isValidObjectId(idFakultas)) {
        throw new ApiError(400, 'idFakultas tidak valid');
    }

    const fac = await Faculty.findById(idFakultas).lean();
    if (!fac) {
        throw new ApiError(404, 'Fakultas tidak ditemukan');
    }

    const existsKode = await Major.findOne({ kodeProdi }).lean();
    if (existsKode) {
        throw new ApiError(400, 'Kode prodi sudah digunakan');
    }

    const major = await Major.create({
        kodeProdi,
        namaProdi,
        idFakultas,
    });

    return {
        kodeProdi: major.kodeProdi,
        namaFakultas: fac.namaFakultas,
        namaProdi: major.namaProdi,
    };
};

const updateMajor = async (id, { kodeProdi, namaProdi, idFakultas }) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID prodi tidak valid');
    }

    const major = await Major.findById(id);
    if (!major) {
        throw new ApiError(404, 'Prodi tidak ditemukan');
    }

    if (kodeProdi && kodeProdi !== major.kodeProdi) {
        const existsKode = await Major.findOne({
        _id: { $ne: id },
        kodeProdi,
        }).lean();
        if (existsKode) {
        throw new ApiError(400, 'Kode prodi sudah digunakan');
        }
        major.kodeProdi = kodeProdi;
    }

    if (namaProdi !== undefined) {
        major.namaProdi = namaProdi;
    }

    let facName = null;
    if (idFakultas) {
        if (!mongoose.isValidObjectId(idFakultas)) {
        throw new ApiError(400, 'idFakultas tidak valid');
        }
        const fac = await Faculty.findById(idFakultas).lean();
        if (!fac) {
        throw new ApiError(404, 'Fakultas tidak ditemukan');
        }
        major.idFakultas = idFakultas;
        facName = fac.namaFakultas;
    }

    await major.save();

    // kalau tidak ganti fakultas, populate dulu untuk ambil namanya
    if (!facName) {
        const populated = await Major.findById(id)
        .populate('idFakultas', 'namaFakultas')
        .lean();
        facName = populated.idFakultas?.namaFakultas || null;
    }

    return {
        kodeProdi: major.kodeProdi,
        namaFakultas: facName,
        namaProdi: major.namaProdi,
    };
};

module.exports = {
    listMajors,
    createMajor,
    updateMajor,
};