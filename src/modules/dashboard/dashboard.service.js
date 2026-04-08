const User = require('../users/user.model');
const Role = require('../roles/roles.model');
const Course = require('../courses/course.model');
const AcademicTerm = require('../academicTerms/academic-term.model');
const Faculty = require('../faculties/faculty.model');

const getDashboardStats = async () => {
    const [
        totalUser,
        totalMatakuliah,
        totalFakultas,
        userStatusAktif,
        userStatusTidakAktif,
        roles,
        periodeAktif,
        userPerRoleAgg,
    ] = await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        Faculty.countDocuments(),
        User.countDocuments({ status: 'aktif' }),
        User.countDocuments({ status: 'tidak aktif' }),
        Role.find().lean(),
        AcademicTerm.findOne({ status: 'aktif' }).lean(),
        User.aggregate([
            { $unwind: '$roleIds' },
            { $group: { _id: '$roleIds', count: { $sum: 1 } } },
        ]),
    ]);

    const roleCountMap = userPerRoleAgg.reduce((acc, r) => {
        acc[r._id.toString()] = r.count;
        return acc;
    }, {});

    const totalUserPerRole = roles.map((role) => ({
        role: role.nama,
        total: roleCountMap[role._id.toString()] || 0,
    }));

    const roleMap = totalUserPerRole.reduce((acc, r) => {
        acc[r.role] = r.total;
        return acc;
    }, {});

    return {
        totalUser,
        totalMahasiswa: roleMap['MAHASISWA'] || 0,
        totalDosen: roleMap['DOSEN'] || 0,
        totalAdmin: roleMap['SUPER_ADMIN'] || 0,
        totalUserPerRole,
        statusUser: {
            aktif: userStatusAktif,
            tidakAktif: userStatusTidakAktif,
        },
        totalMatakuliah,
        periodeAktif: periodeAktif
            ? {
                id: periodeAktif._id.toString(),
                periode: periodeAktif.periode,
                semesterType: periodeAktif.semesterType || null,
                startDate: periodeAktif.startDate || null,
                endDate: periodeAktif.endDate || null,
            }
            : null,
        totalFakultas,
    };
};

module.exports = { getDashboardStats };
