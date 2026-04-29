const mongoose = require('mongoose');

const { Schema } = mongoose;

const contributionReviewSchema = new Schema(
    {
        idPost: {
            type: Schema.Types.ObjectId,
            ref: 'GroupPost',
            required: true,
            unique: true,
        },
        idStudent: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        idStudyGroup: {
            type: Schema.Types.ObjectId,
            ref: 'StudyGroup',
            required: true,
        },
        idThread: {
            type: Schema.Types.ObjectId,
            ref: 'GroupThread',
            required: true,
        },
        idAssignment: {
            type: Schema.Types.ObjectId,
            ref: 'Assignment',
            default: null,
        },
        aiSuggestedPoints: {
            type: Number,
            default: 0,
            min: 0,
        },
        aiReason: {
            type: String,
            default: '',
        },
        finalPoints: {
            type: Number,
            default: null,
            min: 0,
        },
        lecturerNote: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['PENDING', 'REVIEWED'],
            default: 'PENDING',
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

contributionReviewSchema.index({ idStudyGroup: 1, status: 1, createdAt: -1 });
contributionReviewSchema.index({ idStudent: 1, status: 1 });
contributionReviewSchema.index({ idThread: 1 });
contributionReviewSchema.index({ idAssignment: 1, status: 1 });

const ContributionReview = mongoose.model('ContributionReview', contributionReviewSchema);

module.exports = ContributionReview;
