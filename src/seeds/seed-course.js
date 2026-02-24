// src/seeds/seed-course.js
require('dotenv').config();
const mongoose = require('mongoose');

const config = require('../config');
const AcademicTerm = require('../modules/academicTerms/academic-term.model');
const Course = require('../modules/courses/course.model');

const DUMMY_COURSES = [
    { kodeMatkul: 'IF101', namaMatkul: 'Algoritma dan Pemrograman', sks: 3, kelas: 'A' },
    { kodeMatkul: 'IF102', namaMatkul: 'Struktur Data', sks: 3, kelas: 'A' },
    { kodeMatkul: 'IF103', namaMatkul: 'Basis Data', sks: 3, kelas: 'B' },
    { kodeMatkul: 'IF104', namaMatkul: 'Rekayasa Perangkat Lunak', sks: 3, kelas: 'A' },
    { kodeMatkul: 'IF105', namaMatkul: 'Jaringan Komputer', sks: 2, kelas: 'B' },
];

async function main() {
    try {
        console.log('[seed-course] connecting to MongoDB:', config.mongoUri);
        await mongoose.connect(config.mongoUri);
        console.log('[seed-course] MongoDB connected');

        const periode = await AcademicTerm.findOne({ status: 'aktif' }).lean();
        if (!periode) {
            console.error('[seed-course] Tidak ada periode akademik aktif. Buat periode aktif dulu.');
            process.exit(1);
        }
        console.log(`[seed-course] Menggunakan periode: ${periode.periode} (id=${periode._id})`);

        let created = 0;
        let skipped = 0;

        for (const data of DUMMY_COURSES) {
            const exists = await Course.findOne({ kodeMatkul: data.kodeMatkul }).lean();
            if (exists) {
                console.log(`[seed-course] Skip: ${data.kodeMatkul} sudah ada`);
                skipped++;
                continue;
            }

            await Course.create({
                ...data,
                status: 'aktif',
                idPeriode: periode._id,
                idPengajar: [],
                idMahasiswa: [],
            });

            console.log(`[seed-course] Dibuat: ${data.kodeMatkul} - ${data.namaMatkul}`);
            created++;
        }

        console.log(`\n[seed-course] Selesai. Dibuat: ${created}, Dilewati: ${skipped}`);
    } catch (err) {
        console.error('[seed-course] Gagal:', err);
    } finally {
        await mongoose.connection.close();
        console.log('[seed-course] MongoDB connection closed');
        process.exit(0);
    }
}

main();
