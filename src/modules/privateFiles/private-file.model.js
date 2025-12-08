const mongoose = require('mongoose');

const { Schema } = mongoose;

const privateFileSchema = new Schema(
    {
        idMahasiswa: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        },
        namaFile: {
        type: String,
        required: true,
        trim: true,
        },
        pathFile: {
        type: String,
        required: true,
        trim: true,
        },
        size: {
        type: String,
        required: true,
        },
        tipe: {
        type: String,
        },
        status: {
        type: String,
        enum: ['VISIBLE', 'PRIVATE'],
        default: 'PRIVATE',
        },
    },
    { timestamps: true },
);

privateFileSchema.index({ idMahasiswa: 1 });

const PrivateFile = mongoose.model('PrivateFile', privateFileSchema);

module.exports = PrivateFile;
