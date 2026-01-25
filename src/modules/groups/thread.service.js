const mongoose = require('mongoose');
const GroupThread = require('./group-thread.model');
const StudyGroup = require('./group.model');
const Assignment = require('../assignments/assignment.model');
const { ApiError } = require('../../utils/http');
const { logActivity } = require('./activity-log.service');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const listThreadsByGroup = async (idGroup, query) => {
    if (!mongoose.isValidObjectId(idGroup)) throw new ApiError(400, 'ID group tidak valid');

    const group = await StudyGroup.findById(idGroup).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const { page, limit, skip } = parsePagination(query);

    const filter = { idGroup };
    const totalItems = await GroupThread.countDocuments(filter);

    const threads = await GroupThread.find(filter)
        .populate('idAssignment', 'judul')
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: threads.map((t) => ({
        id: t._id.toString(),
        judul: t.judul,
        assignment: t.idAssignment ? t.idAssignment.judul : null,
        })),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const createThread = async (idGroup, payload, user) => {
    if (!mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID group tidak valid');
    }

    const group = await StudyGroup.findById(idGroup).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const { judul, idAssignment } = payload;

    let assignmentId = null;
    if (idAssignment) {
        if (!mongoose.isValidObjectId(idAssignment)) {
        throw new ApiError(400, 'ID assignment tidak valid');
        }
        const assignment = await Assignment.findById(idAssignment).lean();
        if (!assignment) throw new ApiError(404, 'Assignment tidak ditemukan');
        assignmentId = assignment._id;
    }

    const thread = await GroupThread.create({
        idGroup,
        judul,
        idAssignment: assignmentId,
    });

    await logActivity({
        aktivitas: `Membuat thread: ${judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
    });

    let assignmentName = null;
    if (assignmentId) {
        const a = await Assignment.findById(assignmentId).lean();
        assignmentName = a?.judul || null;
    }

    return {
        id: thread._id.toString(),
        judul: thread.judul,
        assignment: assignmentName,
    };
};

module.exports = {
    listThreadsByGroup,
    createThread,
};
