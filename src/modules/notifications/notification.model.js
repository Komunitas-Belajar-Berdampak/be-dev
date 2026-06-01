const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
        idUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        tipe: {
            type: String,
            enum: ['NEW_ASSIGNMENT', 'DEADLINE_SOON', 'LATE_SUBMISSION'],
            required: true,
        },
        judul: { type: String, required: true, trim: true },
        pesan: { type: String, required: true, trim: true },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
        idCourse: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
        idAssignment: { type: Schema.Types.ObjectId, ref: 'Assignment', default: null },
        link: { type: String, trim: true, default: null },
    },
    { timestamps: true },
);

notificationSchema.index({ idUser: 1, createdAt: -1 });
notificationSchema.index({ idUser: 1, isRead: 1 });
notificationSchema.index({ idUser: 1, tipe: 1, idAssignment: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
