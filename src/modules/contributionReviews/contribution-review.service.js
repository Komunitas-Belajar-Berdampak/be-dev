const mongoose = require('mongoose');
const ContributionReview = require('./contribution-review.model');
const StudyGroup = require('../groups/group.model');
const GroupMember = require('../groups/group-member.model');
const GroupThread = require('../groups/group-thread.model');
const ContributionThread = require('../groups/contribution-thread.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const formatReview = (review) => {
    const post = review.idPost;
    const thread = review.idThread;
    const student = review.idStudent;

    return {
        id: review._id.toString(),
        post: post
            ? {
                  id: post._id.toString(),
                  konten: post.konten,
                  createdAt: post.createdAt,
                  updatedAt: post.updatedAt,
              }
            : null,
        threadId: thread?._id?.toString() || null,
        threadTitle: thread?.judul || null,
        assignment: thread?.idAssignment?.judul || null,
        student: student
            ? {
                  id: student._id.toString(),
                  nrp: student.nrp,
                  nama: student.nama,
              }
            : null,
        aiSuggestedPoints: review.aiSuggestedPoints || 0,
        aiReason: review.aiReason || '',
        finalPoints: review.finalPoints,
        lecturerNote: review.lecturerNote,
        status: review.status,
        createdAt: review.createdAt,
        reviewedAt: review.reviewedAt,
    };
};

const listReviewsByStudyGroup = async (idStudyGroup, queryParams) => {
    if (!mongoose.isValidObjectId(idStudyGroup)) {
        throw new ApiError(400, 'ID study group tidak valid');
    }

    const group = await StudyGroup.findById(idStudyGroup).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const { page, limit, skip } = parsePagination(queryParams);

    const filter = { idStudyGroup };
    if (queryParams?.status) {
        if (!['PENDING', 'REVIEWED'].includes(queryParams.status)) {
            throw new ApiError(400, 'status harus PENDING atau REVIEWED');
        }
        filter.status = queryParams.status;
    }

    const totalItems = await ContributionReview.countDocuments(filter);

    const reviews = await ContributionReview.find(filter)
        .populate('idPost', 'konten createdAt updatedAt')
        .populate({
            path: 'idThread',
            select: 'judul idAssignment',
            populate: { path: 'idAssignment', select: 'judul' },
        })
        .populate('idStudent', 'nrp nama')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        items: reviews.map(formatReview),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const patchReview = async (idReview, payload) => {
    if (!mongoose.isValidObjectId(idReview)) {
        throw new ApiError(400, 'ID review tidak valid');
    }

    const review = await ContributionReview.findById(idReview);
    if (!review) throw new ApiError(404, 'Review tidak ditemukan');

    const { status, finalPoints, lecturerNote } = payload;

    if (status !== 'REVIEWED') {
        throw new ApiError(400, 'status harus REVIEWED');
    }

    if (typeof finalPoints !== 'number' || finalPoints < 0) {
        throw new ApiError(400, 'finalPoints harus angka >= 0');
    }

    const oldFinalPoints =
        review.status === 'REVIEWED' && typeof review.finalPoints === 'number'
            ? review.finalPoints
            : 0;
    const delta = finalPoints - oldFinalPoints;

    if (delta !== 0) {
        await Promise.all([
            GroupMember.findOneAndUpdate(
                { idGroup: review.idStudyGroup, idMahasiswa: review.idStudent },
                { $inc: { kontribusi: delta } },
            ).exec(),
            StudyGroup.findByIdAndUpdate(review.idStudyGroup, {
                $inc: { totalKontribusi: delta },
            }).exec(),
            GroupThread.findByIdAndUpdate(review.idThread, {
                $inc: { kontribusi: delta },
            }).exec(),
            ContributionThread.findOneAndUpdate(
                { idThread: review.idThread, idMahasiswa: review.idStudent },
                { $inc: { kontribusi: delta } },
                { upsert: true, new: true },
            ).exec(),
        ]);
    }

    review.status = 'REVIEWED';
    review.finalPoints = finalPoints;
    review.lecturerNote = lecturerNote ?? null;
    review.reviewedAt = new Date();
    await review.save();
};

module.exports = {
    listReviewsByStudyGroup,
    patchReview,
};
