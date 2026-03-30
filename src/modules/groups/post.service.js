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

    // Validasi kualitas konten via AI (jika GROQ_API_KEY terkonfigurasi)
    const validation = await ai.validatePostContent(konten, thread.judul);
    if (!validation.valid) {
        throw new ApiError(422, `Post ditolak oleh sistem AI: ${validation.reason}`);
    }

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
        ContributionThread.findOneAndUpdate(
        {
            idThread: idThread,
            idMahasiswa: user.sub,
        },
        { $inc: { kontribusi: POINT_PER_POST } },
        { upsert: true, new: true },
        ).exec(),
    ]);

    await logActivity({
        aktivitas: `Menambahkan post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
        kontribusi: POINT_PER_POST,
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
        GroupThread.findByIdAndUpdate(post.idThread, {
        $inc: { kontribusi: -POINT_PER_POST },
        }).exec(),
        ContributionThread.findOneAndUpdate(
        {
            idThread: post.idThread,
            idMahasiswa: post.idAuthor,
        },
        { $inc: { kontribusi: -POINT_PER_POST } },
        { new: true },
        ).exec(),
    ]);

    await logActivity({
        aktivitas: `Menghapus post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
        kontribusi: -POINT_PER_POST,
    });
};

module.exports = {
    listPostsByThread,
    getPostById,
    createPost,
    updatePost,
    deletePost,
};
