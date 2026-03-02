// src/seeds/seed-meeting.js
require('dotenv').config();
const mongoose = require('mongoose');

const config = require('../config');
const Course = require('../modules/courses/course.model');
const Meeting = require('../modules/meetings/meeting.model');

async function main() {
    try {
        console.log('[seed-meeting] connecting to MongoDB:', config.mongoUri);
        await mongoose.connect(config.mongoUri);
        console.log('[seed-meeting] MongoDB connected');

        const course = await Course.findOne().lean();
        if (!course) {
            console.error('[seed-meeting] Tidak ada course di database. Buat course dulu.');
            process.exit(1);
        }
        console.log(`[seed-meeting] Menggunakan course: ${course.kodeMatkul} - ${course.namaMatkul} (id=${course._id})`);

        const existing = await Meeting.findOne({ idCourse: course._id, pertemuan: 1 }).lean();
        if (existing) {
            console.log(`[seed-meeting] Pertemuan 1 untuk course ${course.kodeMatkul} sudah ada, dilewati.`);
        } else {
            const meeting = await Meeting.create({
                idCourse: course._id,
                pertemuan: 1,
                judul: 'Pertemuan 1',
            });
            console.log(`[seed-meeting] Dummy pertemuan dibuat:`, {
                id: meeting._id.toString(),
                idCourse: meeting.idCourse.toString(),
                pertemuan: meeting.pertemuan,
                judul: meeting.judul,
            });
        }

        console.log('\n[seed-meeting] Selesai.');
    } catch (err) {
        console.error('[seed-meeting] Gagal:', err);
    } finally {
        await mongoose.connection.close();
        console.log('[seed-meeting] MongoDB connection closed');
        process.exit(0);
    }
}

main();
