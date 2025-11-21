const mongoose = require('mongoose');

const { Schema } = mongoose;

const groupMemberSchema = new Schema(
    {
        idGroup: {
        type: Schema.Types.ObjectId,
        ref: 'StudyGroup',
        required: true,
        },
        idMahasiswa: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        },
        status: {
        type: String,
        enum: ['PENDING', 'REJECTED', 'APPROVED'],
        default: 'PENDING',
        },
        kontribusi: {
        type: Number,
        default: 0,
        },
    },
    { timestamps: true },
);

groupMemberSchema.index(
    { idGroup: 1, idMahasiswa: 1 },
    { unique: true },
);

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);

module.exports = GroupMember;
