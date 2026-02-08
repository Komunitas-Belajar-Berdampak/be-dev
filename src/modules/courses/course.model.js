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

// Indexes for performance optimization
courseSchema.index({ idPeriode: 1 });                  // For periode filtering
courseSchema.index({ idPengajar: 1 });                 // For teacher filtering
courseSchema.index({ idMahasiswa: 1 });                // For student filtering (array index)
courseSchema.index({ status: 1 });                     // For status filtering
courseSchema.index({ kelas: 1 });                      // For class filtering
courseSchema.index({ sks: 1 });                        // For sks filtering
courseSchema.index({ idPeriode: 1, status: 1 });       // Compound: periode + status
courseSchema.index({ idPengajar: 1, idPeriode: 1 });   // Compound: teacher's courses in period
courseSchema.index({ idMahasiswa: 1, idPeriode: 1 });  // Compound: student's courses in period

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
