const mongoose = require('mongoose');
const Assignment = require('./assignment.model');
const Meeting = require('../meetings/meeting.model');
const Course = require('../courses/course.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const isMahasiswa = (user) =>
    Array.isArray(user.roles) && user.roles.includes('MAHASISWA');

const mapListItemByCourse = (a, meetingMap) => {
    const pertemuan = meetingMap[a.idMeeting.toString()] || null;
    return {
        id: a._id.toString(),
        pertemuan,
        judul: a.judul,
        status: a.status,
        statusTugas: a.statusTugas,
        tenggat: a.tenggat,
    };
};

const mapListItemByMeeting = (a) => ({
    id: a._id.toString(),
    judul: a.judul,
    status: a.status,
    statusTugas: a.statusTugas,
    tenggat: a.tenggat,
});

const mapDetail = (a) => ({
    id: a._id.toString(),
    judul: a.judul,
    statusTugas: a.statusTugas ? 'kelompok' : 'individu',
    tenggat: a.tenggat,
    status: a.status,
    deskripsi: a.deskripsi || null,
    lampiran: a.pathLampiran || null,
});

const listAssignmentsByCourse = async (idCourse, user, queryParams) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const { page, limit, skip } = parsePagination(queryParams);

    const meetings = await Meeting.find({ idCourse }).lean();
    const meetingIds = meetings.map((m) => m._id);
    const meetingMap = meetings.reduce((acc, m) => {
        acc[m._id.toString()] = m.pertemuan;
        return acc;
    }, {});

    const query = { idMeeting: { $in: meetingIds } };
    if (isMahasiswa(user)) query.status = 'VISIBLE';

    const totalItems = await Assignment.countDocuments(query);

    const assignments = await Assignment.find(query)
        .sort({ tenggat: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: assignments.map((a) => mapListItemByCourse(a, meetingMap)),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const listAssignmentsByMeeting = async (idCourse, pertemuan, user, queryParams) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');

    const meeting = await Meeting.findOne({ idCourse, pertemuan }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const { page, limit, skip } = parsePagination(queryParams);

    const query = { idMeeting: meeting._id };
    if (isMahasiswa(user)) query.status = 'VISIBLE';

    const totalItems = await Assignment.countDocuments(query);

    const assignments = await Assignment.find(query)
        .sort({ tenggat: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: assignments.map(mapListItemByMeeting),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getAssignmentDetail = async (idCourse, pertemuan, idAssignment, user) => {
    if (!mongoose.isValidObjectId(idCourse) || !mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const meeting = await Meeting.findOne({ idCourse, pertemuan }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const assignment = await Assignment.findOne({
        _id: idAssignment,
        idMeeting: meeting._id,
    }).lean();

    if (!assignment) throw new ApiError(404, 'Tugas tidak ditemukan');

    if (isMahasiswa(user) && assignment.status !== 'VISIBLE') {
        throw new ApiError(403, 'Anda tidak boleh mengakses resource ini');
    }

    return mapDetail(assignment);
};

const createAssignment = async (idCourse, pertemuan, payload) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const meeting = await Meeting.findOne({ idCourse, pertemuan }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const { judul, statusTugas, tenggat, status, deskripsi, lampiran } = payload;

    const doc = await Assignment.create({
        idMeeting: meeting._id,
        judul,
        statusTugas,
        tenggat,
        status: status || 'HIDE',
        deskripsi,
        pathLampiran: lampiran,
    });

    return mapDetail(doc.toObject());
};

const updateAssignment = async (idCourse, pertemuan, idAssignment, payload) => {
    if (!mongoose.isValidObjectId(idCourse) || !mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const meeting = await Meeting.findOne({ idCourse, pertemuan }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const assignment = await Assignment.findOne({
        _id: idAssignment,
        idMeeting: meeting._id,
    });

    if (!assignment) throw new ApiError(404, 'Tugas tidak ditemukan');

    const { judul, statusTugas, tenggat, status, deskripsi, lampiran } = payload;

    if (judul !== undefined) assignment.judul = judul;
    if (statusTugas !== undefined) assignment.statusTugas = statusTugas;
    if (tenggat !== undefined) assignment.tenggat = tenggat;
    if (status !== undefined) assignment.status = status;
    if (deskripsi !== undefined) assignment.deskripsi = deskripsi;
    if (lampiran !== undefined) assignment.pathLampiran = lampiran;

    await assignment.save();
};

const deleteAssignment = async (idCourse, pertemuan, idAssignment) => {
    if (!mongoose.isValidObjectId(idCourse) || !mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const meeting = await Meeting.findOne({ idCourse, pertemuan }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const deleted = await Assignment.findOneAndDelete({
        _id: idAssignment,
        idMeeting: meeting._id,
    });

    if (!deleted) throw new ApiError(404, 'Tugas tidak ditemukan');
};

const getAssignmentById = async (idAssignment, user) => {
    if (!mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID assignment tidak valid');
    }

    const assignment = await Assignment.findById(idAssignment).lean();
    if (!assignment) throw new ApiError(404, 'Tugas tidak ditemukan');

    if (isMahasiswa(user) && assignment.status !== 'VISIBLE') {
        throw new ApiError(403, 'Anda tidak boleh mengakses resource ini');
    }

    return mapDetail(assignment);
};

const updateAssignmentById = async (idAssignment, payload) => {
    if (!mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID assignment tidak valid');
    }

    const assignment = await Assignment.findById(idAssignment);
    if (!assignment) throw new ApiError(404, 'Tugas tidak ditemukan');

    const { judul, statusTugas, tenggat, status, deskripsi, lampiran } = payload;

    if (judul !== undefined) assignment.judul = judul;
    if (statusTugas !== undefined) assignment.statusTugas = statusTugas;
    if (tenggat !== undefined) assignment.tenggat = tenggat;
    if (status !== undefined) assignment.status = status;
    if (deskripsi !== undefined) assignment.deskripsi = deskripsi;
    if (lampiran !== undefined) assignment.pathLampiran = lampiran;

    await assignment.save();
};

const deleteAssignmentById = async (idAssignment) => {
    if (!mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID assignment tidak valid');
    }

    const deleted = await Assignment.findByIdAndDelete(idAssignment);
    if (!deleted) throw new ApiError(404, 'Tugas tidak ditemukan');
};

module.exports = {
    listAssignmentsByCourse,
    listAssignmentsByMeeting,
    getAssignmentDetail,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentById,
    updateAssignmentById,
    deleteAssignmentById,
};
