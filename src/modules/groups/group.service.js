const mongoose = require('mongoose');
const StudyGroup = require('./group.model');
const GroupMember = require('./group-member.model');
const Course = require('../courses/course.model');
const User = require('../users/user.model');
const GroupThread = require('./group-thread.model');
const GroupPost = require('./group-post.model');
const ContributionThread = require('./contribution-thread.model');
const ActivityLog = require('./activity-log.model');
const ContributionReview = require('../contributionReviews/contribution-review.model');
const Meeting = require('../meetings/meeting.model');
const Assignment = require('../assignments/assignment.model');
const { ApiError } = require('../../utils/http');
const { parsePagination, buildPagination } = require('../../utils/pagination');

const POINT_PER_POST = 10;

const listGroupsByCourse = async (idCourse, queryParams) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const { page, limit, skip } = parsePagination(queryParams);

    const filter = { idCourse };
    const totalItems = await StudyGroup.countDocuments(filter);

    const groups = await StudyGroup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const groupIds = groups.map((g) => g._id);

    const members = await GroupMember.aggregate([
        { $match: { idGroup: { $in: groupIds } } },
        {
        $group: {
            _id: '$idGroup',
            totalAnggota: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
            totalRequest: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
        },
        },
    ]);

    const memberMap = members.reduce((acc, m) => {
        acc[m._id.toString()] = {
            totalAnggota: m.totalAnggota,
            totalRequest: m.totalRequest,
        };
        return acc;
    }, {});

    const pendingReviews = await ContributionReview.aggregate([
        { $match: { idStudyGroup: { $in: groupIds }, status: 'PENDING' } },
        { $group: { _id: '$idStudyGroup', totalReview: { $sum: 1 } } },
    ]);

    const reviewMap = pendingReviews.reduce((acc, r) => {
        acc[r._id.toString()] = r.totalReview;
        return acc;
    }, {});

    return {
        items: groups.map((g) => ({
        id: g._id.toString(),
        nama: g.nama,
        kapasitas: g.kapasitas,
        totalAnggota: memberMap[g._id.toString()]?.totalAnggota || 0,
        status: g.status,
        totalRequest: memberMap[g._id.toString()]?.totalRequest || 0,
        totalKontribusi: g.totalKontribusi || 0,
        totalReview: reviewMap[g._id.toString()] || 0,
        })),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const listGroupsWithMembershipStatus = async (idCourse, userId, queryParams) => {
    if (!mongoose.isValidObjectId(idCourse)) throw new ApiError(400, 'ID course tidak valid');
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, 'ID user tidak valid');

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const { page, limit, skip } = parsePagination(queryParams);

    const filter = { idCourse };
    const totalItems = await StudyGroup.countDocuments(filter);

    const groups = await StudyGroup.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const groupIds = groups.map((g) => g._id);

    // Get total members per group
    const members = await GroupMember.aggregate([
        { $match: { idGroup: { $in: groupIds } } },
        {
        $group: {
            _id: '$idGroup',
            totalAnggota: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
        },
        },
    ]);

    const memberMap = members.reduce((acc, m) => {
        acc[m._id.toString()] = {
            totalAnggota: m.totalAnggota,
        };
        return acc;
    }, {});

    // Get user's membership status in each group
    const userMemberships = await GroupMember.find({
        idGroup: { $in: groupIds },
        idMahasiswa: userId,
    }).lean();

    const userMembershipMap = userMemberships.reduce((acc, m) => {
        acc[m.idGroup.toString()] = {
            status: m.status,
            kontribusi: m.kontribusi || 0,
        };
        return acc;
    }, {});

    return {
        items: groups.map((g) => {
            const groupId = g._id.toString();
            const userMembership = userMembershipMap[groupId];

            return {
                id: groupId,
                nama: g.nama,
                deskripsi: g.deskripsi || null,
                kapasitas: g.kapasitas,
                totalAnggota: memberMap[groupId]?.totalAnggota || 0,
                status: g.status,
                statusMember: userMembership ? userMembership.status : null,
                totalKontribusi: g.totalKontribusi || 0,
            };
        }),
        pagination: buildPagination({ page, limit, totalItems }),
    };
};

