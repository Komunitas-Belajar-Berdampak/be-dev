const express = require('express');
const Joi = require('joi');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const controller = require('./academic-term.controller');

const router = express.Router();

const createTermSchema = Joi.object({
    periode: Joi.string().trim().required(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid('aktif', 'tidak aktif').optional(),
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