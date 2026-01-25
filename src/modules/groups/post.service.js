const mongoose = require('mongoose');
const GroupThread = require('./group-thread.model');
const GroupPost = require('./group-post.model');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');
const { logActivity } = require('./activity-log.service');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const POINT_PER_POST = 10;

const listPostsByThread = async (idThread, query) => {
    if (!mongoose.isValidObjectId(idThread)) throw new ApiError(400, 'ID thread tidak valid');

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const { page, limit, skip } = parsePagination(query);

    const filter = { idThread };
    const totalItems = await GroupPost.countDocuments(filter);

    const posts = await GroupPost.find(filter)
        .populate('idAuthor', 'nrp nama')
        .sort({ updatedAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: posts.map((p) => ({
        id: p._id.toString(),
        author: { nrp: p.idAuthor.nrp, nama: p.idAuthor.nama },
        konten: p.konten,
        updatedAt: p.updatedAt,
        })),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const createPost = async (idThread, user, konten) => {
    if (!mongoose.isValidObjectId(idThread)) {
        throw new ApiError(400, 'ID thread tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const author = await User.findById(user.sub).lean();
    if (!author) throw new ApiError(404, 'User tidak ditemukan');

    const post = await GroupPost.create({
        idThread,
        idAuthor: user.sub,
        konten,
    });

    await Promise.all([
        GroupMember.findOneAndUpdate(
        {
            idGroup: thread.idGroup,
            idMahasiswa: user.sub,
        },
        { $inc: { kontribusi: POINT_PER_POST } },
        { new: true },
        ).exec(),
        StudyGroup.findByIdAndUpdate(thread.idGroup, {
        $inc: { totalKontribusi: POINT_PER_POST },
        }).exec(),
        GroupThread.findByIdAndUpdate(idThread, {
        $inc: { kontribusi: POINT_PER_POST },
        }).exec(),
    ]);

    await logActivity({
        aktivitas: `Menambahkan post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
    });

    return {
        id: post._id.toString(),
        author: {
        nrp: author.nrp,
        nama: author.nama,
        },
        konten: post.konten,
    };
};

const updatePost = async (idThread, idPost, user, konten) => {
    if (
        !mongoose.isValidObjectId(idThread) ||
        !mongoose.isValidObjectId(idPost)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const post = await GroupPost.findOne({
        _id: idPost,
        idThread,
    });

    if (!post) throw new ApiError(404, 'Post tidak ditemukan');

    const isOwner = post.idAuthor.toString() === user.sub;
    const isPrivileged =
        Array.isArray(user.roles) &&
        (user.roles.includes('SUPER_ADMIN') || user.roles.includes('DOSEN'));

    if (!isOwner && !isPrivileged) {
        throw new ApiError(403, 'Anda tidak boleh mengedit post ini');
    }

    post.konten = konten;
    await post.save();

    await logActivity({
        aktivitas: `Mengedit post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
    });
};

const deletePost = async (idThread, idPost, user) => {
    if (
        !mongoose.isValidObjectId(idThread) ||
        !mongoose.isValidObjectId(idPost)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const post = await GroupPost.findOne({
        _id: idPost,
        idThread,
    });

    if (!post) throw new ApiError(404, 'Post tidak ditemukan');

    const isOwner = post.idAuthor.toString() === user.sub;
    const isPrivileged =
        Array.isArray(user.roles) &&
        (user.roles.includes('SUPER_ADMIN') || user.roles.includes('DOSEN'));

    if (!isOwner && !isPrivileged) {
        throw new ApiError(403, 'Anda tidak boleh menghapus post ini');
    }

    await post.deleteOne();

    await Promise.all([
        GroupMember.findOneAndUpdate(
        {
            idGroup: thread.idGroup,
            idMahasiswa: post.idAuthor,
        },
        { $inc: { kontribusi: -POINT_PER_POST } },
        { new: true },
        ).exec(),
        StudyGroup.findByIdAndUpdate(thread.idGroup, {
        $inc: { totalKontribusi: -POINT_PER_POST },
        }).exec(),
        GroupThread.findByIdAndUpdate(idThread, {
        $inc: { kontribusi: -POINT_PER_POST },
        }).exec(),
    ]);

    await logActivity({
        aktivitas: `Menghapus post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
    });
};

module.exports = {
    listPostsByThread,
    createPost,
    updatePost,
    deletePost,
};
