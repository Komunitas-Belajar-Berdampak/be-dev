const mongoose = require('mongoose');
const GroupThread = require('./group-thread.model');
const GroupTask = require('./group-task.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');
const { logActivity } = require('./activity-log.service');

const listTasksByThread = async (idThread) => {
    if (!mongoose.isValidObjectId(idThread)) {
        throw new ApiError(400, 'ID thread tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const tasks = await GroupTask.find({ idThread })
        .populate('idMahasiswa', 'nama')
        .lean();

    return tasks.map((t) => ({
        id: t._id.toString(),
        task: t.task,
        mahasiswa: (t.idMahasiswa || []).map((m) => m.nama),
        status: t.status,
    }));
};

const createTask = async (idThread, payload, user) => {
    if (!mongoose.isValidObjectId(idThread)) {
        throw new ApiError(400, 'ID thread tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const { task, IdMahasiswa, status } = payload;

    const mhsIds = Array.from(new Set(IdMahasiswa || [])).filter((id) =>
        mongoose.isValidObjectId(id),
    );

    const doc = await GroupTask.create({
        idThread,
        idMahasiswa: mhsIds,
        task,
        status,
    });

    await logActivity({
        aktivitas: `Menambahkan task di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
    });

    const populated = await GroupTask.findById(doc._id)
        .populate('idMahasiswa', 'nama')
        .lean();

    return {
        id: populated._id.toString(),
        task: populated.task,
        mahasiswa: (populated.idMahasiswa || []).map((m) => m.nama),
        status: populated.status,
    };
};

const updateTask = async (idThread, idTask, payload, user) => {
    if (
        !mongoose.isValidObjectId(idThread) ||
        !mongoose.isValidObjectId(idTask)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const taskDoc = await GroupTask.findOne({
        _id: idTask,
        idThread,
    });

    if (!taskDoc) throw new ApiError(404, 'Task tidak ditemukan');

    const { task, IdMahasiswa, status } = payload;

    if (task !== undefined) taskDoc.task = task;
    if (status !== undefined) taskDoc.status = status;
    if (Array.isArray(IdMahasiswa)) {
        const mhsIds = Array.from(new Set(IdMahasiswa)).filter((id) =>
        mongoose.isValidObjectId(id),
        );
        taskDoc.idMahasiswa = mhsIds;
    }

    await taskDoc.save();

    await logActivity({
        aktivitas: `Mengubah task di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
    });
};

const deleteTask = async (idThread, idTask, user) => {
    if (
        !mongoose.isValidObjectId(idThread) ||
        !mongoose.isValidObjectId(idTask)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const taskDoc = await GroupTask.findOne({
        _id: idTask,
        idThread,
    });

    if (!taskDoc) throw new ApiError(404, 'Task tidak ditemukan');

    await taskDoc.deleteOne();

    await logActivity({
        aktivitas: `Menghapus task di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
    });
};

module.exports = {
    listTasksByThread,
    createTask,
    updateTask,
    deleteTask,
};
