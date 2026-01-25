const mongoose = require('mongoose');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const Course = require('../courses/course.model');
const User = require('../users/user.model');
const GroupThread = require('./group-thread.model');
const GroupPost = require('./group-post.model');
const ActivityLog = require('./activity-log.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const POINT_PER_POST = 10;

const listGroupsByCourse = async (idCourse, queryParams) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const { page, limit, skip } = parsePagination(queryParams);

    const filter = { idCourse };
    const totalItems = await StudyGroup.countDocuments(filter);

    const groups = await StudyGroup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const groupIds = groups.map((g) => g._id);

    const members = await GroupMember.aggregate([
        { $match: { idGroup: { $in: groupIds } } },
        {
        $group: {
            _id: '$idGroup',
            totalAnggota: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
        },
        },
    ]);

    const memberMap = members.reduce((acc, m) => {
        acc[m._id.toString()] = m.totalAnggota;
        return acc;
    }, {});

    return {
        items: groups.map((g) => ({
        id: g._id.toString(),
        nama: g.nama,
        kapasitas: g.kapasitas,
        totalAnggota: memberMap[g._id.toString()] || 0,
        status: g.status,
        totalKontribusi: g.totalKontribusi || 0,
        })),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getGroupDetail = async (idCourse, idGroup) => {
    if (!mongoose.isValidObjectId(idCourse) || !mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findOne({
        _id: idGroup,
        idCourse,
    }).lean();

    if (!group) {
        throw new ApiError(404, 'Kelompok tidak ditemukan');
    }

    const members = await GroupMember.find({
        idGroup,
        status: 'APPROVED',
    })
        .populate('idMahasiswa', 'nrp nama')
        .lean();

    return {
        id: group._id.toString(),
        nama: group.nama,
        deskripsi: group.deskripsi || null,
        kapasitas: group.kapasitas,
        anggota: members.map((m) => ({
        id: m.idMahasiswa._id.toString(),
        nrp: m.idMahasiswa.nrp,
        nama: m.idMahasiswa.nama,
        totalKontribusi: m.kontribusi || 0,
        })),
        status: group.status,
        totalKontribusi: group.totalKontribusi || 0,
    };
};

const getUserDetailInGroup = async (idCourse, idGroup, idUser) => {
    if (
        !mongoose.isValidObjectId(idCourse) ||
        !mongoose.isValidObjectId(idGroup) ||
        !mongoose.isValidObjectId(idUser)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findOne({
        _id: idGroup,
        idCourse,
    }).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const mahasiswa = await User.findById(idUser).lean();
    if (!mahasiswa) throw new ApiError(404, 'Mahasiswa tidak ditemukan');

    const member = await GroupMember.findOne({
        idGroup,
        idMahasiswa: idUser,
    }).lean();

    const threads = await GroupThread.find({ idGroup }).lean();
    const threadIds = threads.map((t) => t._id);
    const threadMap = threads.reduce((acc, t) => {
        acc[t._id.toString()] = t.judul;
        return acc;
    }, {});

    let kontribusiList = [];
    if (threadIds.length > 0) {
        const aggregate = await GroupPost.aggregate([
        {
            $match: {
            idThread: { $in: threadIds },
            idAuthor: new mongoose.Types.ObjectId(idUser),
            },
        },
        {
            $group: {
            _id: '$idThread',
            count: { $sum: 1 },
            },
        },
        ]);

        kontribusiList = aggregate.map((row) => {
        const threadId = row._id.toString();
        const judulThread = threadMap[threadId] || '(thread tidak ditemukan)';
        const totalPoin = (row.count || 0) * POINT_PER_POST;

        return {
            thread: judulThread,
            kontribusi: totalPoin,
        };
        });
    }

    const logs = await ActivityLog.find({
        idUser,
        ...(threadIds.length > 0 && {
        idContribusionThread: { $in: threadIds },
        }),
    })
        .populate('idContribusionThread', 'judul')
        .sort({ createdAt: 1 })
        .lean();

    const aktivitasList = logs.map((log) => ({
        id: log._id.toString(),
        aktivitas: log.aktivitas,
        thread: log.idContribusionThread
        ? {
            id: log.idContribusionThread._id.toString(),
            judul: log.idContribusionThread.judul,
            }
        : null,
        createdAt: log.createdAt,
    }));

    return {
        id: member?._id?.toString() || null,
        mahasiswa: {
        id: mahasiswa._id.toString(),
        nrp: mahasiswa.nrp,
        nama: mahasiswa.nama,
        },
        kontribusi: kontribusiList,  
        aktivitas: aktivitasList,     
    };
};

const createGroup = async (idCourse, payload) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const { nama, deskripsi, idMahasiswa, status, kapasitas } = payload;

    const group = await StudyGroup.create({
        idCourse,
        nama: nama || 'Kelompok',
        deskripsi,
        status: status ?? false,
        kapasitas,
    });

    if (Array.isArray(idMahasiswa) && idMahasiswa.length > 0) {
        const uniqueIds = [...new Set(idMahasiswa)].filter((x) =>
        mongoose.isValidObjectId(x),
        );

        const docs = uniqueIds.map((idMhs) => ({
        idGroup: group._id,
        idMahasiswa: idMhs,
        status: 'APPROVED',
        kontribusi: 0,
        }));

        if (docs.length > 0) {
        await GroupMember.insertMany(docs, { ordered: false }).catch(() => {});
        }
    }

    return {
        id: group._id.toString(),
        nama: group.nama,
        deskripsi: group.deskripsi || null,
        kapasitas: group.kapasitas,
        anggota: [], 
        status: group.status,
    };
};

const updateGroup = async (idCourse, idGroup, payload) => {
    if (!mongoose.isValidObjectId(idCourse) || !mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findOne({
        _id: idGroup,
        idCourse,
    });

    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const { nama, deskripsi, idMahasiswa, status, kapasitas } = payload;

    if (nama !== undefined) group.nama = nama;
    if (deskripsi !== undefined) group.deskripsi = deskripsi;
    if (typeof status === 'boolean') group.status = status;
    if (kapasitas !== undefined) group.kapasitas = kapasitas;

    if (Array.isArray(idMahasiswa)) {
        const uniqueIds = [...new Set(idMahasiswa)].filter((x) =>
        mongoose.isValidObjectId(x),
        );

        await GroupMember.deleteMany({
        idGroup,
        status: 'APPROVED',
        });

        const docs = uniqueIds.map((idMhs) => ({
        idGroup,
        idMahasiswa: idMhs,
        status: 'APPROVED',
        kontribusi: 0,
        }));

        if (docs.length > 0) {
        await GroupMember.insertMany(docs, { ordered: false }).catch(() => {});
        }
    }

    await group.save();
};

const deleteGroup = async (idCourse, idGroup) => {
    if (!mongoose.isValidObjectId(idCourse) || !mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const deleted = await StudyGroup.findOneAndDelete({
        _id: idGroup,
        idCourse,
    });

    if (!deleted) throw new ApiError(404, 'Kelompok tidak ditemukan');

    await GroupMember.deleteMany({ idGroup });
};

module.exports = {
    listGroupsByCourse,
    getGroupDetail,
    getUserDetailInGroup,
    createGroup,
    updateGroup,
    deleteGroup,
};