const getGroupDetail = async (idGroup) => {
    if (!mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idGroup).lean();

    if (!group) {
        throw new ApiError(404, 'Kelompok tidak ditemukan');
    }

    const members = await GroupMember.find({
        idGroup,
        status: 'APPROVED',
    })
        .populate('idMahasiswa', 'nrp nama')
        .lean();

    return {
        id: group._id.toString(),
        nama: group.nama,
        deskripsi: group.deskripsi || null,
        kapasitas: group.kapasitas,
        anggota: members.map((m) => ({
        id: m.idMahasiswa._id.toString(),
        nrp: m.idMahasiswa.nrp,
        nama: m.idMahasiswa.nama,
        totalKontribusi: m.kontribusi || 0,
        })),
        status: group.status,
        totalKontribusi: group.totalKontribusi || 0,
    };
};

const getUserDetailInGroup = async (idGroup, idUser) => {
    if (
        !mongoose.isValidObjectId(idGroup) ||
        !mongoose.isValidObjectId(idUser)
    ) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idGroup).lean();
    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const mahasiswa = await User.findById(idUser).lean();
    if (!mahasiswa) throw new ApiError(404, 'Mahasiswa tidak ditemukan');

    const member = await GroupMember.findOne({
        idGroup,
        idMahasiswa: idUser,
    }).lean();

    const threads = await GroupThread.find({ idGroup }).lean();
    const threadIds = threads.map((t) => t._id);
    const threadMap = threads.reduce((acc, t) => {
        acc[t._id.toString()] = t.judul;
        return acc;
    }, {});

    let kontribusiList = [];
    if (threadIds.length > 0) {
        // Use ContributionThread for faster lookup instead of aggregation
        const contributions = await ContributionThread.find({
            idThread: { $in: threadIds },
            idMahasiswa: idUser,
        }).lean();

        kontribusiList = contributions.map((contrib) => {
            const threadId = contrib.idThread.toString();
            const judulThread = threadMap[threadId] || '(thread tidak ditemukan)';

            return {
                thread: judulThread,
                kontribusi: contrib.kontribusi,
            };
        });
    }

    const reviews = await ContributionReview.find({
        idStudyGroup: idGroup,
        idStudent: idUser,
    })
        .populate('idThread', 'judul')
        .sort({ createdAt: 1 })
        .lean();

    const reviewActivityList = reviews.map((r) => {
        const judulThread = r.idThread?.judul || null;
        return {
            thread: judulThread,
            aktivitas: judulThread
                ? `Posting di thread: ${judulThread}`
                : 'Posting di thread',
            status: r.status,
            kontribusi:
                r.status === 'REVIEWED' && typeof r.finalPoints === 'number'
                    ? r.finalPoints
                    : 0,
            catatan: r.lecturerNote ?? null,
            timestamp: r.createdAt,
        };
    });

    const activityLogs = threadIds.length > 0
        ? await ActivityLog.find({
              idUser,
              idContribusionThread: { $in: threadIds },
          })
              .populate('idContribusionThread', 'judul')
              .sort({ createdAt: 1 })
              .lean()
        : [];

    // Skip post-create logs because they're already represented by ContributionReview entries (which carry status/lecturerNote/finalPoints)
    const logActivityList = activityLogs
        .filter((log) => !log.aktivitas.startsWith('Menambahkan post'))
        .map((log) => ({
            thread: log.idContribusionThread?.judul || null,
            aktivitas: log.aktivitas,
            status: null,
            kontribusi: log.kontribusi || 0,
            catatan: null,
            timestamp: log.createdAt,
        }));

    const aktivitasList = [...logActivityList, ...reviewActivityList].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    );

    return {
        id: group._id.toString(),
        totalKontribusi: member?.kontribusi || 0,
        mahasiswa: {
        id: mahasiswa._id.toString(),
        nrp: mahasiswa.nrp,
        nama: mahasiswa.nama,
        },
        kontribusiTotalByThread: kontribusiList,
        aktivitas: aktivitasList,
    };
};

