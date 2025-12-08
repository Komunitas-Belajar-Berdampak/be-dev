const express = require('express');
const Joi = require('joi');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const controller = require('./faculty.controller');

const router = express.Router();

const createFacultySchema = Joi.object({
    namaFakultas: Joi.string().trim().required(),
    kodeFakultas: Joi.string().trim().optional().allow(null, ''),
});

const updateFacultySchema = Joi.object({
    namaFakultas: Joi.string().trim().optional(),
    kodeFakultas: Joi.string().trim().optional().allow(null, ''),
}).min(1);

router.use(auth, requireRoles('SUPER_ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Faculty
 *   description: Manajemen fakultas
 */

/**
 * @swagger
 * /api/faculty:
 *   get:
 *     summary: Ambil daftar fakultas
 *     tags: [Faculty]
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
 *                     $ref: '#/components/schemas/Faculty'
 */
router.get('/', controller.getFaculties);

/**
 * @swagger
 * /api/faculty:
 *   post:
 *     summary: Buat fakultas baru
 *     tags: [Faculty]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [namaFakultas]
 *             properties:
 *               namaFakultas: { type: string }
 *               kodeFakultas:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: fakultas telah dibuat!
 */
router.post('/', validate(createFacultySchema), controller.createFaculty);

/**
 * @swagger
 * /api/faculty/{id}:
 *   put:
 *     summary: Update fakultas
 *     tags: [Faculty]
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
 *               namaFakultas: { type: string }
 *               kodeFakultas: { type: string }
 *     responses:
 *       200:
 *         description: nama fakultas telah diubah!
 */
router.put('/:id', validate(updateFacultySchema), controller.updateFaculty);

module.exports = router;
