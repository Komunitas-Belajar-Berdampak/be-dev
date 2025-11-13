const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        nrp: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        },
        nama: {
        type: String,
        required: true,
        trim: true,
        },
        angkatan: {
        type: String,
        },
        idProdi: {
        type: Schema.Types.ObjectId,
        ref: 'Major', 
        required: false,
        },
        email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        },
        alamat: {
        type: String,
        },
        jenisKelamin: {
        type: String,
        enum: ['pria', 'wanita'],
        required: true,
        },
        status: {
        type: String,
        enum: ['aktif', 'tidak aktif'],
        default: 'aktif',
        },
        passwordHash: {
        type: String,
        required: true,
        },
        roleIds: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Role',
        },
        ],
        token: {
        type: String, 
        },
        fotoProfil: {
        type: String,
        },
    },
    {
        timestamps: true,
    },
);

const User = mongoose.model('User', userSchema);

module.exports = User;