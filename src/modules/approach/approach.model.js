const mongoose = require('mongoose');

const { Schema } = mongoose;

const approachSchema = new Schema(
    {
        idMahasiswa: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        },
        gayaBelajar: {
        type: [String],
        default: [],
        },
    },
    { timestamps: true },
);


const Approach = mongoose.model('Approach', approachSchema);

module.exports = Approach;
