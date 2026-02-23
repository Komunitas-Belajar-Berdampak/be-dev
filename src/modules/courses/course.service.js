const mongoose = require('mongoose');
const Course = require('./course.model');
const AcademicTerm = require('../academicTerms/academic-term.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');


const mapCourseListItem = (c) => ({
    id: c._id.toString(),
    kodeMatkul: c.kodeMatkul,
    namaMatkul: c.namaMatkul,
    sks: c.sks,
    status: c.status,
    periode: c.idPeriode?.periode || null,
    deskripsi: c.deskripsi || null,
    pengajar: (c.idPengajar || []).filter(Boolean).map((p) => ({ id: p._id.toString(), nama: p.nama })),
    kelas: c.kelas,
});

const listCourses = async (filters, currentUser) => {
    const { page, limit, skip } = parsePagination(filters);
    const { kodeMatkul, status, periode, nrp, kelas, sks } = filters;

    const query = {};
    if (kodeMatkul) query.kodeMatkul = kodeMatkul;
    if (status) query.status = status;
    if (kelas) query.kelas = kelas;
    if (sks) query.sks = Number(sks);

    if (periode) {
        if (mongoose.isValidObjectId(periode)) {
        query.idPeriode = periode;
        } else {
        const term = await AcademicTerm.findOne({
            periode: { $regex: `^${periode}$`, $options: 'i' },
        }).lean();
        if (!term) {
            return { items: [], pagination: buildPagination({ page, limit, totalItems: 0 }) };
        }
        query.idPeriode = term._id;
        }
    }

    if (nrp) {
        const user = await User.findOne({ nrp }).lean();
        if (!user) {
        return { items: [], pagination: buildPagination({ page, limit, totalItems: 0 }) };
        }
        query.$or = [
        { idPengajar: user._id },
        { idMahasiswa: user._id },
        ];
    }

    const isSuperAdmin = Array.isArray(currentUser.roles) && currentUser.roles.includes('SUPER_ADMIN');
    const isDosen = Array.isArray(currentUser.roles) && currentUser.roles.includes('DOSEN');
    const isMahasiswa = Array.isArray(currentUser.roles) && currentUser.roles.includes('MAHASISWA');

    if (!isSuperAdmin && !nrp) {
        if (isDosen) {
        query.idPengajar = currentUser.sub;
        } else if (isMahasiswa) {
        query.idMahasiswa = currentUser.sub;
        }
    }

    const totalItems = await Course.countDocuments(query);

    const courses = await Course.find(query)
        .populate('idPeriode', 'periode')
        .populate('idPengajar', 'nama')
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: courses.map(mapCourseListItem),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getCourseById = async (id) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const course = await Course.findById(id)
        .populate('idPeriode')
        .populate('idPengajar', 'nrp nama')
        .populate('idMahasiswa', 'nrp nama')
        .lean();

    if (!course) {
        throw new ApiError(404, 'Course tidak ditemukan');
    }

    return {
        id: course._id.toString(),
        kodeMatkul: course.kodeMatkul,
        namaMatkul: course.namaMatkul,
        sks: course.sks,
        status: course.status,
        periode: course.idPeriode
        ? {
            id: course.idPeriode._id.toString(),
            periode: course.idPeriode.periode,
            startDate: course.idPeriode.startDate,
            endDate: course.idPeriode.endDate,
            status: course.idPeriode.status,
            }
        : null,
        pengajar: (course.idPengajar || []).filter(Boolean).map((p) => ({
            id: p._id.toString(),
            nrp: p.nrp,
            nama: p.nama,
        })),
        mahasiswa: (course.idMahasiswa || []).filter(Boolean).map((m) => ({
        id: m._id.toString(),
        nrp: m.nrp,
        nama: m.nama,
        })),
        kelas: course.kelas,
        deskripsi: course.deskripsi || null,
    };
};

