const mongoose = require('mongoose');
const Course = require('./course.model');
const AcademicTerm = require('../academicTerms/academic-term.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');

const mapCourseListItem = (c) => ({
    id: c._id.toString(),
    kodeMatkul: c.kodeMatkul,
    namaMatkul: c.namaMatkul,
    sks: c.sks,
    status: c.status,
    periode: c.idPeriode?.periode || null,
    pengajar: c.idPengajar?.nama || null,
    kelas: c.kelas,
});

const listCourses = async (filters) => {
    const { kodeMatkul, status, periode, pengajar, kelas, sks } = filters;
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
        if (!term) return [];
        query.idPeriode = term._id;
        }
    }

    if (pengajar) {
        if (mongoose.isValidObjectId(pengajar)) {
        query.idPengajar = pengajar;
        } else {
        const dosen = await User.findOne({
            nama: { $regex: pengajar, $options: 'i' },
        }).lean();
        if (!dosen) return [];
        query.idPengajar = dosen._id;
        }
    }

    const courses = await Course.find(query)
        .populate('idPeriode', 'periode')
        .populate('idPengajar', 'nama')
        .lean();

    return courses.map(mapCourseListItem);
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
        pengajar: course.idPengajar
        ? {
            id: course.idPengajar._id.toString(),
            nrp: course.idPengajar.nrp,
            nama: course.idPengajar.nama,
            }
        : null,
        mahasiswa: (course.idMahasiswa || []).map((m) => ({
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

    if (!mongoose.isValidObjectId(idPengajar)) {
        throw new ApiError(400, 'idPengajar tidak valid');
    }
    const dosen = await User.findById(idPengajar).lean();
    if (!dosen) {
        throw new ApiError(404, 'Pengajar tidak ditemukan');
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
        idPengajar,
        idMahasiswa: uniqueMhsIds,
        kelas,
    });

    const populated = await Course.findById(course._id)
        .populate('idPeriode', 'periode')
        .populate('idPengajar', 'nama')
        .populate('idMahasiswa', 'nama')
        .lean();

    return {
        id: populated._id.toString(),
        kodeMatkul: populated.kodeMatkul,
        namaMatkul: populated.namaMatkul,
        sks: populated.sks,
        status: populated.status,
        periode: populated.idPeriode?.periode || null,
        pengajar: populated.idPengajar?.nama || null,
        mahasiswa: (populated.idMahasiswa || []).map((m) => m.nama),
        kelas: populated.kelas,
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

    if (idPeriode) {
        if (!mongoose.isValidObjectId(idPeriode)) {
        throw new ApiError(400, 'idPeriode tidak valid');
        }
        const periode = await AcademicTerm.findById(idPeriode).lean();
        if (!periode) throw new ApiError(404, 'Periode akademik tidak ditemukan');
        course.idPeriode = idPeriode;
    }

    if (idPengajar) {
        if (!mongoose.isValidObjectId(idPengajar)) {
        throw new ApiError(400, 'idPengajar tidak valid');
        }
        const dosen = await User.findById(idPengajar).lean();
        if (!dosen) throw new ApiError(404, 'Pengajar tidak ditemukan');
        course.idPengajar = idPengajar;
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
        .populate('idPengajar', 'nama')
        .populate('idMahasiswa', 'nama')
        .lean();

    return {
        id: populated._id.toString(),
        kodeMatkul: populated.kodeMatkul,
        namaMatkul: populated.namaMatkul,
        sks: populated.sks,
        status: populated.status,
        periode: populated.idPeriode?.periode || null,
        pengajar: populated.idPengajar?.nama || null,
        mahasiswa: (populated.idMahasiswa || []).map((m) => m.nama),
        kelas: populated.kelas,
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
