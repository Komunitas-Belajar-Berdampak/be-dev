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

// Indexes for performance optimization
userSchema.index({ roleIds: 1 });                      // For role filtering
userSchema.index({ idProdi: 1 });                      // For prodi filtering
userSchema.index({ angkatan: 1 });                     // For angkatan filtering
userSchema.index({ status: 1 });                       // For status filtering
userSchema.index({ roleIds: 1, status: 1 });           // Compound: role + status filter
userSchema.index({ idProdi: 1, angkatan: 1 });         // Compound: prodi + angkatan filter

const User = mongoose.model('User', userSchema);

module.exports = User;