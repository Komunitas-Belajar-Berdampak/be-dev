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

studyGroupSchema.index(
    { idCourse: 1, nama: 1 },
    { unique: true },
);

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);

module.exports = StudyGroup;
