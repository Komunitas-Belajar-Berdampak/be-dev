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
        kontribusi: {
        type: Number,
        default: 0,
        },
    },
    { timestamps: true },
);

// Indexes for performance optimization
activityLogSchema.index({ idUser: 1 });                           // For user's activities
activityLogSchema.index({ idContribusionThread: 1 });             // For thread activities
activityLogSchema.index({ createdAt: 1 });                        // For sorting by time
activityLogSchema.index({ idUser: 1, createdAt: -1 });            // Compound: user's recent activities
activityLogSchema.index({ idContribusionThread: 1, createdAt: 1 }); // Compound: thread activities sorted

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