const createGroup = async (idCourse, payload) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const { nama, deskripsi, idMahasiswa, status, kapasitas } = payload;

    const group = await StudyGroup.create({
        idCourse,
        nama: nama || 'Kelompok',
        deskripsi,
        status: status ?? false,
        kapasitas,
    });

    if (Array.isArray(idMahasiswa) && idMahasiswa.length > 0) {
        const uniqueIds = [...new Set(idMahasiswa)].filter((x) =>
        mongoose.isValidObjectId(x),
        );

        if (uniqueIds.length > 0) {
        // Validation 1: Check capacity
        if (uniqueIds.length > kapasitas) {
            throw new ApiError(400, `Jumlah anggota (${uniqueIds.length}) melebihi kapasitas kelompok (${kapasitas})`);
        }

        // Verify all student IDs exist
        const existingUsers = await User.find({
            _id: { $in: uniqueIds },
        }).select('_id');

        const existingUserIds = existingUsers.map(u => u._id.toString());
        const invalidIds = uniqueIds.filter(id => !existingUserIds.includes(id));

        if (invalidIds.length > 0) {
            throw new ApiError(400, `ID mahasiswa tidak valid: ${invalidIds.join(', ')}`);
        }

        // Validation 2: Check if any student is already in another group in this course
        const groupsInCourse = await StudyGroup.find({ idCourse }).select('_id').lean();
        const groupIdsInCourse = groupsInCourse.map(g => g._id);

        const existingMemberships = await GroupMember.find({
            idGroup: { $in: groupIdsInCourse },
            idMahasiswa: { $in: uniqueIds },
            status: 'APPROVED',
        }).populate('idMahasiswa', 'nama nrp').lean();

        if (existingMemberships.length > 0) {
            const conflictNames = existingMemberships.map(m =>
                `${m.idMahasiswa.nama} (${m.idMahasiswa.nrp})`
            ).join(', ');
            throw new ApiError(400, `Mahasiswa berikut sudah terdaftar di kelompok lain dalam mata kuliah ini: ${conflictNames}`);
        }

        // Issue 3: Auto-approve when lecturer adds members
        const docs = uniqueIds.map((idMhs) => ({
            idGroup: group._id,
            idMahasiswa: idMhs,
            status: 'APPROVED',
            kontribusi: 0,
        }));

        await GroupMember.insertMany(docs, { ordered: false });
        }
    }

    return {
        id: group._id.toString(),
        nama: group.nama,
        deskripsi: group.deskripsi || null,
        kapasitas: group.kapasitas,
        anggota: [],
        status: group.status,
        totalKontribusi: group.totalKontribusi || 0,
    };
};

