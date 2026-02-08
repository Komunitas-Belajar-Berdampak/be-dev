const mongoose = require('mongoose');

const { Schema } = mongoose;

const studyGroupSchema = new Schema(
    {
        idCourse: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        },
        nama: {
        type: String,
        required: true,
        trim: true,
        },
        kapasitas: {
        type: Number,
        required: true,
        min: 1,
        },
        status: {
        type: Boolean,
        default: false,
        },
        deskripsi: {
        type: String,
        trim: true,
        },
        totalKontribusi: {
        type: Number,
        default: 0,
        },
    },
    { timestamps: true },
);

// Indexes for performance optimization
studyGroupSchema.index(
    { idCourse: 1, nama: 1 },
    { unique: true },
);
studyGroupSchema.index({ idCourse: 1 });               // For listing groups by course
studyGroupSchema.index({ createdAt: -1 });             // For sorting by creation date
studyGroupSchema.index({ status: 1 });                 // For filtering by status

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);

module.exports = StudyGroup;
