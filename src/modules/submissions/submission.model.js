const mongoose = require('mongoose');

const { Schema } = mongoose;

const submissionSchema = new Schema(
    {
        idAssignment: {
        type: Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
        },
        idStudent: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        },
        submittedAt: {
        type: Date,
        required: true,
        default: Date.now,
        },
        file: {
        type: String,
        required: true,
        trim: true,
        },
        nilai: {
        type: Number,
        min: 0,
        max: 100,
        },
        gradedAt: {
        type: Date,
        },
    },
    {
        timestamps: true,
    },
);

submissionSchema.index(
    { idAssignment: 1, idStudent: 1 },
    {
        unique: true,
        partialFilterExpression: { idStudent: { $exists: true, $ne: null } },
    },
);

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
