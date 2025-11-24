const mongoose = require('mongoose');

const { Schema } = mongoose;

const activityLogSchema = new Schema(
    {
        aktivitas: {
        type: String,
        required: true,
        trim: true,
        },
        idUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        },
        idContribusionThread: {
        type: Schema.Types.ObjectId,
        ref: 'GroupThread',
        },
    },
    { timestamps: true },
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
