const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./material.controller');

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: Materi per pertemuan
 */

// Register more specific routes (with multiple segments) first
// to avoid conflicts with single-parameter routes

/**
 * @swagger
 * /api/materials/{idCourse}/meetings/{pertemuan}:
 *   get:
 *     summary: Ambil materi berdasarkan pertemuan
 *     tags: [Materials]
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
 *                       namaFile:
 *                         type: string
 *                       deskripsi:
 *                         type: object
 *                       pathFile:
 *                         type: string
 *                       visibility:
 *                         type: string
 *                         enum: [HIDE, VISIBLE]
 */
router.get('/:idCourse/meetings/:pertemuan', controller.getMaterialsByMeeting);

/**
 * @swagger
 * /api/materials/{idCourse}/meetings/{pertemuan}:
 *   post:
 *     summary: Tambah materi pada pertemuan
 *     tags: [Materials]
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
 *               - namaFile
 *               - tipe
 *               - pathFile
 *             properties:
 *               namaFile:
 *                 type: string
 *               tipe:
 *                 type: string
 *               pathFile:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [HIDE, VISIBLE]
 *                 default: HIDE
 *               deskripsi:
 *                 type: object
 *     responses:
 *       201:
 *         description: materi berhasil dibuat!
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
 *                     namaFile:
 *                       type: string
 *                     pathFile:
 *                       type: string
 *                     visibility:
 *                       type: string
 *                     deskripsi:
 *                       type: object
 */
router.post(
    '/:idCourse/meetings/:pertemuan',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createMaterial
);

// Single parameter routes below
// NOTE: GET /:idCourse and GET /:idMaterial have conflicting patterns.
// Based on route order, /:idCourse will match first for all single-parameter GETs.
// To get a single material detail, use the material ID after creation.

/**
 * @swagger
 * /api/materials/{idCourse}:
 *   get:
 *     summary: Ambil semua materi dalam 1 course
 *     tags: [Materials]
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
 *                       namaFile:
 *                         type: string
 *                       deskripsi:
 *                         type: object
 *                       pathFile:
 *                         type: string
 *                       visibility:
 *                         type: string
 *                         enum: [HIDE, VISIBLE]
 */
router.get('/:idCourse', controller.getMaterialsByCourse);

/**
 * @swagger
 * /api/materials/{idMaterial}:
 *   get:
 *     summary: Ambil detail 1 material berdasarkan ID
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idMaterial
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID material
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
 *                     idMeeting:
 *                       type: string
 *                     idCourse:
 *                       type: string
 *                     namaFile:
 *                       type: string
 *                     pathFile:
 *                       type: string
 *                     visibility:
 *                       type: string
 *                       enum: [HIDE, VISIBLE]
 *                     deskripsi:
 *                       type: object
 *       404:
 *         description: Material tidak ditemukan
 *       403:
 *         description: Mahasiswa tidak boleh mengakses materi HIDE
 */
router.get('/:idMaterial', controller.getMaterialDetail);

/**
 * @swagger
 * /api/materials/{idMaterial}:
 *   put:
 *     summary: Update materi
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idMaterial
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID material
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               namaFile:
 *                 type: string
 *               tipe:
 *                 type: string
 *               pathFile:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [HIDE, VISIBLE]
 *               deskripsi:
 *                 type: object
 *     responses:
 *       200:
 *         description: materi berhasil diubah!
 */
router.put(
    '/:idMaterial',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateMaterial
);

/**
 * @swagger
 * /api/materials/{idMaterial}:
 *   delete:
 *     summary: Hapus materi
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idMaterial
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID material
 *     responses:
 *       200:
 *         description: materi berhasil dihapus!
 */
router.delete(
    '/:idMaterial',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteMaterial
);

module.exports = router;
