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

const listGroupsWithMembershipStatus = async (idCourse, userId, queryParams) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, 'ID user tidak valid');

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

    // Get total members per group
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
        acc[m._id.toString()] = {
            totalAnggota: m.totalAnggota,
        };
        return acc;
    }, {});

    // Get user's membership status in each group
    const userMemberships = await GroupMember.find({
        idGroup: { $in: groupIds },
        idMahasiswa: userId,
    }).lean();

    const userMembershipMap = userMemberships.reduce((acc, m) => {
        acc[m.idGroup.toString()] = {
            status: m.status,
            kontribusi: m.kontribusi || 0,
        };
        return acc;
    }, {});

    return {
        items: groups.map((g) => {
            const groupId = g._id.toString();
            const userMembership = userMembershipMap[groupId];

            return {
                id: groupId,
                nama: g.nama,
                deskripsi: g.deskripsi || null,
                kapasitas: g.kapasitas,
                totalAnggota: memberMap[groupId]?.totalAnggota || 0,
                status: g.status,
                statusMember: userMembership ? userMembership.status : null,
                totalKontribusi: userMembership ? userMembership.kontribusi : 0,
            };
        }),
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
        thread: log.idContribusionThread?.judul || null,
        aktivitas: log.aktivitas,
        kontribusi: log.kontribusi || 0,
        timestamp: log.createdAt,
    }));

    return {
        id: group._id.toString(),
        totalKontribusi: member?.kontribusi || 0,
        mahasiswa: {
        id: mahasiswa._id.toString(),
        nrp: mahasiswa.nrp,
        nama: mahasiswa.nama,
        },
        kontribusiTotalByThread: kontribusiList,
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

        if (uniqueIds.length > 0) {
        // Validation 1: Check capacity
        if (uniqueIds.length > kapasitas) {
            throw new ApiError(400, `Jumlah anggota (${uniqueIds.length}) melebihi kapasitas kelompok (${kapasitas})`);
        }

        // Verify all student IDs exist
        const existingUsers = await User.find({
            _id: { $in: uniqueIds },
        }).select('_id');

        const existingUserIds = existingUsers.map(u => u._id.toString());
        const invalidIds = uniqueIds.filter(id => !existingUserIds.includes(id));

        if (invalidIds.length > 0) {
            throw new ApiError(400, `ID mahasiswa tidak valid: ${invalidIds.join(', ')}`);
        }

        // Validation 2: Check if any student is already in another group in this course
        const groupsInCourse = await StudyGroup.find({ idCourse }).select('_id').lean();
        const groupIdsInCourse = groupsInCourse.map(g => g._id);

        const existingMemberships = await GroupMember.find({
            idGroup: { $in: groupIdsInCourse },
            idMahasiswa: { $in: uniqueIds },
            status: 'APPROVED',
        }).populate('idMahasiswa', 'nama nrp').lean();

        if (existingMemberships.length > 0) {
            const conflictNames = existingMemberships.map(m =>
                `${m.idMahasiswa.nama} (${m.idMahasiswa.nrp})`
            ).join(', ');
            throw new ApiError(400, `Mahasiswa berikut sudah terdaftar di kelompok lain dalam mata kuliah ini: ${conflictNames}`);
        }

        // Issue 3: Auto-approve when lecturer adds members
        const docs = uniqueIds.map((idMhs) => ({
            idGroup: group._id,
            idMahasiswa: idMhs,
            status: 'APPROVED',
            kontribusi: 0,
        }));

        await GroupMember.insertMany(docs, { ordered: false });
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

        // Validation 1: Check capacity
        const finalKapasitas = kapasitas !== undefined ? kapasitas : group.kapasitas;
        if (uniqueIds.length > finalKapasitas) {
            throw new ApiError(400, `Jumlah anggota (${uniqueIds.length}) melebihi kapasitas kelompok (${finalKapasitas})`);
        }

        if (uniqueIds.length > 0) {
        // Verify all student IDs exist
        const existingUsers = await User.find({
            _id: { $in: uniqueIds },
        }).select('_id');

        const existingUserIds = existingUsers.map(u => u._id.toString());
        const invalidIds = uniqueIds.filter(id => !existingUserIds.includes(id));

        if (invalidIds.length > 0) {
            throw new ApiError(400, `ID mahasiswa tidak valid: ${invalidIds.join(', ')}`);
        }

        // Validation 2: Check if any student is already in another group in this course (excluding current group)
        const groupsInCourse = await StudyGroup.find({
            idCourse: group.idCourse,
            _id: { $ne: idGroup }  // Exclude current group
        }).select('_id').lean();
        const groupIdsInCourse = groupsInCourse.map(g => g._id);

        if (groupIdsInCourse.length > 0) {
            const existingMemberships = await GroupMember.find({
                idGroup: { $in: groupIdsInCourse },
                idMahasiswa: { $in: uniqueIds },
                status: 'APPROVED',
            }).populate('idMahasiswa', 'nama nrp').lean();

            if (existingMemberships.length > 0) {
                const conflictNames = existingMemberships.map(m =>
                    `${m.idMahasiswa.nama} (${m.idMahasiswa.nrp})`
                ).join(', ');
                throw new ApiError(400, `Mahasiswa berikut sudah terdaftar di kelompok lain dalam mata kuliah ini: ${conflictNames}`);
            }
        }
        }

        await GroupMember.deleteMany({
        idGroup,
        status: 'APPROVED',
        });

        if (uniqueIds.length > 0) {
        // Issue 3: Auto-approve when lecturer adds members
        const docs = uniqueIds.map((idMhs) => ({
            idGroup,
            idMahasiswa: idMhs,
            status: 'APPROVED',
            kontribusi: 0,
        }));

        await GroupMember.insertMany(docs, { ordered: false });
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
    listGroupsWithMembershipStatus,
    getGroupDetail,
    getUserDetailInGroup,
    createGroup,
    updateGroup,
    deleteGroup,
};
