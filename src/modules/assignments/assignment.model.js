const mongoose = require('mongoose');

const { Schema } = mongoose;

const assignmentSchema = new Schema(
    {
        idMeeting: {
        type: Schema.Types.ObjectId,
        ref: 'Meeting',
        required: true,
        },
        judul: {
        type: String,
        required: true,
        trim: true,
        },
        statusTugas: {
        type: Boolean, // true = kelompok, false = individu
        required: true,
        },
        tenggat: {
        type: Date,
        required: true,
        },
        status: {
        type: String,
        enum: ['HIDE', 'VISIBLE'],
        default: 'HIDE',
        },
        deskripsi: {
        type: Schema.Types.Mixed, // TipTap object
        },
        pathLampiran: {
        type: String,
        trim: true,
        },
    },
    {
        timestamps: true,
    },
);

// Indexes for performance optimization
assignmentSchema.index({ idMeeting: 1 });              // Existing: for meeting filtering
assignmentSchema.index({ status: 1 });                 // For visibility filtering
assignmentSchema.index({ tenggat: 1 });                // For sorting by deadline
assignmentSchema.index({ idMeeting: 1, status: 1 });   // Compound: common query pattern

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
