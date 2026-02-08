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

// Indexes for performance optimization
privateFileSchema.index({ idMahasiswa: 1 });           // Existing: for student's files
privateFileSchema.index({ status: 1 });                // For filtering by visibility
privateFileSchema.index({ createdAt: -1 });            // For sorting by upload date
privateFileSchema.index({ idMahasiswa: 1, createdAt: -1 }); // Compound: student's recent files

const PrivateFile = mongoose.model('PrivateFile', privateFileSchema);

module.exports = PrivateFile;