const updateGroup = async (idGroup, payload) => {
    if (!mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const group = await StudyGroup.findById(idGroup);

    if (!group) throw new ApiError(404, 'Kelompok tidak ditemukan');

    const { nama, deskripsi, idMahasiswa, status, kapasitas } = payload;

    if (nama !== undefined) group.nama = nama;
    if (deskripsi !== undefined) group.deskripsi = deskripsi;
    if (typeof status === 'boolean') group.status = status;
    if (kapasitas !== undefined) group.kapasitas = kapasitas;

    if (Array.isArray(idMahasiswa)) {
        const uniqueIds = [...new Set(idMahasiswa)].filter((x) =>
        mongoose.isValidObjectId(x),
        );

        // Validation 1: Check capacity
        const finalKapasitas = kapasitas !== undefined ? kapasitas : group.kapasitas;
        if (uniqueIds.length > finalKapasitas) {
            throw new ApiError(400, `Jumlah anggota (${uniqueIds.length}) melebihi kapasitas kelompok (${finalKapasitas})`);
        }

        if (uniqueIds.length > 0) {
        // Verify all student IDs exist
        const existingUsers = await User.find({
            _id: { $in: uniqueIds },
        }).select('_id');

        const existingUserIds = existingUsers.map(u => u._id.toString());
        const invalidIds = uniqueIds.filter(id => !existingUserIds.includes(id));

        if (invalidIds.length > 0) {
            throw new ApiError(400, `ID mahasiswa tidak valid: ${invalidIds.join(', ')}`);
        }

        // Validation 2: Check if any student is already in another group in this course (excluding current group)
        const groupsInCourse = await StudyGroup.find({
            idCourse: group.idCourse,
            _id: { $ne: idGroup }  // Exclude current group
        }).select('_id').lean();
        const groupIdsInCourse = groupsInCourse.map(g => g._id);

        if (groupIdsInCourse.length > 0) {
            const existingMemberships = await GroupMember.find({
                idGroup: { $in: groupIdsInCourse },
                idMahasiswa: { $in: uniqueIds },
                status: 'APPROVED',
            }).populate('idMahasiswa', 'nama nrp').lean();

            if (existingMemberships.length > 0) {
                const conflictNames = existingMemberships.map(m =>
                    `${m.idMahasiswa.nama} (${m.idMahasiswa.nrp})`
                ).join(', ');
                throw new ApiError(400, `Mahasiswa berikut sudah terdaftar di kelompok lain dalam mata kuliah ini: ${conflictNames}`);
            }
        }
        }

        // Diff-based update so existing members keep their kontribusi
        const currentApproved = await GroupMember.find({
            idGroup,
            status: 'APPROVED',
        }).select('idMahasiswa').lean();

        const currentIds = currentApproved.map((m) => m.idMahasiswa.toString());
        const newIdsSet = new Set(uniqueIds);
        const currentIdsSet = new Set(currentIds);

        const toRemove = currentIds.filter((id) => !newIdsSet.has(id));
        const toAdd = uniqueIds.filter((id) => !currentIdsSet.has(id));

        if (toRemove.length > 0) {
            await GroupMember.deleteMany({
                idGroup,
                status: 'APPROVED',
                idMahasiswa: { $in: toRemove },
            });
        }

        if (toAdd.length > 0) {
            // Drop any PENDING/REJECTED records for new members so dosen can re-add previously rejected students
            await GroupMember.deleteMany({
                idGroup,
                idMahasiswa: { $in: toAdd },
            });

            const docs = toAdd.map((idMhs) => ({
                idGroup,
                idMahasiswa: idMhs,
                status: 'APPROVED',
                kontribusi: 0,
            }));

            await GroupMember.insertMany(docs, { ordered: false });
        }
    }

    await group.save();
};

const deleteGroup = async (idGroup) => {
    if (!mongoose.isValidObjectId(idGroup)) {
        throw new ApiError(400, 'ID tidak valid');
    }

    const deleted = await StudyGroup.findByIdAndDelete(idGroup);

    if (!deleted) throw new ApiError(404, 'Kelompok tidak ditemukan');

    await GroupMember.deleteMany({ idGroup });
};

const getAssignmentDashboard = async (idCourse) => {
    if (!mongoose.isValidObjectId(idCourse)) {
        throw new ApiError(400, 'ID course tidak valid');
    }

    const course = await Course.findById(idCourse).lean();
    if (!course) throw new ApiError(404, 'Course tidak ditemukan');

    const meetings = await Meeting.find({ idCourse })
        .select('_id pertemuan')
        .lean();
    const meetingPertemuanMap = meetings.reduce((acc, m) => {
        acc[m._id.toString()] = m.pertemuan;
        return acc;
    }, {});
    const meetingIds = meetings.map((m) => m._id);

    const assignments = meetingIds.length
        ? await Assignment.find({ idMeeting: { $in: meetingIds } })
              .select('_id judul idMeeting tenggat createdAt')
              .sort({ tenggat: 1, createdAt: 1 })
              .lean()
        : [];

    const assignmentList = assignments.map((a) => ({
        id: a._id.toString(),
        pertemuan: meetingPertemuanMap[a.idMeeting.toString()] || 0,
        judul: a.judul,
    }));

    const groups = await StudyGroup.find({ idCourse }).select('_id nama').lean();
    const groupList = groups.map((g) => ({
        id: g._id.toString(),
        nama: g.nama,
    }));
    const groupIds = groups.map((g) => g._id);
    const groupNameMap = groups.reduce((acc, g) => {
        acc[g._id.toString()] = g.nama;
        return acc;
    }, {});

    const members = groupIds.length
        ? await GroupMember.find({
              idGroup: { $in: groupIds },
              status: 'APPROVED',
          })
              .populate('idMahasiswa', 'nrp nama')
              .lean()
        : [];

    const studentList = members
        .filter((m) => m.idMahasiswa)
        .map((m) => ({
            id: m.idMahasiswa._id.toString(),
            nrp: m.idMahasiswa.nrp,
            nama: m.idMahasiswa.nama,
            groupId: m.idGroup.toString(),
            groupName: groupNameMap[m.idGroup.toString()] || '',
        }));

    const studentNameMap = studentList.reduce((acc, s) => {
        acc[s.id] = s.nama;
        return acc;
    }, {});

    const reviewedAggregation =
        groupIds.length && assignmentList.length
            ? await ContributionReview.aggregate([
                  {
                      $match: {
                          idStudyGroup: { $in: groupIds },
                          status: 'REVIEWED',
                          idAssignment: { $ne: null },
                      },
                  },
                  {
                      $group: {
                          _id: {
                              studentId: '$idStudent',
                              assignmentId: '$idAssignment',
                          },
                          points: { $sum: '$finalPoints' },
                      },
                  },
              ])
            : [];

    const pointsMap = {};
    for (const row of reviewedAggregation) {
        const studentKey = row._id.studentId.toString();
        const assignmentKey = row._id.assignmentId.toString();
        if (!pointsMap[studentKey]) pointsMap[studentKey] = {};
        pointsMap[studentKey][assignmentKey] = row.points || 0;
    }

    const matrix = [];
    for (const student of studentList) {
        for (const assignment of assignmentList) {
            const points = pointsMap[student.id]?.[assignment.id] || 0;
            matrix.push({
                studentId: student.id,
                assignmentId: assignment.id,
                points,
            });
        }
    }

    const weights = [];
    if (assignmentList.length > 0) {
        const baseWeight = Math.floor(100 / assignmentList.length);
        const remainder = 100 - baseWeight * assignmentList.length;
        assignmentList.forEach((a, idx) => {
            weights.push({
                assignmentId: a.id,
                weight: baseWeight + (idx === 0 ? remainder : 0),
            });
        });
    }

    const totalKontribusi = matrix.reduce((sum, m) => sum + m.points, 0);

    const studentTotalMap = {};
    for (const m of matrix) {
        studentTotalMap[m.studentId] =
            (studentTotalMap[m.studentId] || 0) + m.points;
    }

    let topContributor = null;
    for (const s of studentList) {
        const total = studentTotalMap[s.id] || 0;
        if (total > 0 && (!topContributor || total > topContributor.totalPoints)) {
            topContributor = {
                studentId: s.id,
                nama: s.nama,
                totalPoints: total,
            };
        }
    }

    let assignmentPalingTimpang = null;
    for (const a of assignmentList) {
        const rowsForAssignment = matrix.filter(
            (m) => m.assignmentId === a.id,
        );
        const totalForAssignment = rowsForAssignment.reduce(
            (sum, m) => sum + m.points,
            0,
        );
        if (totalForAssignment <= 0) continue;

        let topStudentId = null;
        let topStudentPoints = 0;
        for (const r of rowsForAssignment) {
            if (r.points > topStudentPoints) {
                topStudentPoints = r.points;
                topStudentId = r.studentId;
            }
        }
        const dominance = (topStudentPoints / totalForAssignment) * 100;
        const dominanceRounded = Math.round(dominance * 100) / 100;
        if (
            !assignmentPalingTimpang ||
            dominanceRounded > assignmentPalingTimpang.dominancePercentage
        ) {
            assignmentPalingTimpang = {
                assignmentId: a.id,
                judul: a.judul,
                studentName: studentNameMap[topStudentId] || '',
                dominancePercentage: dominanceRounded,
            };
        }
    }

    let inactiveStudents = 0;
    for (const s of studentList) {
        if ((studentTotalMap[s.id] || 0) === 0) inactiveStudents++;
    }

    return {
        courseId: course._id.toString(),
        assignments: assignmentList,
        groups: groupList,
        students: studentList,
        matrix,
        weights,
        summary: {
            totalKontribusi,
            topContributor,
            assignmentPalingTimpang,
            inactiveStudents,
        },
    };
};

const getThreadLatestUpdate = async (idThread) => {
    if (!mongoose.isValidObjectId(idThread)) {
        throw new ApiError(400, 'ID thread tidak valid');
    }

    const thread = await GroupThread.findById(idThread).lean();
    if (!thread) throw new ApiError(404, 'Thread tidak ditemukan');

    const [latestPost, totalPosts] = await Promise.all([
        GroupPost.findOne({ idThread })
            .sort({ updatedAt: -1 })
            .select('updatedAt')
            .lean(),
        GroupPost.countDocuments({ idThread }),
    ]);

    return {
        latestUpdatedAt: latestPost?.updatedAt || null,
        totalPosts,
    };
};

module.exports = {
    listGroupsByCourse,
    listGroupsWithMembershipStatus,
    getGroupDetail,
    getUserDetailInGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    getAssignmentDashboard,
    getThreadLatestUpdate,
};
