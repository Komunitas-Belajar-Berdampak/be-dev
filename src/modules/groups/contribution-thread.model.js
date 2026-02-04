const mongoose = require('mongoose');

const { Schema } = mongoose;

const contributionThreadSchema = new Schema(
    {
        idThread: {
            type: Schema.Types.ObjectId,
            ref: 'GroupThread',
            required: true,
        },
        idMahasiswa: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        kontribusi: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true },
);

// Composite unique index - one record per student per thread
contributionThreadSchema.index(
    { idThread: 1, idMahasiswa: 1 },
    { unique: true },
);

// Index for querying by thread
contributionThreadSchema.index({ idThread: 1 });

// Index for querying by student
contributionThreadSchema.index({ idMahasiswa: 1 });

const ContributionThread = mongoose.model('ContributionThread', contributionThreadSchema);

module.exports = ContributionThread;
