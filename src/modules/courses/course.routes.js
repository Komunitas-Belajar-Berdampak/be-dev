const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./course.controller');

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Manajemen mata kuliah & pertemuan
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Ambil daftar matakuliah
 *     tags: [Courses]
 *     description: |
 *       Menampilkan matakuliah yang sudah di-assign ke user yang sedang login.
 *       - MAHASISWA: matakuliah yang user terdaftar sebagai mahasiswa
 *       - DOSEN: matakuliah yang user adalah pengajar
 *       - SUPER_ADMIN: semua matakuliah
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kodeMatkul
 *         schema: { type: string }
 *         description: Filter berdasarkan kode mata kuliah
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter berdasarkan status (aktif/tidak aktif)
 *       - in: query
 *         name: periode
 *         schema: { type: string }
 *         description: Filter berdasarkan periode akademik
 *       - in: query
 *         name: nrp
 *         schema: { type: string }
 *         description: Filter berdasarkan NRP mahasiswa atau dosen
 *       - in: query
 *         name: kelas
 *         schema: { type: string }
 *         description: Filter berdasarkan kelas
 *       - in: query
 *         name: sks
 *         schema: { type: integer }
 *         description: Filter berdasarkan jumlah SKS
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseSummary'
 */
router.get('/', controller.getCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Ambil detail mata kuliah
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/CourseDetail'
 */
router.get('/:id', controller.getCourseById);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Buat mata kuliah
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kodeMatkul
 *               - namaMatkul
 *               - sks
 *               - status
 *               - idPeriode
 *               - idPengajar
 *               - kelas
 *             properties:
 *               kodeMatkul: { type: string }
 *               namaMatkul: { type: string }
 *               sks: { type: integer }
 *               status: { type: string }
 *               idPeriode: { type: string }
 *               idPengajar: { type: string }
 *               idMahasiswa:
 *                 type: array
 *                 items: { type: string }
 *               kelas: { type: string }
 *     responses:
 *       201:
 *         description: data berhasil dibuat!
 */
router.post(
    '/',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createCourse,
);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update matakuliah
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kodeMatkul: { type: string }
 *               namaMatkul: { type: string }
 *               sks: { type: integer }
 *               status: { type: string }
 *               idPeriode: { type: string }
 *               idPengajar: { type: string }
 *               idMahasiswa:
 *                 type: array
 *                 items: { type: string }
 *               kelas: { type: string }
 *     responses:
 *       200:
 *         description: data berhasil diperbarui!
 */
router.put(
    '/:id',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateCourse,
);

/**
 * @swagger
 * /api/courses/{id}:
 *   patch:
 *     summary: Update deskripsi matakuliah
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deskripsi: { type: object }
 *     responses:
 *       200:
 *         description: deskripsi matakuliah berhasil diupdate!
 */
router.patch(
    '/:id',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.patchDeskripsi,
);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Hapus matakuliah
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: data berhasil dihapus!
 */
router.delete(
    '/:id',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteCourse,
);

module.exports = router;
