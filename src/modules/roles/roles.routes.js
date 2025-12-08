const express = require('express');
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./roles.controller');

const router = express.Router();

const roleBodySchema = Joi.object({
    nama: Joi.string().trim().required(),
});

router.use(auth);
router.use(requireRoles('SUPER_ADMIN'));

/**
 * @openapi
 * /api/roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: List semua role
 *     description: Mengambil daftar seluruh role yang tersedia. Hanya SUPER_ADMIN yang dapat mengakses endpoint ini.
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
 *                     $ref: '#/components/schemas/Role'
 *       401:
 *         description: Unauthorized (token tidak valid / tidak ada)
 *       403:
 *         description: Forbidden (bukan SUPER_ADMIN)
 */
router.get('/', controller.getRoles);

/**
 * @openapi
 * /api/roles:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Membuat role baru
 *     description: Menambahkan role baru. Hanya SUPER_ADMIN yang diperbolehkan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *             properties:
 *               nama:
 *                 type: string
 *                 example: "DOSEN"
 *     responses:
 *       201:
 *         description: role berhasil dibuat!
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
 *                   example: role berhasil dibuat!
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Bad Request (validasi body / nama role duplikat)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', validate(roleBodySchema), controller.createRole);

/**
 * @openapi
 * /api/roles/{id}:
 *   put:
 *     tags:
 *       - Roles
 *     summary: Mengubah nama role
 *     description: Mengubah nama role berdasarkan ID. Hanya SUPER_ADMIN yang diperbolehkan.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID role (ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *             properties:
 *               nama:
 *                 type: string
 *                 example: "MAHASISWA"
 *     responses:
 *       200:
 *         description: role berhasil diubah!
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
 *                   example: role berhasil diubah!
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Bad Request (validasi body / nama role duplikat)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role tidak ditemukan
 */
router.put('/:id', validate(roleBodySchema), controller.updateRole);

/**
 * @openapi
 * /api/roles/{id}:
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Menghapus role
 *     description: Menghapus role berdasarkan ID. Hanya SUPER_ADMIN yang boleh menghapus.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID role (ObjectId)
 *     responses:
 *       200:
 *         description: role berhasil dihapus!
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
 *                   example: role berhasil dihapus!
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role tidak ditemukan
 */
router.delete('/:id', controller.deleteRole);

module.exports = router;