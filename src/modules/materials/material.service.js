const mongoose = require('mongoose');
const Material = require('./material.model');
const Meeting = require('../meetings/meeting.model');
const Course = require('../courses/course.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const isMahasiswa = (user) =>
    Array.isArray(user.roles) && user.roles.includes('MAHASISWA');

const mapMaterial = (m) => ({
    id: m._id.toString(),
    namaFile: m.namaFile,
    deskripsi: m.deskripsi,
    pathFile: m.pathFile,
    visibility: m.status,
});

const listMaterialsByCourse = async (idCourse, user, query) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const { page, limit, skip } = parsePagination(query);

    const filter = { idCourse };
    if (isMahasiswa(user)) filter.status = 'VISIBLE';

    const totalItems = await Material.countDocuments(filter);

    const materials = await Material.find(filter)
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: materials.map(mapMaterial),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const listMaterialsByMeeting = async (idCourse, pertemuan, user, query) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');

    const meeting = await Meeting.findOne({ idCourse, pertemuan }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const { page, limit, skip } = parsePagination(query);

    const filter = { idCourse, idMeeting: meeting._id };
    if (isMahasiswa(user)) filter.status = 'VISIBLE';

    const totalItems = await Material.countDocuments(filter);

    const materials = await Material.find(filter)
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: materials.map(mapMaterial),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getMaterialDetail = async (idCourse, pertemuan, idMaterial, user) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }
    if (!mongoose.isValidObjectId(idMaterial)) {
        throw new ApiError(400, 'ID material tidak valid');
    }

    const meeting = await Meeting.findOne({
        idCourse,
        pertemuan,
    }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const material = await Material.findOne({
        _id: idMaterial,
        idCourse,
        idMeeting: meeting._id,
    }).lean();

    if (!material) throw new ApiError(404, 'Material tidak ditemukan');

    if (isMahasiswa(user) && material.status !== 'VISIBLE') {
        throw new ApiError(403, 'Anda tidak boleh mengakses resource ini');
    }

    return {
        id: material._id.toString(),
        idMeeting: material.idMeeting.toString(),
        idCourse: material.idCourse.toString(),
        namaFile: material.namaFile,
        pathFile: material.pathFile,
        visibility: material.status,
        deskripsi: material.deskripsi,
    };
};

const createMaterial = async (idCourse, pertemuan, payload) => {
    const { namaFile, tipe, pathFile, visibility, deskripsi } = payload;

    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const meeting = await Meeting.findOne({
        idCourse,
        pertemuan,
    }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const material = await Material.create({
        idCourse,
        idMeeting: meeting._id,
        namaFile,
        tipe,
        pathFile,
        status: visibility || 'HIDE',
        deskripsi,
    });

    return {
        id: material._id.toString(),
        namaFile: material.namaFile,
        pathFile: material.pathFile,
        visibility: material.status,
        deskripsi: material.deskripsi,
    };
};

const updateMaterial = async (idCourse, pertemuan, idMaterial, payload) => {
    if (!mongoose.isValidObjectId(idCourse) || !mongoose.isValidObjectId(idMaterial)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const meeting = await Meeting.findOne({
        idCourse,
        pertemuan,
    }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const material = await Material.findOne({
        _id: idMaterial,
        idCourse,
        idMeeting: meeting._id,
    });

    if (!material) throw new ApiError(404, 'Material tidak ditemukan');

    const { namaFile, tipe, pathFile, visibility, deskripsi } = payload;

    if (namaFile !== undefined) material.namaFile = namaFile;
    if (tipe !== undefined) material.tipe = tipe;
    if (pathFile !== undefined) material.pathFile = pathFile;
    if (visibility !== undefined) material.status = visibility;
    if (deskripsi !== undefined) material.deskripsi = deskripsi;

    await material.save();
};

const deleteMaterial = async (idCourse, pertemuan, idMaterial) => {
    if (!mongoose.isValidObjectId(idCourse) || !mongoose.isValidObjectId(idMaterial)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const meeting = await Meeting.findOne({
        idCourse,
        pertemuan,
    }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const deleted = await Material.findOneAndDelete({
        _id: idMaterial,
        idCourse,
        idMeeting: meeting._id,
    });

    if (!deleted) throw new ApiError(404, 'Material tidak ditemukan');
};

const getMaterialById = async (idMaterial, user) => {
    if (!mongoose.isValidObjectId(idMaterial)) {
        throw new ApiError(400, 'ID material tidak valid');
    }

    const material = await Material.findById(idMaterial).lean();
    if (!material) throw new ApiError(404, 'Material tidak ditemukan');

    if (isMahasiswa(user) && material.status !== 'VISIBLE') {
        throw new ApiError(403, 'Anda tidak boleh mengakses resource ini');
    }

    return {
        id: material._id.toString(),
        idMeeting: material.idMeeting.toString(),
        idCourse: material.idCourse.toString(),
        namaFile: material.namaFile,
        pathFile: material.pathFile,
        visibility: material.status,
        deskripsi: material.deskripsi,
    };
};

const updateMaterialById = async (idMaterial, payload) => {
    if (!mongoose.isValidObjectId(idMaterial)) {
        throw new ApiError(400, 'ID material tidak valid');
    }

    const material = await Material.findById(idMaterial);
    if (!material) throw new ApiError(404, 'Material tidak ditemukan');

    const { namaFile, tipe, pathFile, visibility, deskripsi } = payload;

    if (namaFile !== undefined) material.namaFile = namaFile;
    if (tipe !== undefined) material.tipe = tipe;
    if (pathFile !== undefined) material.pathFile = pathFile;
    if (visibility !== undefined) material.status = visibility;
    if (deskripsi !== undefined) material.deskripsi = deskripsi;

    await material.save();
};

const deleteMaterialById = async (idMaterial) => {
    if (!mongoose.isValidObjectId(idMaterial)) {
        throw new ApiError(400, 'ID material tidak valid');
    }

    const deleted = await Material.findByIdAndDelete(idMaterial);
    if (!deleted) throw new ApiError(404, 'Material tidak ditemukan');
};

module.exports = {
    listMaterialsByCourse,
    listMaterialsByMeeting,
    getMaterialDetail,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialById,
    updateMaterialById,
    deleteMaterialById,
};