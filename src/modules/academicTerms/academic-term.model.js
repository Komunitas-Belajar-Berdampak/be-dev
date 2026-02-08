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

// Indexes for performance optimization
academicTermSchema.index({ status: 1 });               // For filtering active/inactive periods
academicTermSchema.index({ startDate: 1, endDate: 1 }); // For date range queries

const AcademicTerm = mongoose.model('AcademicTerm', academicTermSchema);

module.exports = AcademicTerm;