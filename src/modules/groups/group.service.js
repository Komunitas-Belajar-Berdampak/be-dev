const mongoose = require('mongoose');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const Course = require('../courses/course.model');
const User = require('../users/user.model');
const GroupThread = require('./group-thread.model');
const GroupPost = require('./group-post.model');
const ContributionThread = require('./contribution-thread.model');
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
            totalRequest: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
        },
        },
    ]);

    const memberMap = members.reduce((acc, m) => {
        acc[m._id.toString()] = {
            totalAnggota: m.totalAnggota,
            totalRequest: m.totalRequest,
        };
        return acc;
    }, {});

    return {
        items: groups.map((g) => ({
        id: g._id.toString(),
        nama: g.nama,
        kapasitas: g.kapasitas,
        totalAnggota: memberMap[g._id.toString()]?.totalAnggota || 0,
        status: g.status,
        totalRequest: memberMap[g._id.toString()]?.totalRequest || 0,
        totalKontribusi: g.totalKontribusi || 0,
        })),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getGroupDetail = async (idGroup) => {
    if (!mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idGroup).lean();

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

const getUserDetailInGroup = async (idGroup, idUser) => {
    if (
        !mongoose.isValidObjectId(idGroup) ||
        !mongoose.isValidObjectId(idUser)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idGroup).lean();
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
        // Use ContributionThread for faster lookup instead of aggregation
        const contributions = await ContributionThread.find({
            idThread: { $in: threadIds },
            idMahasiswa: idUser,
        }).lean();

        kontribusiList = contributions.map((contrib) => {
            const threadId = contrib.idThread.toString();
            const judulThread = threadMap[threadId] || '(thread tidak ditemukan)';

            return {
                thread: judulThread,
                kontribusi: contrib.kontribusi,
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
        totalKontribusi: group.totalKontribusi || 0,
    };
};

const updateGroup = async (idGroup, payload) => {
    if (!mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idGroup);

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

const deleteGroup = async (idGroup) => {
    if (!mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const deleted = await StudyGroup.findByIdAndDelete(idGroup);

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
