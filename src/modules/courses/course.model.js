const mongoose = require('mongoose');

const { Schema } = mongoose;

const courseSchema = new Schema(
    {
        kodeMatkul: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        },
        namaMatkul: {
        type: String,
        required: true,
        trim: true,
        },
        sks: {
        type: Number,
        required: true,
        min: 1,
        },
        status: {
        type: String,
        enum: ['aktif', 'tidak aktif'],
        default: 'aktif',
        },
        idPeriode: {
        type: Schema.Types.ObjectId,
        ref: 'AcademicTerm',
        required: true,
        },
        idPengajar: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        },
        idMahasiswa: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        ],
        kelas: {
        type: String,
        required: true,
        trim: true,
        },
        deskripsi: {
        type: Schema.Types.Mixed, 
        },
    },
    {
        timestamps: true,
    },
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
