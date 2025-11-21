const mongoose = require('mongoose');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');

const listMemberships = async (idGroup) => {
    if (!mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID group tidak valid');
    }

    const group = await StudyGroup.findById(idGroup).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const members = await GroupMember.find({ idGroup })
        .populate('idMahasiswa', 'nrp nama')
        .lean();

    const totalRequest = members.filter((m) => m.status === 'PENDING').length;

    return {
        id: group._id.toString(),
        totalRequest,
        mahasiswa: members.map((m) => ({
        id: m._id.toString(),
        nrp: m.idMahasiswa.nrp,
        nama: m.idMahasiswa.nama,
        status: m.status,
        })),
    };
};

const joinGroup = async (idGroup, userId) => {
    if (!mongoose.isValidObjectId(idGroup) || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idGroup).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    if (group.status === true) {
        throw new ApiError(400, 'Pendaftaran kelompok sudah ditutup');
    }

    const member = await GroupMember.findOne({
        idGroup,
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
        idGroup,
        idMahasiswa: userId,
        status: 'PENDING',
        kontribusi: 0,
    });

    return {
        status: 'PENDING',
        idMembership: doc._id.toString(),
    };
};

const approveMembership = async (idGroup, idMembership) => {
    if (!mongoose.isValidObjectId(idGroup) || !mongoose.isValidObjectId(idMembership)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idGroup);
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const member = await GroupMember.findOne({
        _id: idMembership,
        idGroup,
    });

    if (!member) throw new ApiError(404, 'Membership tidak ditemukan');

    const approvedCount = await GroupMember.countDocuments({
        idGroup,
        status: 'APPROVED',
    });

    if (approvedCount >= group.kapasitas) {
        throw new ApiError(400, 'Kapasitas kelompok sudah penuh');
    }

    member.status = 'APPROVED';
    await member.save();
};

const rejectMembership = async (idGroup, idMembership) => {
    if (!mongoose.isValidObjectId(idGroup) || !mongoose.isValidObjectId(idMembership)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const member = await GroupMember.findOne({
        _id: idMembership,
        idGroup,
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
