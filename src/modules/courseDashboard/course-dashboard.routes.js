const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./course-dashboard.controller');

const router = express.Router();

router.use(auth, requireRoles('DOSEN', 'SUPER_ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Course Dashboard
 *   description: Dashboard analitik per matakuliah (DOSEN / SUPER_ADMIN)
 */

/**
 * @swagger
 * /api/course-dashboard/{idCourse}:
 *   get:
 *     summary: Dashboard overview seluruh course
 *     tags: [Course Dashboard]
 *     description: Menampilkan statistik keseluruhan matakuliah — progress tugas mahasiswa, kontribusi mingguan, heatmap, donut chart, dan scatter plot keterlambatan.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId matakuliah
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMahasiswa:
 *                       type: integer
 *                     totalPertemuan:
 *                       type: integer
 *                     progressTugas:
 *                       type: array
 *                       description: Progress pengumpulan tugas per mahasiswa
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nama:
 *                             type: string
 *                           selesai:
 *                             type: integer
 *                           total:
 *                             type: integer
 *                     kontribusiMingguan:
 *                       type: array
 *                       description: Jumlah submission per pertemuan
 *                       items:
 *                         type: object
 *                         properties:
 *                           minggu:
 *                             type: integer
 *                           submitted:
 *                             type: integer
 *                           total:
 *                             type: integer
 *                     heatmap:
 *                       type: array
 *                       description: Matriks keaktifan tiap mahasiswa per pertemuan (1=submit, 0=belum)
 *                       items:
 *                         type: object
 *                         properties:
 *                           nama:
 *                             type: string
 *                           data:
 *                             type: array
 *                             items:
 *                               type: integer
 *                               enum: [0, 1]
 *                     donut:
 *                       type: object
 *                       description: Distribusi status pengumpulan seluruh tugas
 *                       properties:
 *                         selesai:
 *                           type: integer
 *                         terlambat:
 *                           type: integer
 *                         belum:
 *                           type: integer
 *                     scatter:
 *                       type: array
 *                       description: Titik scatter — pertemuan vs hari keterlambatan
 *                       items:
 *                         type: object
 *                         properties:
 *                           x:
 *                             type: integer
 *                             description: Nomor pertemuan
 *                           y:
 *                             type: integer
 *                             description: Jumlah hari terlambat (0 = tepat waktu)
 *                           nama:
 *                             type: string
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course tidak ditemukan
 */
router.get('/:idCourse', controller.getCourseDashboard);

/**
 * @swagger
 * /api/course-dashboard/{idCourse}/pertemuan/{pertemuan}:
 *   get:
 *     summary: Dashboard detail per pertemuan
 *     tags: [Course Dashboard]
 *     description: Menampilkan statistik satu pertemuan — donut status, progress mahasiswa, timeline jam submit, dan perbandingan dengan pertemuan sebelumnya.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pertemuan
 *         required: true
 *         schema:
 *           type: integer
 *         description: Nomor pertemuan (1-16)
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     pertemuan:
 *                       type: integer
 *                     totalMahasiswa:
 *                       type: integer
 *                     donut:
 *                       type: object
 *                       properties:
 *                         tepat:
 *                           type: integer
 *                         terlambat:
 *                           type: integer
 *                         belum:
 *                           type: integer
 *                     mahasiswaTugas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nama:
 *                             type: string
 *                           selesai:
 *                             type: integer
 *                           total:
 *                             type: integer
 *                     timeline:
 *                       type: array
 *                       description: Distribusi jam submit (hanya jam yang ada submission-nya + jam kunci)
 *                       items:
 *                         type: object
 *                         properties:
 *                           jam:
 *                             type: string
 *                             example: "14:00"
 *                           jumlah:
 *                             type: integer
 *                     perbandingan:
 *                       type: object
 *                       nullable: true
 *                       description: Perbandingan dengan pertemuan sebelumnya (null jika pertemuan 1)
 *                       properties:
 *                         labels:
 *                           type: array
 *                           items:
 *                             type: string
 *                         sebelumnya:
 *                           type: array
 *                           items:
 *                             type: integer
 *                         sekarang:
 *                           type: array
 *                           items:
 *                             type: integer
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course atau pertemuan tidak ditemukan
 */
router.get('/:idCourse/pertemuan/:pertemuan', controller.getMeetingDashboard);

module.exports = router;
