const mongoose = require('mongoose');

const { Schema } = mongoose;

const groupPostSchema = new Schema(
    {
        idThread: {
        type: Schema.Types.ObjectId,
        ref: 'GroupThread',
        required: true,
        },
        idAuthor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        },
        konten: {
        type: Schema.Types.Mixed,
        required: true,
        },
    },
    { timestamps: true },
);

groupPostSchema.index({ idThread: 1 });

const GroupPost = mongoose.model('GroupPost', groupPostSchema);

module.exports = GroupPost;
