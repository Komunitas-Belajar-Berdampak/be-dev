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

// Indexes for performance optimization
submissionSchema.index(
    { idAssignment: 1, idStudent: 1 },
    {
        unique: true,
        partialFilterExpression: { idStudent: { $exists: true, $ne: null } },
    },
);
submissionSchema.index({ idAssignment: 1 });           // For listing all assignment submissions
submissionSchema.index({ idStudent: 1 });              // For student's submissions
submissionSchema.index({ submittedAt: -1 });           // For sorting by submission date
submissionSchema.index({ idStudent: 1, submittedAt: -1 }); // Compound: student's recent submissions

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
