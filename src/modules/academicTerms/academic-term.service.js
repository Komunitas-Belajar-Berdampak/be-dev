const mongoose = require('mongoose');
const AcademicTerm = require('./academic-term.model');
const { ApiError } = require('../../utils/http');

const listTerms = async () => {
    const terms = await AcademicTerm.find().sort({ createdAt: -1 }).lean();
    return terms.map((t) => ({
        id: t._id.toString(),
        periode: t.periode,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
    }));
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

    return {
        id: doc._id.toString(),
        periode: doc.periode,
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