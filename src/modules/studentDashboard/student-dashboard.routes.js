const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./student-dashboard.controller');

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Student Dashboard
 *   description: Dashboard untuk mahasiswa
 */

/**
 * @swagger
 * /api/student-dashboard:
 *   get:
 *     summary: Ambil data dashboard mahasiswa
 *     tags: [Student Dashboard]
 *     description: |
 *       Menampilkan ringkasan aktivitas dan informasi penting untuk mahasiswa:
 *       matkul aktif, tugas dengan deadline terdekat, summary, dan materi terakhir diakses.
 *       Hanya dapat diakses oleh MAHASISWA.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: data dashboard berhasil diambil!
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
 *                     matakuliahAktif:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           kodeMatkul:
 *                             type: string
 *                           namaMatkul:
 *                             type: string
 *                           kelas:
 *                             type: string
 *                           sks:
 *                             type: integer
 *                     tugasDeadlineDekat:
 *                       type: array
 *                       description: Maks 5 tugas belum dikumpulkan, diurutkan deadline terdekat
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           idMeeting:
 *                             type: string
 *                           idCourse:
 *                             type: string
 *                             nullable: true
 *                           judul:
 *                             type: string
 *                           tenggat:
 *                             type: string
 *                             format: date-time
 *                           sudahLewat:
 *                             type: boolean
 *                           matkul:
 *                             type: string
 *                           pertemuan:
 *                             type: integer
 *                             nullable: true
 *                     summary:
 *                       type: object
 *                       properties:
 *                         jumlahKelas:
 *                           type: integer
 *                         tugasBelumSelesai:
 *                           type: integer
 *                         deadlineTerdekat:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                     lastMateri:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         namaFile:
 *                           type: string
 *                         tipe:
 *                           type: string
 *                         accessedAt:
 *                           type: string
 *                           format: date-time
 *                         matkul:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: string
 *                             namaMatkul:
 *                               type: string
 *                             kodeMatkul:
 *                               type: string
 *                         pertemuan:
 *                           type: integer
 *                           nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (bukan MAHASISWA)
 */
router.get('/', requireRoles('MAHASISWA'), controller.getDashboard);

/**
 * @swagger
 * /api/student-dashboard/grades:
 *   get:
 *     summary: Ambil nilai mahasiswa (login sendiri)
 *     tags: [Student Dashboard]
 *     description: |
 *       Menampilkan nilai mahasiswa yang sedang login, dikelompokkan per matakuliah.
 *       Setiap matakuliah berisi daftar tugas beserta status submission dan nilai.
 *       Hanya dapat diakses oleh MAHASISWA.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: data nilai berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentGradesResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/grades', requireRoles('MAHASISWA'), controller.getGrades);

/**
 * @swagger
 * /api/student-dashboard/grades/{idStudent}:
 *   get:
 *     summary: Ambil nilai mahasiswa tertentu (DOSEN/SUPER_ADMIN)
 *     tags: [Student Dashboard]
 *     description: |
 *       Menampilkan nilai mahasiswa berdasarkan ID, dikelompokkan per matakuliah.
 *       Hanya dapat diakses oleh DOSEN atau SUPER_ADMIN.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idStudent
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId mahasiswa
 *     responses:
 *       200:
 *         description: data nilai berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentGradesResponse'
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/grades/:idStudent', requireRoles('DOSEN', 'SUPER_ADMIN'), controller.getGrades);

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentGradesResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             summary:
 *               type: object
 *               properties:
 *                 totalTugas:
 *                   type: integer
 *                   description: Total tugas visible di semua matakuliah
 *                 totalDinilai:
 *                   type: integer
 *                   description: Total tugas yang sudah diberi nilai
 *                 totalBelumDinilai:
 *                   type: integer
 *                   description: Total tugas belum dinilai (sudah submit tapi nilai null)
 *                 rataRataNilai:
 *                   type: number
 *                   nullable: true
 *                   description: Rata-rata nilai dari semua tugas yang sudah dinilai
 *             courses:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   kodeMatkul:
 *                     type: string
 *                   namaMatkul:
 *                     type: string
 *                   kelas:
 *                     type: string
 *                   sks:
 *                     type: integer
 *                   summary:
 *                     type: object
 *                     properties:
 *                       totalTugas:
 *                         type: integer
 *                       totalDinilai:
 *                         type: integer
 *                       totalBelumDinilai:
 *                         type: integer
 *                       rataRataNilai:
 *                         type: number
 *                         nullable: true
 *                   assignments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         judul:
 *                           type: string
 *                         tenggat:
 *                           type: string
 *                           format: date-time
 *                         pertemuan:
 *                           type: integer
 *                         submission:
 *                           type: object
 *                           properties:
 *                             submitted:
 *                               type: boolean
 *                             submittedAt:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                             nilai:
 *                               type: number
 *                               nullable: true
 *                               minimum: 0
 *                               maximum: 100
 *                             gradedAt:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 */

module.exports = router;
