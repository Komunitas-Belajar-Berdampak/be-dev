const express = require('express');
const Joi = require('joi');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const controller = require('./major.controller');

const router = express.Router();

const createSchema = Joi.object({
    kodeProdi: Joi.string().trim().required(),
    namaProdi: Joi.string().trim().required(),
    idFakultas: Joi.string().required(),
});

const updateSchema = Joi.object({
    kodeProdi: Joi.string().trim().optional(),
    namaProdi: Joi.string().trim().optional(),
    idFakultas: Joi.string().optional(),
}).min(1);

router.use(auth, requireRoles('SUPER_ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Majors
 *   description: Manajemen program studi
 */

/**
 * @swagger
 * /api/major:
 *   get:
 *     summary: Ambil daftar prodi
 *     tags: [Majors]
 *     security:
 *       - BearerAuth: []
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
 *                     $ref: '#/components/schemas/Major'
 */
router.get('/', controller.getMajors);

/**
 * @swagger
 * /api/major:
 *   post:
 *     summary: Buat prodi baru
 *     tags: [Majors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kodeProdi, namaProdi, idFakultas]
 *             properties:
 *               kodeProdi: { type: string }
 *               namaProdi: { type: string }
 *               idFakultas: { type: string }
 *     responses:
 *       201:
 *         description: prodi berhasil dibuat
 */
router.post('/', validate(createSchema), controller.createMajor);

/**
 * @swagger
 * /api/major/{id}:
 *   put:
 *     summary: Update prodi
 *     tags: [Majors]
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
 *               kodeProdi: { type: string }
 *               namaProdi: { type: string }
 *               idFakultas: { type: string }
 *     responses:
 *       200:
 *         description: prodi berhasil diubah!
 */
router.put('/:id', validate(updateSchema), controller.updateMajor);

module.exports = router;