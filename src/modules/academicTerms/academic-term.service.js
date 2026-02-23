const mongoose = require('mongoose');
const AcademicTerm = require('./academic-term.model');
const Course = require('../courses/course.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const SEMESTER_GANJIL = [1, 3, 5, 7, 9, 11, 13];
const SEMESTER_GENAP = [2, 4, 6, 8, 10, 12, 14];

const getSemesters = (semesterType) => {
    if (semesterType === 'Ganjil') return SEMESTER_GANJIL;
    if (semesterType === 'Genap') return SEMESTER_GENAP;
    return null;
};

const mapTerm = (t) => ({
    id: t._id.toString(),
    periode: t.periode,
    semesterType: t.semesterType || null,
    semesters: (t.semesters && t.semesters.length > 0) ? t.semesters : getSemesters(t.semesterType),
    startDate: t.startDate || null,
    endDate: t.endDate || null,
    status: t.status,
});

const listTerms = async (query) => {
    const { page, limit, skip } = parsePagination(query);

    const totalItems = await AcademicTerm.countDocuments({});
    const terms = await AcademicTerm.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: terms.map(mapTerm),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const createTerm = async ({ periode, semesterType, startDate, endDate, status }) => {
    const exists = await AcademicTerm.findOne({ periode }).lean();
    if (exists) {
        throw new ApiError(400, 'Periode sudah ada');
    }

    const computedSemesters = getSemesters(semesterType);

    const doc = new AcademicTerm({
        periode,
        semesterType: semesterType || null,
        semesters: computedSemesters || undefined,
        startDate,
        endDate,
        status: status || 'tidak aktif',
    });

    // kalau status aktif, matikan yang lain
    if (doc.status === 'aktif') {
        await AcademicTerm.updateMany(
        { _id: { $ne: doc._id } },
        { $set: { status: 'tidak aktif' } },
        );
    }

    await doc.save();

    return mapTerm(doc.toObject());
};

const deleteTerm = async (id) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID periode tidak valid');
    }

    const term = await AcademicTerm.findById(id).lean();
    if (!term) {
        throw new ApiError(404, 'Periode akademik tidak ditemukan');
    }

    const courseCount = await Course.countDocuments({ idPeriode: id });
    if (courseCount > 0) {
        throw new ApiError(
            400,
            `Tidak dapat menghapus periode yang masih digunakan oleh ${courseCount} matakuliah`,
        );
    }

    await AcademicTerm.findByIdAndDelete(id);
};

module.exports = {
    listTerms,
    createTerm,
    deleteTerm,
};