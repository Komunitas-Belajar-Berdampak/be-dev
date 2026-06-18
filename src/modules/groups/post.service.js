const { randomUUID } = require('crypto');
const mongoose = require('mongoose');
const GroupThread = require('./group-thread.model');
const GroupPost = require('./group-post.model');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const ContributionThread = require('./contribution-thread.model');
const ContributionReview = require('../contributionReviews/contribution-review.model');
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

const PREVIEW_MAX_LENGTH = 120;

// Ekstrak teks dari konten Tiptap (JSONContent) untuk dijadikan preview singkat
const extractText = (node) => {
    if (!node || typeof node !== 'object') return '';
    let text = typeof node.text === 'string' ? node.text : '';
    if (Array.isArray(node.content)) {
        text += node.content.map(extractText).join(' ');
    }
    return text;
};

const buildKontenPreview = (konten) => {
    const text = extractText(konten).replace(/\s+/g, ' ').trim();
    if (text.length <= PREVIEW_MAX_LENGTH) return text;
    return `${text.slice(0, PREVIEW_MAX_LENGTH)}...`;
};

// Bentuk objek parentPost preview dari dokumen post (sudah ter-populate idAuthor)
const buildParentPost = (parent) => {
    if (!parent) return null;
    return {
        id: parent._id.toString(),
        author: {
            nrp: parent.idAuthor?.nrp,
            nama: parent.idAuthor?.nama,
        },
        kontenPreview: buildKontenPreview(parent.konten),
        createdAt: parent.createdAt,
    };
};

const listPostsByThread = async (idThread, query) => {
    if (!mongoose.isValidObjectId(idThread)) throw new ApiError(400, 'ID thread tidak valid');

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const { page, limit, skip } = parsePagination(query);

    const filter = { idThread };
    const totalItems = await GroupPost.countDocuments(filter);

    const posts = await GroupPost.find(filter)
        .populate('idAuthor', 'nrp nama')
        .populate({
            path: 'parentPostId',
            select: 'konten createdAt idAuthor',
            populate: { path: 'idAuthor', select: 'nrp nama' },
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: posts.map((p) => ({
        id: p._id.toString(),
        author: { nrp: p.idAuthor.nrp, nama: p.idAuthor.nama },
        konten: p.konten,
        parentPostId: p.parentPostId ? p.parentPostId._id.toString() : null,
        parentPost: buildParentPost(p.parentPostId),
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
        .populate({
            path: 'parentPostId',
            select: 'konten createdAt idAuthor',
            populate: { path: 'idAuthor', select: 'nrp nama' },
        })
        .lean();

    if (!post) throw new ApiError(404, 'Post tidak ditemukan');

    return {
        id: post._id.toString(),
        author: {
            nrp: post.idAuthor.nrp,
            nama: post.idAuthor.nama,
        },
        konten: post.konten,
        parentPostId: post.parentPostId ? post.parentPostId._id.toString() : null,
        parentPost: buildParentPost(post.parentPostId),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    };
};

const createPost = async (idThread, user, konten, parentPostId = null) => {
    if (!mongoose.isValidObjectId(idThread)) {
        throw new ApiError(400, 'ID thread tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const author = await User.findById(user.sub).lean();
    if (!author) throw new ApiError(404, 'User tidak ditemukan');

    // Jika reply: parent harus ada & berada di thread yang sama
    let parent = null;
    if (parentPostId) {
        if (!mongoose.isValidObjectId(parentPostId)) {
            throw new ApiError(400, 'ID parent post tidak valid');
        }
        parent = await GroupPost.findById(parentPostId)
            .populate('idAuthor', 'nrp nama')
            .lean();
        if (!parent) throw new ApiError(404, 'Parent post tidak ditemukan');
        if (parent.idThread.toString() !== idThread) {
            throw new ApiError(400, 'Parent post harus berada di thread yang sama');
        }
    }

    await processImages(konten);

    const isPrivileged =
        Array.isArray(user.roles) &&
        (user.roles.includes('SUPER_ADMIN') || user.roles.includes('DOSEN'));

    let score = 0;
    let reason = '';
    if (!isPrivileged) {
        const result = await ai.validatePostContent(konten, thread.judul);
        score = result.score;
        reason = result.reason || '';
    }

    const post = await GroupPost.create({
        idThread,
        idAuthor: user.sub,
        parentPostId: parent ? parent._id : null,
        konten,
    });

    if (!isPrivileged) {
        await ContributionReview.create({
            idPost: post._id,
            idStudent: user.sub,
            idStudyGroup: thread.idGroup,
            idThread: thread._id,
            idAssignment: thread.idAssignment || null,
            aiSuggestedPoints: score,
            aiReason: reason,
            status: 'PENDING',
            finalPoints: null,
            lecturerNote: null,
            reviewedAt: null,
        });
    }

    await logActivity({
        aktivitas: `Menambahkan post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
        kontribusi: 0,
    });

    return {
        id: post._id.toString(),
        author: {
            nrp: author.nrp,
            nama: author.nama,
        },
        konten: post.konten,
        parentPostId: parent ? parent._id.toString() : null,
        parentPost: buildParentPost(parent),
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

    const review = await ContributionReview.findOne({ idPost: post._id });
    const reviewedPoints =
        review && review.status === 'REVIEWED' && typeof review.finalPoints === 'number'
            ? review.finalPoints
            : 0;

    if (reviewedPoints > 0) {
        await Promise.all([
            GroupMember.findOneAndUpdate(
                { idGroup: thread.idGroup, idMahasiswa: post.idAuthor },
                { $inc: { kontribusi: -reviewedPoints } },
            ).exec(),
            StudyGroup.findByIdAndUpdate(thread.idGroup, {
                $inc: { totalKontribusi: -reviewedPoints },
            }).exec(),
            GroupThread.findByIdAndUpdate(post.idThread, {
                $inc: { kontribusi: -reviewedPoints },
            }).exec(),
            ContributionThread.findOneAndUpdate(
                { idThread: post.idThread, idMahasiswa: post.idAuthor },
                { $inc: { kontribusi: -reviewedPoints } },
            ).exec(),
        ]);
    }

    if (review) {
        await review.deleteOne();
    }

    await post.deleteOne();

    await logActivity({
        aktivitas: `Menghapus post di thread: ${thread.judul}`,
        idUser: user.sub,
        idContribusionThread: thread._id,
        kontribusi: -reviewedPoints,
    });
};

module.exports = {
    listPostsByThread,
    getPostById,
    createPost,
    updatePost,
    deletePost,
};
