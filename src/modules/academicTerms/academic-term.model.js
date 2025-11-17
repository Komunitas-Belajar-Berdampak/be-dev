const mongoose = require('mongoose');

const { Schema } = mongoose;

const academicTermSchema = new Schema(
    {
        periode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        },
        startDate: {
        type: Date,
        },
        endDate: {
        type: Date,
        },
        status: {
        type: String,
        enum: ['aktif', 'tidak aktif'],
        default: 'tidak aktif',
        },
    },
    {
        timestamps: true,
    },
);

const AcademicTerm = mongoose.model('AcademicTerm', academicTermSchema);

module.exports = AcademicTerm;