const createCourse = async (payload) => {
    const {
        kodeMatkul,
        namaMatkul,
        sks,
        status,
        idPeriode,
        idPengajar,
        idMahasiswa,
        kelas,
        deskripsi,
    } = payload;

    const exists = await Course.findOne({ kodeMatkul }).lean();
    if (exists) {
        throw new ApiError(400, 'kodeMatkul sudah digunakan');
    }

    if (!mongoose.isValidObjectId(idPeriode)) {
        throw new ApiError(400, 'idPeriode tidak valid');
    }
    const periode = await AcademicTerm.findById(idPeriode).lean();
    if (!periode) {
        throw new ApiError(404, 'Periode akademik tidak ditemukan');
    }

    const uniquePengajarIds = Array.from(new Set(idPengajar || [])).filter((id) =>
        mongoose.isValidObjectId(id),
    );
    if (uniquePengajarIds.length === 0) {
        throw new ApiError(400, 'idPengajar tidak valid');
    }
    const dosenCount = await User.countDocuments({ _id: { $in: uniquePengajarIds } });
    if (dosenCount !== uniquePengajarIds.length) {
        throw new ApiError(404, 'Satu atau lebih pengajar tidak ditemukan');
    }

    const uniqueMhsIds = Array.from(new Set(idMahasiswa || [])).filter((id) =>
        mongoose.isValidObjectId(id),
    );

    const course = await Course.create({
        kodeMatkul,
        namaMatkul,
        sks,
        status,
        idPeriode,
        idPengajar: uniquePengajarIds,
        idMahasiswa: uniqueMhsIds,
        kelas,
        deskripsi,
    });

    const populated = await Course.findById(course._id)
        .populate('idPeriode', 'periode')
        .populate('idPengajar', 'nrp nama')
        .populate('idMahasiswa', 'nrp nama')
        .lean();

    return {
        id: populated._id.toString(),
        kodeMatkul: populated.kodeMatkul,
        namaMatkul: populated.namaMatkul,
        sks: populated.sks,
        status: populated.status,
        periode: populated.idPeriode?.periode || null,
        pengajar: (populated.idPengajar || []).filter(Boolean).map((p) => ({ id: p._id.toString(), nrp: p.nrp, nama: p.nama })),
        mahasiswa: (populated.idMahasiswa || []).filter(Boolean).map((m) => ({ id: m._id.toString(), nrp: m.nrp, nama: m.nama })),
        kelas: populated.kelas,
        deskripsi: populated.deskripsi || null,
    };
};

const updateCourse = async (id, payload) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const course = await Course.findById(id);
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const {
        kodeMatkul,
        namaMatkul,
        sks,
        status,
        idPeriode,
        idPengajar,
        idMahasiswa,
        kelas,
        deskripsi,
    } = payload;

    if (kodeMatkul && kodeMatkul !== course.kodeMatkul) {
        const exists = await Course.findOne({
        _id: { $ne: id },
        kodeMatkul,
        }).lean();
        if (exists) throw new ApiError(400, 'kodeMatkul sudah digunakan');
        course.kodeMatkul = kodeMatkul;
    }

    if (namaMatkul !== undefined) course.namaMatkul = namaMatkul;
    if (sks !== undefined) course.sks = sks;
    if (status !== undefined) course.status = status;
    if (kelas !== undefined) course.kelas = kelas;
    if (deskripsi !== undefined) course.deskripsi = deskripsi;

    if (idPeriode) {
        if (!mongoose.isValidObjectId(idPeriode)) {
        throw new ApiError(400, 'idPeriode tidak valid');
        }
        const periode = await AcademicTerm.findById(idPeriode).lean();
        if (!periode) throw new ApiError(404, 'Periode akademik tidak ditemukan');
        course.idPeriode = idPeriode;
    }

    if (idPengajar) {
        const uniquePengajarIds = Array.from(new Set(idPengajar)).filter((x) =>
            mongoose.isValidObjectId(x),
        );
        if (uniquePengajarIds.length === 0) {
            throw new ApiError(400, 'idPengajar tidak valid');
        }
        const dosenCount = await User.countDocuments({ _id: { $in: uniquePengajarIds } });
        if (dosenCount !== uniquePengajarIds.length) {
            throw new ApiError(404, 'Satu atau lebih pengajar tidak ditemukan');
        }
        course.idPengajar = uniquePengajarIds;
    }

    if (idMahasiswa) {
        const uniqueMhsIds = Array.from(new Set(idMahasiswa)).filter((x) =>
        mongoose.isValidObjectId(x),
        );
        course.idMahasiswa = uniqueMhsIds;
    }

    await course.save();

    const populated = await Course.findById(course._id)
        .populate('idPeriode', 'periode')
        .populate('idPengajar', 'nrp nama')
        .populate('idMahasiswa', 'nrp nama')
        .lean();

    return {
        id: populated._id.toString(),
        kodeMatkul: populated.kodeMatkul,
        namaMatkul: populated.namaMatkul,
        sks: populated.sks,
        status: populated.status,
        periode: populated.idPeriode?.periode || null,
        pengajar: (populated.idPengajar || []).filter(Boolean).map((p) => ({ id: p._id.toString(), nrp: p.nrp, nama: p.nama })),
        mahasiswa: (populated.idMahasiswa || []).filter(Boolean).map((m) => ({ id: m._id.toString(), nrp: m.nrp, nama: m.nama })),
        kelas: populated.kelas,
        deskripsi: populated.deskripsi || null,
    };
};

const patchDeskripsi = async (id, deskripsi) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID course tidak valid');
    }
    const course = await Course.findById(id);
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');
    course.deskripsi = deskripsi;
    await course.save();
};

const deleteCourse = async (id) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID course tidak valid');
    }
    const deleted = await Course.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, 'Course tidak ditemukan');
};

module.exports = {
    listCourses,
    getCourseById,
    createCourse,
    updateCourse,
    patchDeskripsi,
    deleteCourse,
};
