const mongoose = require('mongoose');

const { Schema } = mongoose;

const groupThreadSchema = new Schema(
    {
        idGroup: {
        type: Schema.Types.ObjectId,
        ref: 'StudyGroup',
        required: true,
        },
        judul: {
        type: String,
        required: true,
        trim: true,
        },
        idAssignment: {
        type: Schema.Types.ObjectId,
        ref: 'Assignment',
        },
        kontribusi: {
        type: Number,
        default: 0, 
        },
    },
    { timestamps: true },
);

// Indexes for performance optimization
groupThreadSchema.index({ idGroup: 1 });               // Existing: for group filtering
groupThreadSchema.index({ idAssignment: 1 });          // For assignment-related threads
groupThreadSchema.index({ createdAt: -1 });            // For sorting by creation date
groupThreadSchema.index({ idGroup: 1, createdAt: -1 }); // Compound: group threads sorted

const GroupThread = mongoose.model('GroupThread', groupThreadSchema);

module.exports = GroupThread;
