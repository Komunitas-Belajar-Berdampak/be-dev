const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const {
    createUserSchema,
    updateUserSchema,
    patchUserSchema,
} = require('../../validators/users');
const controller = require('./user.controller');

const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users
 *     description: Mengambil daftar user dengan opsi filter role, angkatan, prodi, status.
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter berdasarkan nama role
 *       - in: query
 *         name: angkatan
 *         schema:
 *           type: string
 *       - in: query
 *         name: prodi
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: "aktif"
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
 *                     $ref: '#/components/schemas/UserListItem'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', auth, requireRoles('SUPER_ADMIN'), controller.getUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Detail user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                   $ref: '#/components/schemas/UserDetail'
 *       404:
 *         description: User tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', auth, requireRoles('SUPER_ADMIN'), controller.getUserById);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Membuat user baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nrp
 *               - idRole
 *               - idProdi
 *               - nama
 *               - angkatan
 *               - email
 *               - jenisKelamin
 *               - status
 *               - password
 *             properties:
 *               nrp:
 *                 type: string
 *               idRole:
 *                 type: string
 *               idProdi:
 *                 type: string
 *               nama:
 *                 type: string
 *               angkatan:
 *                 type: string
 *               email:
 *                 type: string
 *               alamat:
 *                 type: string
 *               jenisKelamin:
 *                 type: string
 *                 example: "pria"
 *               status:
 *                 type: string
 *                 example: "aktif"
 *               password:
 *                 type: string
 *               fotoProfil:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: user berhasil dibuat
 *       400:
 *         description: Bad Request
 */
router.post(
    '/',
    auth,
    requireRoles('SUPER_ADMIN'),
    validate(createUserSchema),
    controller.createUser,
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update full data user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nrp: { type: string }
 *               idRole: { type: string }
 *               idProdi: { type: string }
 *               nama: { type: string }
 *               angkatan: { type: string }
 *               email: { type: string }
 *               alamat: { type: string }
 *               jenisKelamin:
 *                 type: string
 *                 enum: [pria, wanita]
 *               status:
 *                 type: string
 *                 enum: [aktif, tidak aktif]
 *               password: { type: string }
 *               fotoProfil: { type: string }
 *     responses:
 *       200:
 *         description: user berhasil diubah!
 *       404:
 *         description: user tidak ditemukan
 */
router.put(
    '/:id',
    auth,
    requireRoles('SUPER_ADMIN'),
    validate(updateUserSchema),
    controller.updateUser,
);

/**
 * @swagger
 * /api/users:
 *   patch:
 *     summary: Update profil user yang sedang login (mahasiswa atau dosen)
 *     tags: [Users]
 *     description: Mahasiswa atau dosen bisa update profile mereka sendiri, ID diambil dari token auth
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passwordLama:
 *                 type: string
 *                 description: Password lama (wajib jika ingin ganti password)
 *               passwordBaru:
 *                 type: string
 *                 description: Password baru
 *               fotoProfil:
 *                 type: string
 *                 nullable: true
 *               alamat:
 *                 type: string
 *                 nullable: true
 *               nama:
 *                 type: string
 *     responses:
 *       200:
 *         description: data berhasil diubah!
 *       400:
 *         description: Bad Request (e.g., password lama salah)
 *       401:
 *         description: Unauthorized
 */
router.patch(
    '/',
    auth,
    validate(patchUserSchema),
    controller.patchUser,
);

module.exports = router;