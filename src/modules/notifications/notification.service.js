const mongoose = require('mongoose');
const Notification = require('./notification.model');
const Assignment = require('../assignments/assignment.model');
const Meeting = require('../meetings/meeting.model');
const Course = require('../courses/course.model');
const Submission = require('../submissions/submission.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');
const { logger } = require('../../libs/logger');

// ─── Internal helpers ────────────────────────────────────────────────────────

const formatSisaWaktu = (ms) => {
    if (ms <= 0) return null;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours} jam ${minutes} menit`;
    return `${minutes} menit`;
};

const enrichNotifications = async (notifications, userId) => {
    if (!notifications.length) return [];

    const courseIds = [...new Set(
        notifications.filter((n) => n.idCourse).map((n) => n.idCourse.toString()),
    )];
    const assignmentIds = [...new Set(
        notifications.filter((n) => n.idAssignment).map((n) => n.idAssignment.toString()),
    )];

    const [courses, assignments] = await Promise.all([
        courseIds.length
            ? Course.find({ _id: { $in: courseIds } }).select('kodeMatkul namaMatkul').lean()
            : [],
        assignmentIds.length
            ? Assignment.find({ _id: { $in: assignmentIds } }).select('judul tenggat idMeeting').lean()
            : [],
    ]);

    const courseMap = courses.reduce((acc, c) => {
        acc[c._id.toString()] = c;
        return acc;
    }, {});

    const meetingIds = [...new Set(
        assignments.filter((a) => a.idMeeting).map((a) => a.idMeeting.toString()),
    )];
    const meetings = meetingIds.length
        ? await Meeting.find({ _id: { $in: meetingIds } }).select('pertemuan').lean()
        : [];
    const meetingMap = meetings.reduce((acc, m) => {
        acc[m._id.toString()] = m.pertemuan;
        return acc;
    }, {});

    const assignmentMap = assignments.reduce((acc, a) => {
        acc[a._id.toString()] = {
            id: a._id.toString(),
            judul: a.judul,
            tenggat: a.tenggat,
            pertemuan: a.idMeeting ? (meetingMap[a.idMeeting.toString()] ?? null) : null,
        };
        return acc;
    }, {});

    // Fetch submittedAt untuk LATE_SUBMISSION
    const lateAssignmentIds = notifications
        .filter((n) => n.tipe === 'LATE_SUBMISSION' && n.idAssignment)
        .map((n) => n.idAssignment);

    const submissionMap = {};
    if (lateAssignmentIds.length) {
        const subs = await Submission.find({
            idAssignment: { $in: lateAssignmentIds },
            idStudent: userId,
        }).select('idAssignment submittedAt').lean();
        subs.forEach((s) => {
            submissionMap[s.idAssignment.toString()] = s.submittedAt;
        });
    }

    const now = new Date();

    return notifications.map((n) => {
        const cid = n.idCourse?.toString();
        const aid = n.idAssignment?.toString();
        const course = cid ? courseMap[cid] : null;
        const assignment = aid ? assignmentMap[aid] : null;

        let sisaWaktu = null;
        if (n.tipe === 'DEADLINE_SOON' && assignment?.tenggat) {
            sisaWaktu = formatSisaWaktu(new Date(assignment.tenggat) - now);
        }

        const submittedAt = n.tipe === 'LATE_SUBMISSION' && aid
            ? (submissionMap[aid] ?? null)
            : null;

        return {
            id: n._id.toString(),
            tipe: n.tipe,
            judul: n.judul,
            pesan: n.pesan,
            isRead: n.isRead,
            createdAt: n.createdAt,
            readAt: n.readAt ?? null,
            course: course
                ? { id: course._id.toString(), kodeMatkul: course.kodeMatkul, namaMatkul: course.namaMatkul }
                : null,
            assignment: assignment ?? null,
            sisaWaktu,
            submittedAt,
            link: n.link ?? null,
        };
    });
};

// ─── Public helpers (dipanggil dari service lain) ─────────────────────────────

const notifyMany = async (idMahasiswaArr, { tipe, judul, pesan, idCourse, idAssignment, link }) => {
    try {
        const ids = Array.isArray(idMahasiswaArr) ? idMahasiswaArr : [idMahasiswaArr];
        if (!ids.length) return;

        let targets = ids;

        // Deduplication untuk tipe yang hanya boleh sekali per mahasiswa per assignment
        if ((tipe === 'DEADLINE_SOON' || tipe === 'LATE_SUBMISSION') && idAssignment) {
            const existing = await Notification.find({
                tipe,
                idAssignment,
                idUser: { $in: ids },
            }).select('idUser').lean();
            const existingSet = new Set(existing.map((n) => n.idUser.toString()));
            targets = ids.filter((id) => !existingSet.has(id.toString()));
        }

        if (!targets.length) return;

        const docs = targets.map((idUser) => ({
            idUser,
            tipe,
            judul,
            pesan,
            idCourse: idCourse ?? null,
            idAssignment: idAssignment ?? null,
            link: link ?? null,
        }));

        await Notification.insertMany(docs, { ordered: false });
    } catch (err) {
        logger.error({ err }, 'notifyMany failed silently');
    }
};

// ─── CRUD service functions ───────────────────────────────────────────────────

const listNotifications = async (userId, queryParams) => {
    const { page, limit, skip } = parsePagination(queryParams);

    const filter = { idUser: userId };
    if (queryParams.tipe) filter.tipe = queryParams.tipe;
    if (queryParams.isRead !== undefined) {
        filter.isRead = queryParams.isRead === 'true';
    }
    if (queryParams.idCourse && mongoose.isValidObjectId(queryParams.idCourse)) {
        filter.idCourse = queryParams.idCourse;
    }

    const [totalItems, totalUnread, notifications] = await Promise.all([
        Notification.countDocuments(filter),
        Notification.countDocuments({ idUser: userId, isRead: false }),
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const items = await enrichNotifications(notifications, userId);

    return {
        totalUnread,
        items,
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getUnreadCount = async (userId) => {
    const totalUnread = await Notification.countDocuments({ idUser: userId, isRead: false });
    return { totalUnread };
};

const getNotificationById = async (id, userId) => {
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'ID tidak valid');

    const notif = await Notification.findOne({ _id: id, idUser: userId }).lean();
    if (!notif) throw new ApiError(404, 'Notifikasi tidak ditemukan');

    const [enriched] = await enrichNotifications([notif], userId);
    return enriched;
};

const markRead = async (id, userId) => {
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'ID tidak valid');

    const notif = await Notification.findOne({ _id: id, idUser: userId });
    if (!notif) throw new ApiError(404, 'Notifikasi tidak ditemukan');

    if (!notif.isRead) {
        notif.isRead = true;
        notif.readAt = new Date();
        await notif.save();
    }

    return { id: notif._id.toString(), isRead: true, readAt: notif.readAt };
};

const markAllRead = async (userId) => {
    const result = await Notification.updateMany(
        { idUser: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
    );
    return { totalUpdated: result.modifiedCount };
};

const deleteNotification = async (id, userId) => {
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'ID tidak valid');

    const deleted = await Notification.findOneAndDelete({ _id: id, idUser: userId });
    if (!deleted) throw new ApiError(404, 'Notifikasi tidak ditemukan');
};

// ─── Scheduler ───────────────────────────────────────────────────────────────

const checkDeadlineSoon = async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const assignments = await Assignment.find({
        tenggat: { $gte: windowStart, $lte: windowEnd },
        status: 'VISIBLE',
    }).lean();

    for (const assignment of assignments) {
        const meeting = await Meeting.findById(assignment.idMeeting).select('idCourse pertemuan').lean();
        if (!meeting) continue;

        const course = await Course.findById(meeting.idCourse)
            .select('idMahasiswa kodeMatkul namaMatkul')
            .lean();
        if (!course?.idMahasiswa?.length) continue;

        const mahasiswaIds = course.idMahasiswa;

        const submissions = await Submission.find({
            idAssignment: assignment._id,
            idStudent: { $in: mahasiswaIds },
        }).select('idStudent').lean();
        const submittedSet = new Set(submissions.map((s) => s.idStudent.toString()));

        const targets = mahasiswaIds.filter((id) => !submittedSet.has(id.toString()));
        if (!targets.length) continue;

        const diff = new Date(assignment.tenggat) - now;
        const sisaStr = formatSisaWaktu(diff) ?? 'sebentar lagi';

        await notifyMany(targets, {
            tipe: 'DEADLINE_SOON',
            judul: 'Deadline tugas mendekat!',
            pesan: `Tugas "${assignment.judul}" pada ${course.namaMatkul} akan berakhir ${sisaStr}. Segera kumpulkan!`,
            idCourse: meeting.idCourse,
            idAssignment: assignment._id,
            link: `/courses/${meeting.idCourse}/assignments/${assignment._id}`,
        });
    }
};

const checkLateSubmissions = async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    const assignments = await Assignment.find({
        tenggat: { $gte: windowStart, $lte: now },
        status: 'VISIBLE',
    }).lean();

    for (const assignment of assignments) {
        const meeting = await Meeting.findById(assignment.idMeeting).select('idCourse').lean();
        if (!meeting) continue;

        const course = await Course.findById(meeting.idCourse)
            .select('idMahasiswa kodeMatkul namaMatkul')
            .lean();
        if (!course?.idMahasiswa?.length) continue;

        const mahasiswaIds = course.idMahasiswa;

        const submissions = await Submission.find({
            idAssignment: assignment._id,
            idStudent: { $in: mahasiswaIds },
        }).select('idStudent').lean();
        const submittedSet = new Set(submissions.map((s) => s.idStudent.toString()));

        const targets = mahasiswaIds.filter((id) => !submittedSet.has(id.toString()));
        if (!targets.length) continue;

        await notifyMany(targets, {
            tipe: 'LATE_SUBMISSION',
            judul: 'Tugas tidak dikumpulkan',
            pesan: `Kamu tidak mengumpulkan tugas "${assignment.judul}" pada ${course.namaMatkul} sebelum deadline.`,
            idCourse: meeting.idCourse,
            idAssignment: assignment._id,
            link: `/courses/${meeting.idCourse}/assignments/${assignment._id}`,
        });
    }
};

const startNotificationScheduler = () => {
    const run = async () => {
        try {
            await checkDeadlineSoon();
            await checkLateSubmissions();
        } catch (err) {
            logger.error({ err }, 'Notification scheduler error');
        }
    };

    run();
    setInterval(run, 60 * 60 * 1000);
};

module.exports = {
    notifyMany,
    listNotifications,
    getUnreadCount,
    getNotificationById,
    markRead,
    markAllRead,
    deleteNotification,
    startNotificationScheduler,
};
