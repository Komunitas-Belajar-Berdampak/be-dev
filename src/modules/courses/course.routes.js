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
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kodeMatkul
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: periode
 *         schema: { type: string }
 *       - in: query
 *         name: pengajar
 *         schema: { type: string }
 *       - in: query
 *         name: kelas
 *         schema: { type: string }
 *       - in: query
 *         name: sks
 *         schema: { type: integer }
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

/**
 * @swagger
 * /api/courses/{idCourse}/meetings:
 *   get:
 *     summary: Ambil daftar pertemuan untuk 1 matakuliah
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meeting'
 */
router.get('/:idCourse/meetings', controller.getMeetings);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}:
 *   get:
 *     summary: Ambil detail pertemuan tertentu
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: pertemuan
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/:idCourse/meetings/:pertemuan',
    controller.getMeetingDetail,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}:
 *   put:
 *     summary: Update judul & deskripsi pertemuan
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: pertemuan
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul: { type: string }
 *               deskripsi: { type: object }
 *     responses:
 *       200:
 *         description: pertemuan ke-x berhasil diubah!
 */
router.put(
    '/:idCourse/meetings/:pertemuan',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.putMeeting,
);

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: Materi per pertemuan
 */

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/materials:
 *   get:
 *     summary: Ambil semua materi (per course)
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */

router.get(
    '/:idCourse/meetings/materials',
    controller.getAllMaterialsByCourse,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/materials:
 *   get:
 *     summary: Ambil materi per pertemuan
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: pertemuan
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/:idCourse/meetings/:pertemuan/materials',
    controller.getMaterialsByMeeting,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/materials/{idMaterial}:
 *   get:
 *     summary: Ambil detail 1 materi
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *       - in: path
 *         name: pertemuan
 *         required: true
 *       - in: path
 *         name: idMaterial
 *         required: true
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/:idCourse/meetings/:pertemuan/materials/:idMaterial',
    controller.getMaterialDetail,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/materials:
 *   post:
 *     summary: Tambah materi pertemuan
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *       - in: path
 *         name: pertemuan
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [namaFile, tipe, pathFile]
 *             properties:
 *               namaFile: { type: string }
 *               tipe: { type: string }
 *               pathFile: { type: string }
 *               visibility:
 *                 type: string
 *                 example: HIDE
 *               deskripsi:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       201:
 *         description: materi berhasil dibuat!
 */
router.post(
    '/:idCourse/meetings/:pertemuan/materials',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createMaterial,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/materials/{idMaterial}:
 *   put:
 *     summary: Update materi
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: pertemuan
 *       - in: path
 *         name: idMaterial
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               namaFile: { type: string }
 *               tipe: { type: string }
 *               pathFile: { type: string }
 *               visibility: { type: string }
 *               deskripsi: { type: object }
 *     responses:
 *       200:
 *         description: materi berhasil diubah!
 */
router.put(
    '/:idCourse/meetings/:pertemuan/materials/:idMaterial',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateMaterial,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/materials/{idMaterial}:
 *   delete:
 *     summary: Hapus materi
 *     tags: [Materials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: pertemuan
 *       - in: path
 *         name: idMaterial
 *     responses:
 *       200:
 *         description: materi berhasil dihapus!
 */
router.delete(
    '/:idCourse/meetings/:pertemuan/materials/:idMaterial',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteMaterial,
);

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Tugas per pertemuan
 */

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/assignments:
 *   get:
 *     summary: Ambil semua assignment dalam 1 course
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/:idCourse/meetings/assignments',
    controller.getAssignmentsByCourse,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/assignments:
 *   get:
 *     summary: Ambil assignment di pertemuan tertentu
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: pertemuan
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/:idCourse/meetings/:pertemuan/assignments',
    controller.getAssignmentsByMeeting,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/assignments/{idAssignment}:
 *   get:
 *     summary: Detail assignment
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: pertemuan
 *       - in: path
 *         name: idAssignment
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/:idCourse/meetings/:pertemuan/assignments/:idAssignment',
    controller.getAssignmentDetail,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/assignments:
 *   post:
 *     summary: Buat assignment
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [judul, statusTugas, tenggat]
 *             properties:
 *               judul: { type: string }
 *               statusTugas:
 *                 type: boolean
 *                 description: true=kelompok, false=individu
 *               tenggat:
 *                 type: string
 *                 format: date-time
 *               deskripsi: { type: object }
 *               lampiran: { type: string }
 *               status:
 *                 type: string
 *                 example: HIDE
 *     responses:
 *       201:
 *         description: tugas berhasil dibuat!
 */
router.post(
    '/:idCourse/meetings/:pertemuan/assignments',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createAssignment,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/assignments/{idAssignment}:
 *   put:
 *     summary: Update assignment
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: pertemuan
 *       - in: path
 *         name: idAssignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul: { type: string }
 *               statusTugas: { type: boolean }
 *               tenggat: { type: string, format: 'date-time' }
 *               status: { type: string }
 *               deskripsi: { type: object }
 *               lampiran: { type: string }
 *     responses:
 *       200:
 *         description: tugas berhasil diubah!
 */
router.put(
    '/:idCourse/meetings/:pertemuan/assignments/:idAssignment',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateAssignment,
);

/**
 * @swagger
 * /api/courses/{idCourse}/meetings/{pertemuan}/assignments/{idAssignment}:
 *   delete:
 *     summary: Hapus assignment
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: pertemuan
 *       - in: path
 *         name: idAssignment
 *     responses:
 *       200:
 *         description: tugas berhasil dihapus!
 */
router.delete(
    '/:idCourse/meetings/:pertemuan/assignments/:idAssignment',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteAssignment,
);


module.exports = router;
