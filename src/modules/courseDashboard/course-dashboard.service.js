const mongoose = require('mongoose');
const Course = require('../courses/course.model');
const Meeting = require('../meetings/meeting.model');
const Assignment = require('../assignments/assignment.model');
const Submission = require('../submissions/submission.model');
const User = require('../users/user.model');
const { ApiError } = require('../../utils/http');

const getDashboardByCourse = async (idCourse) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const mahasiswaIds = (course.idMahasiswa ?? []).map((id) => id.toString());
    const totalMahasiswa = mahasiswaIds.length;

    const meetings = await Meeting.find({ idCourse }).sort({ pertemuan: 1 }).lean();
    const meetingIds = meetings.map((m) => m._id);
    const totalPertemuan = meetings.length;

    const assignments = await Assignment.find({ idMeeting: { $in: meetingIds } }).lean();
    const assignmentIds = assignments.map((a) => a._id);

    const assignmentByMeeting = meetings.reduce((acc, m) => {
        acc[m._id.toString()] = assignments.filter(
            (a) => a.idMeeting.toString() === m._id.toString()
        );
        return acc;
    }, {});

    const submissions = await Submission.find({
        idAssignment: { $in: assignmentIds },
    }).lean();

    const mahasiswa = await User.find({ _id: { $in: mahasiswaIds } })
        .select('nama nrp')
        .lean();

    const mahasiswaMap = mahasiswa.reduce((acc, m) => {
        acc[m._id.toString()] = m;
        return acc;
    }, {});

    const subByAssignment = submissions.reduce((acc, s) => {
        const key = s.idAssignment.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
    }, {});

    const progressTugas = mahasiswaIds.map((mhsId) => {
        const selesai = assignments.filter((a) =>
            (subByAssignment[a._id.toString()] ?? []).some(
                (s) => s.idStudent?.toString() === mhsId
            )
        ).length;

        return {
            id: mhsId,
            nama: mahasiswaMap[mhsId]?.nama ?? '-',
            selesai,
            total: assignments.length,
        };
    });

    const kontribusiMingguan = meetings.map((m) => {
        const mAssignments = assignmentByMeeting[m._id.toString()] ?? [];
        const mAssignmentIds = mAssignments.map((a) => a._id.toString());

        const submitted = new Set(
            submissions
                .filter((s) => mAssignmentIds.includes(s.idAssignment.toString()))
                .map((s) => s.idStudent?.toString())
                .filter(Boolean)
        ).size;

        return {
            minggu: m.pertemuan,
            submitted,
            total: totalMahasiswa,
        };
    });

    const heatmap = mahasiswaIds.map((mhsId) => {
        const data = meetings.map((m) => {
            const mAssignments = assignmentByMeeting[m._id.toString()] ?? [];
            const mAssignmentIds = mAssignments.map((a) => a._id.toString());
            const didSubmit = submissions.some(
                (s) =>
                    mAssignmentIds.includes(s.idAssignment.toString()) &&
                    s.idStudent?.toString() === mhsId
            );
            return didSubmit ? 1 : 0;
        });

        return {
            nama: mahasiswaMap[mhsId]?.nama ?? '-',
            data,
        };
    });

    let selesaiTepat = 0;
    let selesaiTerlambat = 0;
    let belum = 0;

    for (const a of assignments) {
        const subs = subByAssignment[a._id.toString()] ?? [];
        for (const mhsId of mahasiswaIds) {
            const sub = subs.find((s) => s.idStudent?.toString() === mhsId);
            if (!sub) {
                belum++;
            } else if (a.tenggat && sub.submittedAt > a.tenggat) {
                selesaiTerlambat++;
            } else {
                selesaiTepat++;
            }
        }
    }

    const scatter = submissions.map((s) => {
        const assignment = assignments.find(
            (a) => a._id.toString() === s.idAssignment.toString()
        );
        const meeting = meetings.find(
            (m) => m._id.toString() === assignment?.idMeeting?.toString()
        );
        const hariTerlambat =
            assignment?.tenggat && s.submittedAt > assignment.tenggat
                ? Math.round(
                      (new Date(s.submittedAt) - new Date(assignment.tenggat)) /
                          (1000 * 60 * 60 * 24)
                  )
                : 0;

        return {
            x: meeting?.pertemuan ?? 0,
            y: hariTerlambat,
            nama: mahasiswaMap[s.idStudent?.toString()]?.nama ?? '-',
        };
    });

    return {
        totalMahasiswa,
        totalPertemuan,
        progressTugas,
        kontribusiMingguan,
        heatmap,
        donut: { selesai: selesaiTepat, terlambat: selesaiTerlambat, belum },
        scatter,
    };
};

