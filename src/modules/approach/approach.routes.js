const express = require('express');
const auth = require('../../middlewares/auth');
const controller = require('./approach.controller');

const router = express.Router();

router.use(auth);

/**
 * @openapi
 * /api/approach/{idUser}:
 *   get:
 *     tags:
 *       - Approach
 *     summary: Ambil profil gaya belajar mahasiswa
 *     description: Mengambil profil pendekatan/gaya belajar untuk seorang mahasiswa.
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user (ObjectId di collection users)
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
 *                   $ref: '#/components/schemas/Approach'
 *       400:
 *         description: ID user tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (token tidak ada / salah)
 *       403:
 *         description: Forbidden (bukan pemilik & bukan SUPER_ADMIN/DOSEN)
 *       404:
 *         description: Profil gaya belajar belum dibuat / user tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:idUser', controller.getApproach);

/**
 * @openapi
 * /api/approach/{idUser}:
 *   post:
 *     tags:
 *       - Approach
 *     summary: Membuat profil gaya belajar mahasiswa
 *     description: Membuat pertama kali profil gaya belajar untuk seorang mahasiswa. Jika sudah ada, gunakan PATCH.
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user (ObjectId di collection users)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gayaBelajar
 *             properties:
 *               gayaBelajar:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - "visual"
 *                   - "belajar sendiri"
 *                   - "suka diskusi kelompok"
 *     responses:
 *       201:
 *         description: data berhasil dibuat!
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
 *                   example: data berhasil dibuat!
 *                 data:
 *                   $ref: '#/components/schemas/Approach'
 *       400:
 *         description: Bad Request (validasi body / profil sudah ada)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User tidak ditemukan
 */
router.post('/:idUser', controller.createApproach);

/**
 * @openapi
 * /api/approach/{idUser}:
 *   patch:
 *     tags:
 *       - Approach
 *     summary: Mengubah profil gaya belajar mahasiswa
 *     description: Mengubah daftar gayaBelajar untuk seorang mahasiswa yang sudah punya profil.
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user (ObjectId di collection users)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gayaBelajar
 *             properties:
 *               gayaBelajar:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - "auditorial"
 *                   - "belajar lewat diskusi"
 *     responses:
 *       200:
 *         description: gaya belajar telah diubah!
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
 *                   example: gaya belajar telah diubah!
 *       400:
 *         description: Bad Request (validasi body)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Profil gaya belajar belum dibuat / user tidak ditemukan
 */
router.patch('/:idUser', controller.updateApproach);

module.exports = router;
