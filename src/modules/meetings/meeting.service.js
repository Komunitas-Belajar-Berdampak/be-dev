const mongoose = require('mongoose');
const Meeting = require('./meeting.model');
const Course = require('../courses/course.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const listMeetingsByCourse = async (idCourse, query) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');

    const { page, limit, skip } = parsePagination(query);

    const totalItems = await Meeting.countDocuments({ idCourse });

    const meetings = await Meeting.find({ idCourse })
        .sort({ pertemuan: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: meetings.map((m) => ({
        id: m._id.toString(),
        pertemuan: m.pertemuan,
        judul: m.judul,
        deskripsi: m.deskripsi,
        })),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getMeetingByNumber = async (idCourse, pertemuan) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const m = await Meeting.findOne({ idCourse, pertemuan }).lean();
    if (!m) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    return {
        id: m._id.toString(),
        pertemuan: m.pertemuan,
        judul: m.judul,
        deskripsi: m.deskripsi,
    };
};

const upsertMeeting = async (idCourse, pertemuan, payload) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }
    if (pertemuan < 1 || pertemuan > 16) {
        throw new ApiError(400, 'Nomor pertemuan harus 1..16');
    }

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const { judul, deskripsi } = payload;

    try {
        const m = await Meeting.findOneAndUpdate(
        { idCourse, pertemuan },
        { $set: { judul, deskripsi } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
        ).lean();

        return {
        id: m._id.toString(),
        pertemuan: m.pertemuan,
        judul: m.judul,
        deskripsi: m.deskripsi,
        };
    } catch (err) {
        if (err.code === 11000) {
        throw new ApiError(409, 'Pertemuan tersebut sudah ada');
        }
        throw err;
    }
};

const updateMeetingById = async (idPertemuan, payload) => {
    if (!mongoose.isValidObjectId(idPertemuan)) {
        throw new ApiError(400, 'ID pertemuan tidak valid');
    }

    const meeting = await Meeting.findById(idPertemuan);
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const { judul, deskripsi } = payload;

    if (judul !== undefined) meeting.judul = judul;
    if (deskripsi !== undefined) meeting.deskripsi = deskripsi;

    await meeting.save();

    return {
        id: meeting._id.toString(),
        pertemuan: meeting.pertemuan,
        judul: meeting.judul,
        deskripsi: meeting.deskripsi,
    };
};

module.exports = {
    listMeetingsByCourse,
    getMeetingByNumber,
    upsertMeeting,
    updateMeetingById,
};
