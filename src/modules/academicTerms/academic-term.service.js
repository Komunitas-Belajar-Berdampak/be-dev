const mongoose = require('mongoose');
const AcademicTerm = require('./academic-term.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const SEMESTER_GANJIL = [1, 3, 5, 7, 9, 11, 13];
const SEMESTER_GENAP = [2, 4, 6, 8, 10, 12, 14];

const parseSemesterInfo = (periode) => {
    if (!periode) return { semesterType: null, semesters: null };
    const lower = periode.toLowerCase();
    if (lower.includes('ganjil')) return { semesterType: 'Ganjil', semesters: SEMESTER_GANJIL };
    if (lower.includes('genap')) return { semesterType: 'Genap', semesters: SEMESTER_GENAP };
    return { semesterType: null, semesters: null };
};

const listTerms = async (query) => {
    const { page, limit, skip } = parsePagination(query);

    const totalItems = await AcademicTerm.countDocuments({});
    const terms = await AcademicTerm.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: terms.map((t) => {
            const { semesterType, semesters } = parseSemesterInfo(t.periode);
            return {
                id: t._id.toString(),
                periode: t.periode,
                semesterType,
                semesters,
                startDate: t.startDate,
                endDate: t.endDate,
                status: t.status,
            };
        }),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const createTerm = async ({ periode, startDate, endDate, status }) => {
    const exists = await AcademicTerm.findOne({ periode }).lean();
    if (exists) {
        throw new ApiError(400, 'Periode sudah ada');
    }

    const doc = new AcademicTerm({
        periode,
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

    const { semesterType, semesters } = parseSemesterInfo(doc.periode);
    return {
        id: doc._id.toString(),
        periode: doc.periode,
        semesterType,
        semesters,
        startDate: doc.startDate,
        endDate: doc.endDate,
        status: doc.status,
    };
};

const deleteTerm = async (id) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'ID periode tidak valid');
    }

    const deleted = await AcademicTerm.findByIdAndDelete(id);
    if (!deleted) {
        throw new ApiError(404, 'Periode akademik tidak ditemukan');
    }
};

module.exports = {
    listTerms,
    createTerm,
    deleteTerm,
};