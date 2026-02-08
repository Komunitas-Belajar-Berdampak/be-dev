const mongoose = require('mongoose');

const { Schema } = mongoose;

const materialSchema = new Schema(
    {
        idMeeting: {
        type: Schema.Types.ObjectId,
        ref: 'Meeting',
        required: true,
        },
        idCourse: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        },
        pathFile: {
        type: String,
        required: true,
        trim: true,
        },
        namaFile: {
        type: String,
        required: true,
        trim: true,
        },
        tipe: {
        type: String,
        required: true,
        trim: true,
        },
        deskripsi: {
        type: Schema.Types.Mixed, 
        },
        status: {
        type: String,
        enum: ['HIDE', 'VISIBLE'],
        default: 'HIDE',
        },
    },
    {
        timestamps: true,
    },
);

// Indexes for performance optimization
materialSchema.index({ idCourse: 1, idMeeting: 1 });   // Existing: compound index
materialSchema.index({ idCourse: 1 });                 // For course materials
materialSchema.index({ idMeeting: 1 });                // For meeting materials
materialSchema.index({ status: 1 });                   // For visibility filtering
materialSchema.index({ idCourse: 1, status: 1 });      // Compound: course + visibility
materialSchema.index({ idMeeting: 1, status: 1 });     // Compound: meeting + visibility

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