const getDashboardByMeeting = async (idCourse, pertemuan) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const mahasiswaIds = (course.idMahasiswa ?? []).map((id) => id.toString());
    const totalMahasiswa = mahasiswaIds.length;

    const meeting = await Meeting.findOne({
        idCourse,
        pertemuan: Number(pertemuan),
    }).lean();
    if (!meeting) throw new ApiError(404, 'Pertemuan tidak ditemukan');

    const prevMeeting = await Meeting.findOne({
        idCourse,
        pertemuan: Number(pertemuan) - 1,
    }).lean();

    const mahasiswa = await User.find({ _id: { $in: mahasiswaIds } })
        .select('nama nrp')
        .lean();

    const mahasiswaMap = mahasiswa.reduce((acc, m) => {
        acc[m._id.toString()] = m;
        return acc;
    }, {});

    const getStatsForMeeting = async (mtg) => {
        if (!mtg) return null;

        const assignments = await Assignment.find({ idMeeting: mtg._id }).lean();
        const assignmentIds = assignments.map((a) => a._id);
        const submissions = await Submission.find({
            idAssignment: { $in: assignmentIds },
        }).lean();

        const subByAssignment = submissions.reduce((acc, s) => {
            const key = s.idAssignment.toString();
            if (!acc[key]) acc[key] = [];
            acc[key].push(s);
            return acc;
        }, {});

        let tepat = 0, terlambat = 0, belum = 0;
        const mahasiswaTugas = [];

        for (const mhsId of mahasiswaIds) {
            let mSelesai = 0;
            for (const a of assignments) {
                const subs = subByAssignment[a._id.toString()] ?? [];
                const sub = subs.find((s) => s.idStudent?.toString() === mhsId);
                if (!sub) {
                    belum++;
                } else if (a.tenggat && sub.submittedAt > a.tenggat) {
                    terlambat++;
                    mSelesai++;
                } else {
                    tepat++;
                    mSelesai++;
                }
            }
            mahasiswaTugas.push({
                id: mhsId,
                nama: mahasiswaMap[mhsId]?.nama ?? '-',
                selesai: mSelesai,
                total: assignments.length,
            });
        }

        const timelineMap = {};
        for (const s of submissions) {
            const jam = new Date(s.submittedAt).getHours();
            const key = `${String(jam).padStart(2, '0')}:00`;
            timelineMap[key] = (timelineMap[key] ?? 0) + 1;
        }

        const timeline = Array.from({ length: 24 }, (_, i) => {
            const key = `${String(i).padStart(2, '0')}:00`;
            return { jam: key, jumlah: timelineMap[key] ?? 0 };
        }).filter((t) => t.jumlah > 0 || [8, 12, 16, 20, 22].includes(parseInt(t.jam)));

        return { donut: { tepat, terlambat, belum }, mahasiswaTugas, timeline };
    };

    const [current, prev] = await Promise.all([
        getStatsForMeeting(meeting),
        getStatsForMeeting(prevMeeting),
    ]);

    const perbandingan = prev
        ? {
              labels: ['Selesai Tepat Waktu', 'Selesai Terlambat', 'Belum'],
              sebelumnya: [prev.donut.tepat, prev.donut.terlambat, prev.donut.belum],
              sekarang: [current.donut.tepat, current.donut.terlambat, current.donut.belum],
          }
        : null;

    return {
        pertemuan: meeting.pertemuan,
        totalMahasiswa,
        donut: current.donut,
        mahasiswaTugas: current.mahasiswaTugas,
        timeline: current.timeline,
        perbandingan,
    };
};

module.exports = { getDashboardByCourse, getDashboardByMeeting };