const mongoose = require('mongoose');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const listMemberships = async (idStudyGroup, query) => {
    if (!mongoose.isValidObjectId(idStudyGroup)) throw new ApiError(400, 'ID group tidak valid');

    const group = await StudyGroup.findById(idStudyGroup).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const { page, limit, skip } = parsePagination(query);

    const filter = { idGroup: idStudyGroup };
    const totalItems = await GroupMember.countDocuments(filter);

    const members = await GroupMember.find(filter)
        .populate('idMahasiswa', 'nrp nama')
        .skip(skip)
        .limit(limit)
        .lean();

    const totalRequest = await GroupMember.countDocuments({ idGroup: idStudyGroup, status: 'PENDING' });

    return {
        data: {
            id: group._id.toString(),
            totalRequest,
            mahasiswa: members.map((m) => ({
                id: m._id.toString(),
                nrp: m.idMahasiswa.nrp,
                nama: m.idMahasiswa.nama,
                status: m.status,
            })),
        },
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const joinGroup = async (idStudyGroup, userId) => {
    if (!mongoose.isValidObjectId(idStudyGroup) || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idStudyGroup).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    if (group.status === true) {
        throw new ApiError(400, 'Pendaftaran kelompok sudah ditutup');
    }

    const member = await GroupMember.findOne({
        idGroup: idStudyGroup,
        idMahasiswa: userId,
    });

    if (member) {
        if (member.status === 'PENDING') {
        throw new ApiError(400, 'Anda sudah mengajukan join, menunggu persetujuan');
        }
        if (member.status === 'APPROVED') {
        throw new ApiError(400, 'Anda sudah menjadi anggota kelompok ini');
        }
    }

    const doc = await GroupMember.create({
        idGroup: idStudyGroup,
        idMahasiswa: userId,
        status: 'PENDING',
        kontribusi: 0,
    });

    return {
        status: 'PENDING',
        idMembership: doc._id.toString(),
    };
};

const approveMembership = async (idStudyGroup, idMembership) => {
    if (!mongoose.isValidObjectId(idStudyGroup) || !mongoose.isValidObjectId(idMembership)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idStudyGroup);
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const member = await GroupMember.findOne({
        _id: idMembership,
        idGroup: idStudyGroup,
    });

    if (!member) throw new ApiError(404, 'Membership tidak ditemukan');

    const approvedCount = await GroupMember.countDocuments({
        idGroup: idStudyGroup,
        status: 'APPROVED',
    });

    if (approvedCount >= group.kapasitas) {
        throw new ApiError(400, 'Kapasitas kelompok sudah penuh');
    }

    member.status = 'APPROVED';
    await member.save();
};

const rejectMembership = async (idStudyGroup, idMembership) => {
    if (!mongoose.isValidObjectId(idStudyGroup) || !mongoose.isValidObjectId(idMembership)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const member = await GroupMember.findOne({
        _id: idMembership,
        idGroup: idStudyGroup,
    });

    if (!member) throw new ApiError(404, 'Membership tidak ditemukan');

    member.status = 'REJECTED';
    await member.save();
};

module.exports = {
    listMemberships,
    joinGroup,
    approveMembership,
    rejectMembership,
};
