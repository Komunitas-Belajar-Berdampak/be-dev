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

const getStudentGrades = async (targetUserId, user) => {
    let studentId;

    if (user.roles.includes('MAHASISWA')) {
        studentId = user.sub;
    } else if (user.roles.includes('DOSEN') || user.roles.includes('SUPER_ADMIN')) {
        if (!targetUserId) throw new ApiError(400, 'ID mahasiswa diperlukan');
        if (!mongoose.isValidObjectId(targetUserId)) throw new ApiError(400, 'ID mahasiswa tidak valid');
        studentId = targetUserId;
    } else {
        throw new ApiError(403, 'Akses ditolak');
    }

    // 1. Courses student is enrolled in
    const courses = await Course.find({ idMahasiswa: studentId })
        .select('kodeMatkul namaMatkul kelas sks')
        .lean();

    const courseIds = courses.map((c) => c._id);
    const courseMap = {};
    courses.forEach((c) => { courseMap[c._id.toString()] = c; });

    // 2. Meetings for those courses
    const meetings = await Meeting.find({ idCourse: { $in: courseIds } })
        .select('_id idCourse pertemuan')
        .lean();

    const meetingIds = meetings.map((m) => m._id);
    const meetingMap = {};
    meetings.forEach((m) => { meetingMap[m._id.toString()] = m; });

    // 3. Visible assignments
    const assignments = await Assignment.find({
        idMeeting: { $in: meetingIds },
        status: 'VISIBLE',
    })
        .select('_id judul tenggat idMeeting')
        .lean();

    const assignmentIds = assignments.map((a) => a._id);

    // 4. Submissions for this student
    const submissions = await Submission.find({
        idAssignment: { $in: assignmentIds },
        idStudent: studentId,
    })
        .select('idAssignment submittedAt nilai gradedAt')
        .lean();

    const submissionMap = {};
    submissions.forEach((s) => { submissionMap[s.idAssignment.toString()] = s; });

    // 5. Group assignments by course
    const courseAssignmentsMap = {};
    assignments.forEach((a) => {
        const meeting = meetingMap[a.idMeeting.toString()];
        if (!meeting) return;
        const courseId = meeting.idCourse.toString();
        if (!courseAssignmentsMap[courseId]) courseAssignmentsMap[courseId] = [];
        const sub = submissionMap[a._id.toString()];
        courseAssignmentsMap[courseId].push({
            id: a._id.toString(),
            judul: a.judul,
            tenggat: a.tenggat,
            pertemuan: meeting.pertemuan,
            submission: sub
                ? { submitted: true, submittedAt: sub.submittedAt, nilai: sub.nilai ?? null, gradedAt: sub.gradedAt ?? null }
                : { submitted: false, submittedAt: null, nilai: null, gradedAt: null },
        });
    });

    // 6. Build per-course result + global summary
    let totalTugasAll = 0;
    let totalDinilaiAll = 0;
    let totalNilaiAll = 0;
    let countNilaiAll = 0;

    const coursesResult = courses.map((c) => {
        const items = (courseAssignmentsMap[c._id.toString()] || []).sort(
            (a, b) => a.pertemuan - b.pertemuan,
        );

        let totalDinilai = 0;
        let totalNilai = 0;
        let countNilai = 0;

        items.forEach((a) => {
            if (a.submission.nilai !== null) {
                totalDinilai++;
                totalNilai += a.submission.nilai;
                countNilai++;
            }
        });

        totalTugasAll += items.length;
        totalDinilaiAll += totalDinilai;
        totalNilaiAll += totalNilai;
        countNilaiAll += countNilai;

        return {
            id: c._id.toString(),
            kodeMatkul: c.kodeMatkul,
            namaMatkul: c.namaMatkul,
            kelas: c.kelas,
            sks: c.sks,
            summary: {
                totalTugas: items.length,
                totalDinilai,
                totalBelumDinilai: items.length - totalDinilai,
                rataRataNilai: countNilai > 0 ? Math.round((totalNilai / countNilai) * 100) / 100 : null,
            },
            assignments: items,
        };
    });

    return {
        summary: {
            totalTugas: totalTugasAll,
            totalDinilai: totalDinilaiAll,
            totalBelumDinilai: totalTugasAll - totalDinilaiAll,
            rataRataNilai: countNilaiAll > 0 ? Math.round((totalNilaiAll / countNilaiAll) * 100) / 100 : null,
        },
        courses: coursesResult,
    };
};

module.exports = { getStudentDashboard, trackMaterialAccess, getStudentGrades };
