const mongoose = require('mongoose');

const { Schema } = mongoose;

const groupTaskSchema = new Schema(
    {
        idThread: {
        type: Schema.Types.ObjectId,
        ref: 'GroupThread',
        required: true,
        },
        idMahasiswa: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        ],
        task: {
        type: String,
        required: true,
        trim: true,
        },
        status: {
        type: String,
        enum: ['DO', 'IN PROGRESS', 'DONE'],
        default: 'DO',
        },
    },
    { timestamps: true },
);

groupTaskSchema.index({ idThread: 1 });

const GroupTask = mongoose.model('GroupTask', groupTaskSchema);

module.exports = GroupTask;
