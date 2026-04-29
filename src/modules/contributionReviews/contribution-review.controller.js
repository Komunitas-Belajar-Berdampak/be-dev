const Joi = require('joi');
const { successResponse } = require('../../utils/http');
const reviewService = require('./contribution-review.service');

const patchReviewSchema = Joi.object({
    status: Joi.string().valid('REVIEWED').required(),
    finalPoints: Joi.number().min(0).required(),
    lecturerNote: Joi.string().allow('', null).optional(),
});

const getReviewsByStudyGroup = async (req, res, next) => {
    try {
        const result = await reviewService.listReviewsByStudyGroup(
            req.params.idStudyGroup,
            req.query,
        );
        return successResponse(res, {
            message: 'data berhasil diambil!',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
};

const patchReview = async (req, res, next) => {
    try {
        const { error, value } = patchReviewSchema.validate(req.body);
        if (error) throw error;

        await reviewService.patchReview(req.params.idReview, value);

        return successResponse(res, { message: 'data berhasil direviewed!' });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getReviewsByStudyGroup,
    patchReview,
};
