const mongoose = require('mongoose');
const Faculty = require('./faculty.model');
const Major = require('../majors/major.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const listFaculties = async (query) => {
    const { page, limit, skip } = parsePagination(query);

    const totalItems = await Faculty.countDocuments({});
    const faculties = await Faculty.find({})
        .sort({ namaFakultas: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const facultyIds = faculties.map((f) => f._id);
    const majors = await Major.find({ idFakultas: { $in: facultyIds } }).lean();

    const majorsByFaculty = majors.reduce((acc, m) => {
        const key = m.idFakultas.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push({
        id: m._id.toString(),
        kodeProdi: m.kodeProdi,
        namaProdi: m.namaProdi,
        });
        return acc;
    }, {});

    return {
        items: faculties.map((f) => ({
        id: f._id.toString(),
        namaFakultas: f.namaFakultas,
        kodeFakultas: f.kodeFakultas || null,
        prodi: majorsByFaculty[f._id.toString()] || [],
        })),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const createFaculty = async ({ namaFakultas, kodeFakultas }) => {
    const existsNama = await Faculty.findOne({
        namaFakultas: { $regex: `^${namaFakultas}$`, $options: 'i' },
    }).lean();

    if (existsNama) {
        throw new ApiError(400, 'Nama fakultas sudah digunakan');
    }

    if (kodeFakultas) {
        const existsKode = await Faculty.findOne({ kodeFakultas }).lean();
        if (existsKode) {
        throw new ApiError(400, 'Kode fakultas sudah digunakan');
        }
    }

    const fac = await Faculty.create({ namaFakultas, kodeFakultas });

    return {
        id: fac._id.toString(),
        namaFakultas: fac.namaFakultas,
        kodeFakultas: fac.kodeFakultas || null,
    };
};

const updateFaculty = async (id, { namaFakultas, kodeFakultas }) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID fakultas tidak valid');
    }

    const fac = await Faculty.findById(id);
    if (!fac) {
        throw new ApiError(404, 'Fakultas tidak ditemukan');
    }

    if (namaFakultas && namaFakultas !== fac.namaFakultas) {
        const existsNama = await Faculty.findOne({
        _id: { $ne: id },
        namaFakultas: { $regex: `^${namaFakultas}$`, $options: 'i' },
        }).lean();
        if (existsNama) {
        throw new ApiError(400, 'Nama fakultas sudah digunakan');
        }
        fac.namaFakultas = namaFakultas;
    }

    if (kodeFakultas && kodeFakultas !== fac.kodeFakultas) {
        const existsKode = await Faculty.findOne({
        _id: { $ne: id },
        kodeFakultas,
        }).lean();
        if (existsKode) {
        throw new ApiError(400, 'Kode fakultas sudah digunakan');
        }
        fac.kodeFakultas = kodeFakultas;
    }

    await fac.save();

    return {
        id: fac._id.toString(),
        namaFakultas: fac.namaFakultas,
        kodeFakultas: fac.kodeFakultas || null,
    };
};

module.exports = {
    listFaculties,
    createFaculty,
    updateFaculty,
};