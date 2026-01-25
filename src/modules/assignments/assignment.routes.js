const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./assignment.controller');

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: API tugas per pertemuan
 */

// Register more specific routes first to avoid conflicts

/**
 * @swagger
 * /api/assignments/{idCourse}/meetings/{pertemuan}:
 *   get:
 *     summary: Ambil assignment untuk pertemuan tertentu
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idCourse
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID mata kuliah
 *       - name: pertemuan
 *         in: path
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       judul:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [HIDE, VISIBLE]
 *                       statusTugas:
 *                         type: boolean
 *                       tenggat:
 *                         type: string
 *                         format: date-time
 */
router.get('/:idCourse/meetings/:pertemuan', controller.getAssignmentsByMeeting);

/**
 * @swagger
 * /api/assignments/{idCourse}/meetings/{pertemuan}:
 *   post:
 *     summary: Buat assignment baru
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idCourse
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: pertemuan
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - judul
 *               - statusTugas
 *               - tenggat
 *             properties:
 *               judul:
 *                 type: string
 *               statusTugas:
 *                 type: boolean
 *                 description: true=kelompok, false=individu
 *               tenggat:
 *                 type: string
 *                 format: date-time
 *               deskripsi:
 *                 type: object
 *               lampiran:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HIDE, VISIBLE]
 *                 default: HIDE
 *     responses:
 *       201:
 *         description: tugas berhasil dibuat!
 */
router.post(
    '/:idCourse/meetings/:pertemuan',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createAssignment
);

/**
 * @swagger
 * /api/assignments/{idCourse}:
 *   get:
 *     summary: Ambil semua assignment dalam course
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idCourse
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID mata kuliah
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       pertemuan:
 *                         type: integer
 *                       judul:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [HIDE, VISIBLE]
 *                       statusTugas:
 *                         type: boolean
 *                       tenggat:
 *                         type: string
 *                         format: date-time
 */
router.get('/:idCourse', controller.getAssignmentsByCourse);

/**
 * @swagger
 * /api/assignments/{idAssignment}:
 *   get:
 *     summary: Ambil detail 1 assignment berdasarkan ID
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idAssignment
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID assignment
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
 *                     id:
 *                       type: string
 *                     judul:
 *                       type: string
 *                     statusTugas:
 *                       type: string
 *                       enum: [kelompok, individu]
 *                     tenggat:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [HIDE, VISIBLE]
 *                     deskripsi:
 *                       type: object
 *                     lampiran:
 *                       type: string
 *                       description: pathLampiran
 *       404:
 *         description: Assignment tidak ditemukan
 *       403:
 *         description: Mahasiswa tidak boleh mengakses assignment HIDE
 */
router.get('/:idAssignment', controller.getAssignmentDetail);

/**
 * @swagger
 * /api/assignments/{idAssignment}:
 *   put:
 *     summary: Update assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idAssignment
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *               statusTugas:
 *                 type: boolean
 *                 description: true=kelompok, false=individu
 *               tenggat:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [HIDE, VISIBLE]
 *               deskripsi:
 *                 type: object
 *               lampiran:
 *                 type: string
 *     responses:
 *       200:
 *         description: tugas berhasil diubah!
 */
router.put(
    '/:idAssignment',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateAssignment
);


/**
 * @swagger
 * /api/assignments/{idAssignment}:
 *   delete:
 *     summary: Hapus assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idAssignment
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID assignment
 *     responses:
 *       200:
 *         description: tugas berhasil dihapus!
 */
router.delete(
    '/:idAssignment',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteAssignment
);

module.exports = router;
