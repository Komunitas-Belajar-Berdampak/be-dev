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

groupThreadSchema.index({ idGroup: 1 });

const GroupThread = mongoose.model('GroupThread', groupThreadSchema);

module.exports = GroupThread;
