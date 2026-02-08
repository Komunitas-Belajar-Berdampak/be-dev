const mongoose = require('mongoose');

const { Schema } = mongoose;

const meetingSchema = new Schema(
    {
        idCourse: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        },
        pertemuan: {
        type: Number,
        required: true,
        min: 1,
        max: 16,
        },
        judul: {
        type: String,
        required: true,
        trim: true,
        },
        deskripsi: {
        type: Schema.Types.Mixed, // object TipTap
        },
    },
    {
        timestamps: true,
    },
);

// Indexes for performance optimization
meetingSchema.index({ idCourse: 1, pertemuan: 1 }, { unique: true }); // Existing: compound unique
meetingSchema.index({ idCourse: 1 });                  // For listing all meetings by course

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
