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
        type: Schema.Types.Mixed,
        },
        pathLampiran: {
        type: String,
        trim: true,
        },
        statusTenggat: {
        type: Boolean, // true = deadline aktif/dikunci, false = deadline dibuka (bisa submit kapanpun)
        default: true,
        },

        reopenedFor: [
        {
            idStudent: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            },
            until: {
            type: Date,
            },
        },
        ],
    },
    {
        timestamps: true,
    },
);

assignmentSchema.index({ idMeeting: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ tenggat: 1 });
assignmentSchema.index({ idMeeting: 1, status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
