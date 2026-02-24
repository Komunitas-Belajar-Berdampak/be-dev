const express = require('express');
const Joi = require('joi');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const controller = require('./academic-term.controller');

const router = express.Router();

const createTermSchema = Joi.object({
    periode: Joi.string().trim().required(),
    semesterType: Joi.string().valid('Ganjil', 'Genap').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid('aktif', 'tidak aktif').optional(),
});

const updateTermSchema = Joi.object({
    periode: Joi.string().trim().optional(),
    semesterType: Joi.string().valid('Ganjil', 'Genap').allow(null).optional(),
    startDate: Joi.date().allow(null).optional(),
    endDate: Joi.date().allow(null).optional(),
    status: Joi.string().valid('aktif', 'tidak aktif').optional(),
}).min(1);

const patchTermSemesterSchema = Joi.object({
    semesterType: Joi.string().valid('Ganjil', 'Genap').allow(null).required(),
});

const addSemestersSchema = Joi.object({
    semesters: Joi.array().items(Joi.number().integer().min(1)).min(1).required(),
});

router.use(auth, requireRoles('SUPER_ADMIN'));

/**
 * @swagger
 * /api/academic-terms:
 *   get:
 *     summary: Ambil daftar periode akademik
 *     tags: [AcademicTerms]
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
 *                     $ref: '#/components/schemas/AcademicTerm'
 */
router.get('/', controller.getTerms);

/**
 * @swagger
 * /api/academic-terms/{id}:
 *   get:
 *     summary: Ambil detail periode akademik
 *     tags: [AcademicTerms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *       404:
 *         description: Periode akademik tidak ditemukan
 */
router.get('/:id', controller.getTermById);

/**
 * @swagger
 * /api/academic-terms:
 *   post:
 *     summary: Buat periode akademik
 *     tags: [AcademicTerms]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [periode, status]
 *             properties:
 *               periode: { type: string }
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [aktif, tidak aktif]
 *     responses:
 *       201:
 *         description: Periode akademik berhasil dibuat!
 */
router.post('/', validate(createTermSchema), controller.createTerm);

/**
 * @swagger
 * /api/academic-terms/{id}:
 *   put:
 *     summary: Update semua field periode akademik
 *     tags: [AcademicTerms]
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
 *               periode: { type: string }
 *               semesterType:
 *                 type: string
 *                 enum: [Ganjil, Genap]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [aktif, tidak aktif]
 *     responses:
 *       200:
 *         description: Periode akademik berhasil diperbarui!
 */
router.put('/:id', validate(updateTermSchema), controller.updateTerm);

/**
 * @swagger
 * /api/academic-terms/{id}:
 *   patch:
 *     summary: Update semesterType saja (semesters otomatis mengikuti)
 *     tags: [AcademicTerms]
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
 *             required: [semesterType]
 *             properties:
 *               semesterType:
 *                 type: string
 *                 enum: [Ganjil, Genap]
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Semester periode berhasil diperbarui!
 */
router.patch('/:id', validate(patchTermSemesterSchema), controller.patchTermSemester);

/**
 * @swagger
 * /api/academic-terms/{id}/semesters:
 *   post:
 *     summary: Tambah semester ke periode akademik
 *     tags: [AcademicTerms]
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
 *             required: [semesters]
 *             properties:
 *               semesters:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3, 4, 5]
 *     responses:
 *       201:
 *         description: Semester berhasil ditambahkan!
 */
router.post('/:id/semesters', validate(addSemestersSchema), controller.setSemesters);

/**
 * @swagger
 * /api/academic-terms/{id}:
 *   delete:
 *     summary: Hapus periode akademik
 *     tags: [AcademicTerms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Periode akademik berhasil dihapus!
 */
router.delete('/:id', controller.deleteTerm);

module.exports = router;