const express = require('express');
const auth = require('../../middlewares/auth');
const controller = require('./private-file.controller');

const router = express.Router();

router.use(auth);

/**
 * @openapi
 * /api/private-files:
 *   get:
 *     tags:
 *       - Private Files
 *     summary: List file pribadi milik user login
 *     description: Mengambil daftar file pribadi yang dimiliki oleh user yang sedang login.
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
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: data berhasil diambil!
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrivateFile'
 *       401:
 *         description: Unauthorized
 */
router.get('/', controller.listPrivateFiles);

/**
 * @openapi
 * /api/private-files:
 *   post:
 *     tags:
 *       - Private Files
 *     summary: Menambah file pribadi untuk user login
 *     description: Menyimpan metadata file pribadi (path, size, status) untuk user yang sedang login.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filePath
 *               - fileSize
 *             properties:
 *               filePath:
 *                 type: string
 *                 example: "users/2272002/notes/bab2.pdf"
 *               fileSize:
 *                 type: string
 *                 example: "1.9 MB"
 *               status:
 *                 type: string
 *                 enum: [VISIBLE, PRIVATE]
 *                 example: "PRIVATE"
 *               tipe:
 *                 type: string
 *                 example: "application/pdf"
 *     responses:
 *       201:
 *         description: data berhasil disimpan!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: data berhasil disimpan!
 *                 data:
 *                   $ref: '#/components/schemas/PrivateFile'
 *       400:
 *         description: Bad Request (validasi body gagal)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 */
router.post('/', controller.createPrivateFile);


/**
 * @openapi
 * /api/private-files/{id}:
 *   patch:
 *     tags:
 *       - Private Files
 *     summary: Mengubah status file pribadi (VISIBLE / PRIVATE)
 *     description: Hanya pemilik file yang dapat mengubah statusnya.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dokumen private file
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VISIBLE, PRIVATE]
 *                 example: "VISIBLE"
 *     responses:
 *       200:
 *         description: status file diubah!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: status file diubah!
 *       400:
 *         description: Bad Request (validasi body)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File tidak ditemukan / bukan milik user login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id', controller.patchPrivateFileStatus);

/**
 * @openapi
 * /api/private-files/{id}:
 *   delete:
 *     tags:
 *       - Private Files
 *     summary: Menghapus file pribadi
 *     description: Menghapus satu file pribadi milik user login berdasarkan id.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dokumen private file
 *     responses:
 *       200:
 *         description: file dihapus!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: file dihapus!
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File tidak ditemukan / bukan milik user login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', controller.deletePrivateFile);

module.exports = router;
