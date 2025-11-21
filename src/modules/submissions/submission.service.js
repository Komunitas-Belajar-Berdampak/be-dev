const mongoose = require('mongoose');
const Submission = require('./submission.model');
const Assignment = require('../assignments/assignment.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');

const isMahasiswa = (user) =>
    Array.isArray(user.roles) && user.roles.includes('MAHASISWA');
const isDosenOrAdmin = (user) =>
    Array.isArray(user.roles) &&
    (user.roles.includes('DOSEN') || user.roles.includes('SUPER_ADMIN'));

const mapSubmission = (s, mahasiswaMap) => {
    const m = mahasiswaMap?.[s.idStudent?.toString()] || null;

    return {
        id: s._id.toString(),
        mahasiswa: m
        ? {
            id: m._id.toString(),
            nrp: m.nrp,
            nama: m.nama,
            }
        : null,
        submittedAt: s.submittedAt,
        file: s.file,
        grade: s.nilai,
        gradeAt: s.gradedAt,
    };
};

const listSubmissions = async (idAssignment, user) => {
    if (!mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID assignment tidak valid');
    }

    const assignment = await Assignment.findById(idAssignment).lean();
    if (!assignment) throw new ApiError(404, 'Tugas tidak ditemukan');

    const query = { idAssignment };
    if (isMahasiswa(user)) {
        query.idStudent = user.sub;
    }

    const subs = await Submission.find(query).lean();

    const studentIds = subs
        .map((s) => s.idStudent)
        .filter(Boolean)
        .map((id) => id.toString());

    let mahasiswaMap = {};
    if (studentIds.length > 0) {
        const mahasiswa = await User.find({ _id: { $in: studentIds } })
        .select('nrp nama')
        .lean();
        mahasiswaMap = mahasiswa.reduce((acc, m) => {
        acc[m._id.toString()] = m;
        return acc;
        }, {});
    }

    return subs.map((s) => mapSubmission(s, mahasiswaMap));
};

const createSubmission = async (idAssignment, user, filePath) => {
    if (!mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID assignment tidak valid');
    }

    const assignment = await Assignment.findById(idAssignment).lean();
    if (!assignment) throw new ApiError(404, 'Tugas tidak ditemukan');

    const now = new Date();
    if (assignment.tenggat && now > assignment.tenggat) {
        throw new ApiError(422, 'Tenggat waktu telah lewat');
    }

    if (!isMahasiswa(user)) {
        throw new ApiError(403, 'Hanya mahasiswa yang boleh submit tugas');
    }

    const existing = await Submission.findOne({
        idAssignment,
        idStudent: user.sub,
    }).lean();

    if (existing) {
        throw new ApiError(
        400,
        'Anda sudah mengumpulkan tugas ini, gunakan PATCH untuk mengubah',
        );
    }

    const sub = await Submission.create({
        idAssignment,
        idStudent: user.sub,
        submittedAt: now,
        file: filePath,
    });

    return {
        file: sub.file,
        submittedAt: sub.submittedAt,
    };
};

const updateSubmissionFile = async (idAssignment, idSubmission, user, filePath) => {
    if (
        !mongoose.isValidObjectId(idAssignment) ||
        !mongoose.isValidObjectId(idSubmission)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const assignment = await Assignment.findById(idAssignment).lean();
    if (!assignment) throw new ApiError(404, 'Tugas tidak ditemukan');

    if (!isMahasiswa(user)) {
        throw new ApiError(403, 'Hanya mahasiswa yang boleh mengubah submissions');
    }

    const now = new Date();
    if (assignment.tenggat && now > assignment.tenggat) {
        throw new ApiError(422, 'Tenggat waktu telah lewat');
    }

    const sub = await Submission.findOne({
        _id: idSubmission,
        idAssignment,
        idStudent: user.sub,
    });

    if (!sub) {
        throw new ApiError(404, 'Submission tidak ditemukan');
    }

    sub.file = filePath;
    sub.submittedAt = now;

    await sub.save();
};

const gradeSubmission = async (idAssignment, idSubmission, user, nilai, gradeAt) => {
    if (
        !mongoose.isValidObjectId(idAssignment) ||
        !mongoose.isValidObjectId(idSubmission)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    if (!isDosenOrAdmin(user)) {
        throw new ApiError(403, 'Hanya dosen / admin yang boleh memberi nilai');
    }

    const assignment = await Assignment.findById(idAssignment).lean();
    if (!assignment) throw new ApiError(404, 'Tugas tidak ditemukan');

    const sub = await Submission.findOne({
        _id: idSubmission,
        idAssignment,
    });

    if (!sub) throw new ApiError(404, 'Submission tidak ditemukan');

    sub.nilai = nilai;
    sub.gradedAt = gradeAt || new Date();

    await sub.save();
};

module.exports = {
    listSubmissions,
    createSubmission,
    updateSubmissionFile,
    gradeSubmission,
};
