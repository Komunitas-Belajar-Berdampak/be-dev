const mongoose = require('mongoose');
const Course = require('../courses/course.model');
const Meeting = require('../meetings/meeting.model');
const Assignment = require('../assignments/assignment.model');
const Submission = require('../submissions/submission.model');
const Material = require('../materials/material.model');
const MaterialAccess = require('../materialAccess/material-access.model');
const { ApiError } = require('../../utils/http');

const getStudentDashboard = async (user) => {
    const userId = user.sub;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'ID user tidak valid');
    }

    // 1. Ambil semua matkul aktif yang diikuti mahasiswa
    const courses = await Course.find({
        idMahasiswa: userId,
        status: 'aktif',
    })
        .select('kodeMatkul namaMatkul kelas sks')
        .lean();

    const courseIds = courses.map((c) => c._id);

    // Map courseId -> course (dipakai di bawah)
    const courseMap = courses.reduce((acc, c) => {
        acc[c._id.toString()] = c;
        return acc;
    }, {});

    // 2. Jalankan chain tugas DAN query lastAccess secara paralel
    //    karena lastAccess hanya butuh userId, tidak butuh courseIds
    const [meetings, lastAccess] = await Promise.all([
        Meeting.find({ idCourse: { $in: courseIds } })
            .select('_id idCourse pertemuan')
            .lean(),
        MaterialAccess.findOne({ idMahasiswa: userId })
            .sort({ accessedAt: -1 })
            .populate('idMaterial', 'namaFile tipe idMeeting')
            .populate('idCourse', 'namaMatkul kodeMatkul')
            .lean(),
    ]);

    const meetingIds = meetings.map((m) => m._id);

    // Map meetingId -> { idCourse, pertemuan }
    const meetingMap = meetings.reduce((acc, m) => {
        acc[m._id.toString()] = m;
        return acc;
    }, {});

    // 3. Ambil semua tugas VISIBLE dari meeting tersebut
    const assignments = await Assignment.find({
        idMeeting: { $in: meetingIds },
        status: 'VISIBLE',
    })
        .select('_id judul tenggat idMeeting')
        .lean();

    const assignmentIds = assignments.map((a) => a._id);

    // 4. Cek submission mahasiswa ini
    const submissions = await Submission.find({
        idAssignment: { $in: assignmentIds },
        idStudent: userId,
    })
        .select('idAssignment')
        .lean();

    const submittedIds = new Set(submissions.map((s) => s.idAssignment.toString()));

    // 5. Filter tugas yang belum dikumpulkan, urutkan by tenggat terdekat
    const now = new Date();
    const unsubmitted = assignments
        .filter((a) => !submittedIds.has(a._id.toString()))
        .sort((a, b) => new Date(a.tenggat) - new Date(b.tenggat));

    // 6. Tugas deadline dekat (max 5)
    const tugasDeadlineDekat = unsubmitted.slice(0, 5).map((a) => {
        const meeting = meetingMap[a.idMeeting.toString()];
        const course = meeting ? courseMap[meeting.idCourse.toString()] : null;
        return {
            id: a._id.toString(),
            judul: a.judul,
            tenggat: a.tenggat,
            sudahLewat: a.tenggat ? new Date(a.tenggat) < now : false,
            matkul: course?.namaMatkul ?? '-',
            pertemuan: meeting?.pertemuan ?? null,
        };
    });

    // 7. Summary
    const deadlineTerdekat = unsubmitted.length > 0 ? unsubmitted[0].tenggat : null;

    const summary = {
        jumlahKelas: courses.length,
        tugasBelumSelesai: unsubmitted.length,
        deadlineTerdekat,
    };

    let lastMateri = null;
    if (lastAccess && lastAccess.idMaterial) {
        const mat = lastAccess.idMaterial;
        const meetingInfo = mat.idMeeting
            ? meetingMap[mat.idMeeting.toString()] ?? null
            : null;

        lastMateri = {
            id: mat._id.toString(),
            namaFile: mat.namaFile,
            tipe: mat.tipe,
            accessedAt: lastAccess.accessedAt,
            matkul: lastAccess.idCourse
                ? {
                      id: lastAccess.idCourse._id.toString(),
                      namaMatkul: lastAccess.idCourse.namaMatkul,
                      kodeMatkul: lastAccess.idCourse.kodeMatkul,
                  }
                : null,
            pertemuan: meetingInfo?.pertemuan ?? null,
        };
    }

    return {
        matakuliahAktif: courses.map((c) => ({
            id: c._id.toString(),
            kodeMatkul: c.kodeMatkul,
            namaMatkul: c.namaMatkul,
            kelas: c.kelas,
            sks: c.sks,
        })),
        tugasDeadlineDekat,
        summary,
        lastMateri,
    };
};

const trackMaterialAccess = async (idMaterial, user) => {
    if (!mongoose.isValidObjectId(idMaterial)) {
        throw new ApiError(400, 'ID material tidak valid');
    }

    const userId = user.sub;

    const material = await Material.findById(idMaterial).lean();
    if (!material) throw new ApiError(404, 'Material tidak ditemukan');

    await MaterialAccess.findOneAndUpdate(
        { idMahasiswa: userId, idMaterial },
        { idCourse: material.idCourse, accessedAt: new Date() },
        { upsert: true, new: true },
    );
};

module.exports = { getStudentDashboard, trackMaterialAccess };
