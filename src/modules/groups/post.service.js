const { randomUUID } = require('crypto');
const mongoose = require('mongoose');
const GroupThread = require('./group-thread.model');
const GroupPost = require('./group-post.model');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const ContributionThread = require('./contribution-thread.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');
const { uploadBuffer } = require('../../libs/s3');
const { logActivity } = require('./activity-log.service');
const { parsePagination, buildPagination } = require('../../utils/pagination');
const ai = require('../../libs/ai');

const processImages = async (node) => {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'image' && node.attrs?.src) {
        const src = node.attrs.src;

        if (src.startsWith('blob:')) {
            throw new ApiError(400, 'Gambar blob tidak bisa diproses server. Konversi ke base64 terlebih dahulu di frontend');
        }

        if (src.startsWith('data:')) {
            const matches = src.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                const mime = matches[1];
                const base64data = matches[2];
                const ext = mime.split('/')[1]?.split('+')[0] || 'png';
                const key = `groups/posts/${randomUUID()}.${ext}`;
                const s3Url = await uploadBuffer(key, Buffer.from(base64data, 'base64'), mime);
                node.attrs.src = s3Url;
            }
        }
    }

    if (Array.isArray(node.content)) {
        await Promise.all(node.content.map(processImages));
    }
};

const MAX_POINT_PER_POST = 25;

const listPostsByThread = async (idThread, query) => {
    if (!mongoose.isValidObjectId(idThread)) throw new ApiError(400, 'ID thread tidak valid');

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const { page, limit, skip } = parsePagination(query);

    const filter = { idThread };
    const totalItems = await GroupPost.countDocuments(filter);

    const posts = await GroupPost.find(filter)
        .populate('idAuthor', 'nrp nama')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: posts.map((p) => ({
        id: p._id.toString(),
        author: { nrp: p.idAuthor.nrp, nama: p.idAuthor.nama },
        konten: p.konten,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        })),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getPostById = async (idPost) => {
    if (!mongoose.isValidObjectId(idPost)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const post = await GroupPost.findById(idPost)
        .populate('idAuthor', 'nrp nama')
        .lean();

    if (!post) throw new ApiError(404, 'Post tidak ditemukan');

    return {
        id: post._id.toString(),
        author: {
            nrp: post.idAuthor.nrp,
            nama: post.idAuthor.nama,
        },
        konten: post.konten,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
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

    await processImages(konten);

    // Nilai kualitas konten via AI dan dapatkan skor poin (0-25)
    // Post selalu tersimpan — score 0 berarti tidak dapat poin, bukan ditolak
    const { score, reason } = await ai.validatePostContent(konten, thread.judul);

    const post = await GroupPost.create({
        idThread,
        idAuthor: user.sub,
        konten,
        poin: score,
    });

    if (score > 0) {
        await Promise.all([
            GroupMember.findOneAndUpdate(
            {
                idGroup: thread.idGroup,
                idMahasiswa: user.sub,
            },
            { $inc: { kontribusi: score } },
            { new: true },
            ).exec(),
            StudyGroup.findByIdAndUpdate(thread.idGroup, {
            $inc: { totalKontribusi: score },
            }).exec(),
            GroupThread.findByIdAndUpdate(idThread, {
            $inc: { kontribusi: score },
            }).exec(),
            ContributionThread.findOneAndUpdate(
            {
                idThread: idThread,
                idMahasiswa: user.sub,
            },
            { $inc: { kontribusi: score } },
            { upsert: true, new: true },
            ).exec(),
        ]);
    }

    await logActivity({
        aktivitas: `Menambahkan post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
        kontribusi: score,
    });

    return {
        id: post._id.toString(),
        author: {
        nrp: author.nrp,
        nama: author.nama,
        },
        konten: post.konten,
        poin: score,
        ...(score === 0 && { peringatan: reason || 'Konten kurang berkualitas, tidak mendapat poin kontribusi' }),
    };
};

const updatePost = async (idPost, user, konten) => {
    if (!mongoose.isValidObjectId(idPost)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const post = await GroupPost.findById(idPost);
    if (!post) throw new ApiError(404, 'Post tidak ditemukan');

    const thread = await GroupThread.findById(post.idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const isOwner = post.idAuthor.toString() === user.sub;
    const isPrivileged =
        Array.isArray(user.roles) &&
        (user.roles.includes('SUPER_ADMIN') || user.roles.includes('DOSEN'));

    if (!isOwner && !isPrivileged) {
        throw new ApiError(403, 'Anda tidak boleh mengedit post ini');
    }

    await processImages(konten);
    post.konten = konten;
    await post.save();

    await logActivity({
        aktivitas: `Mengedit post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
        kontribusi: 0,
    });
};

const deletePost = async (idPost, user) => {
    if (!mongoose.isValidObjectId(idPost)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const post = await GroupPost.findById(idPost);
    if (!post) throw new ApiError(404, 'Post tidak ditemukan');

    const thread = await GroupThread.findById(post.idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const isOwner = post.idAuthor.toString() === user.sub;
    const isPrivileged =
        Array.isArray(user.roles) &&
        (user.roles.includes('SUPER_ADMIN') || user.roles.includes('DOSEN'));

    if (!isOwner && !isPrivileged) {
        throw new ApiError(403, 'Anda tidak boleh menghapus post ini');
    }

    const poinPost = post.poin || 0;

    await post.deleteOne();

    if (poinPost > 0) {
        await Promise.all([
            GroupMember.findOneAndUpdate(
            {
                idGroup: thread.idGroup,
                idMahasiswa: post.idAuthor,
            },
            { $inc: { kontribusi: -poinPost } },
            { new: true },
            ).exec(),
            StudyGroup.findByIdAndUpdate(thread.idGroup, {
            $inc: { totalKontribusi: -poinPost },
            }).exec(),
            GroupThread.findByIdAndUpdate(post.idThread, {
            $inc: { kontribusi: -poinPost },
            }).exec(),
            ContributionThread.findOneAndUpdate(
            {
                idThread: post.idThread,
                idMahasiswa: post.idAuthor,
            },
            { $inc: { kontribusi: -poinPost } },
            { new: true },
            ).exec(),
        ]);
    }

    await logActivity({
        aktivitas: `Menghapus post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
        kontribusi: -poinPost,
    });
};

module.exports = {
    listPostsByThread,
    getPostById,
    createPost,
    updatePost,
    deletePost,
};
