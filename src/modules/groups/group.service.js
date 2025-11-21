const mongoose = require('mongoose');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const Course = require('../courses/course.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');

const listGroupsByCourse = async (idCourse) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const course = await Course.findById(idCourse).lean();
    if (!course) {
        throw new ApiError(404, 'Course tidak ditemukan');
    }

    const groups = await StudyGroup.find({ idCourse }).lean();

    const groupIds = groups.map((g) => g._id);
    const members = await GroupMember.aggregate([
        { $match: { idGroup: { $in: groupIds } } },
        {
        $group: {
            _id: '$idGroup',
            totalAnggota: {
            $sum: {
                $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0],
            },
            },
        },
        },
    ]);

    const memberMap = members.reduce((acc, m) => {
        acc[m._id.toString()] = m.totalAnggota;
        return acc;
    }, {});

    return groups.map((g) => ({
        id: g._id.toString(),
        nama: g.nama,
        kapasitas: g.kapasitas,
        totalAnggota: memberMap[g._id.toString()] || 0,
        status: g.status, 
        totalKontribusi: g.totalKontribusi || 0,
    }));
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

    const kontribusiList = [];
    const aktivitasList = [];

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
