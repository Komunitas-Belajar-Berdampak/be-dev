const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./meeting.controller');

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Manajemen pertemuan dalam mata kuliah
 */

/**
 * @swagger
 * /api/meetings/{idCourse}:
 *   get:
 *     summary: Ambil semua pertemuan dalam suatu mata kuliah
 *     tags: [Meetings]
 *     security:
 *       - BearerAuth: []
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
 *                       deskripsi:
 *                         type: object
 */
router.get('/:idCourse', controller.getMeetings);

/**
 * @swagger
 * /api/meetings/{pertemuan}/courses/{idCourses}:
 *   get:
 *     summary: Ambil detail pertemuan berdasarkan nomor pertemuan dan course ID
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: pertemuan
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Nomor pertemuan (1-16)
 *       - name: idCourses
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     pertemuan:
 *                       type: integer
 *                     judul:
 *                       type: string
 *                     deskripsi:
 *                       type: object
 */
router.get('/:pertemuan/courses/:idCourses', controller.getMeetingDetail);


/**
 * @swagger
 * /api/meetings/{idPertemuan}:
 *   put:
 *     summary: Update pertemuan (judul, deskripsi)
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idPertemuan
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pertemuan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *               deskripsi:
 *                 type: object
 *     responses:
 *       200:
 *         description: pertemuan ke-x berhasil diubah!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                   example: pertemuan ke-1 berhasil diubah!
 */
router.put(
    '/:idPertemuan',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.putMeeting
);

module.exports = router;
