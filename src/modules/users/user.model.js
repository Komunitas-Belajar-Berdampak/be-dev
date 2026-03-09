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
        isDefaultPassword: {
            type: Boolean,
            default: true,
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

userSchema.index({ roleIds: 1 });
userSchema.index({ idProdi: 1 });
userSchema.index({ angkatan: 1 });
userSchema.index({ status: 1 });
userSchema.index({ roleIds: 1, status: 1 });
userSchema.index({ idProdi: 1, angkatan: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;