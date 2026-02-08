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

// Indexes for performance optimization
groupPostSchema.index({ idThread: 1 });                // Existing: for thread filtering
groupPostSchema.index({ idAuthor: 1 });                // For author's posts
groupPostSchema.index({ updatedAt: 1 });               // For sorting by update time
groupPostSchema.index({ idThread: 1, updatedAt: 1 });  // Compound: posts in thread sorted

const GroupPost = mongoose.model('GroupPost', groupPostSchema);

module.exports = GroupPost;
