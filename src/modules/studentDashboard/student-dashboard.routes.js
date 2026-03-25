const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./student-dashboard.controller');

const router = express.Router();

router.use(auth, requireRoles('MAHASISWA'));

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
router.get('/', controller.getDashboard);

module.exports = router;
