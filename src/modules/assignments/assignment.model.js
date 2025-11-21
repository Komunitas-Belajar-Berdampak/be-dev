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

assignmentSchema.index({ idMeeting: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
