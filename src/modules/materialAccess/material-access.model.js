const mongoose = require('mongoose');

const { Schema } = mongoose;

const materialAccessSchema = new Schema(
    {
        idMahasiswa: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        idMaterial: {
            type: Schema.Types.ObjectId,
            ref: 'Material',
            required: true,
        },
        idCourse: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        accessedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false },
);

// Upsert pattern: satu record per (mahasiswa + material)
materialAccessSchema.index({ idMahasiswa: 1, idMaterial: 1 }, { unique: true });
// Untuk query "materi terakhir per mahasiswa"
materialAccessSchema.index({ idMahasiswa: 1, accessedAt: -1 });

const MaterialAccess = mongoose.model('MaterialAccess', materialAccessSchema);

module.exports = MaterialAccess;
