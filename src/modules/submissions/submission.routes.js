const express = require('express');
const Joi = require('joi');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const { successResponse } = require('../../utils/http');
const service = require('./submission.service');

const router = express.Router();

const createSchema = Joi.object({
    file: Joi.string().required(),
});

const updateSchema = Joi.object({
    file: Joi.string().required(),
});

const gradeSchema = Joi.object({
    nilai: Joi.number().min(0).max(100).required(),
    gradeAt: Joi.date().optional(),
});

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Pengumpulan tugas
 */

/**
 * @swagger
 * /api/assignments/{idAssignment}/submissions:
 *   get:
 *     summary: List submissions untuk satu assignment
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *         required: true
 *         schema: { type: string }
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
 *                     $ref: '#/components/schemas/Submission'
 */
router.get('/:idAssignment/submissions', async (req, res, next) => {
    try {
        const data = await service.listSubmissions(req.params.idAssignment, req.user);
        return successResponse(res, {
        message: 'data berhasil diambil!',
        data,
        });
    } catch (err) {
        return next(err);
    }
});

/**
 * @swagger
 * /api/assignments/{idAssignment}/submissions:
 *   post:
 *     summary: Submit tugas
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string }
 *     responses:
 *       201:
 *         description: tugas sudah tersubmit!
 */
router.post('/:idAssignment/submissions', async (req, res, next) => {
    try {
        const { error, value } = createSchema.validate(req.body);
        if (error) throw error;

        const data = await service.createSubmission(
        req.params.idAssignment,
        req.user,
        value.file,
        );

        return successResponse(res, {
        statusCode: 201,
        message: 'tugas sudah tersubmit!',
        data,
        });
    } catch (err) {
        return next(err);
    }
});

/**
 * @swagger
 * /api/assignments/{idAssignment}/submissions/{idSubmission}:
 *   patch:
 *     summary: Update file submission
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *       - in: path
 *         name: idSubmission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string }
 *     responses:
 *       200:
 *         description: submissions telah diubah!
 */
router.patch('/:idAssignment/submissions/:idSubmission', async (req, res, next) => {
    try {
        const { error, value } = updateSchema.validate(req.body);
        if (error) throw error;

        await service.updateSubmissionFile(
        req.params.idAssignment,
        req.params.idSubmission,
        req.user,
        value.file,
        );

        return successResponse(res, {
        message: 'submissions telah diubah!',
        });
    } catch (err) {
        return next(err);
    }
});

/**
 * @swagger
 * /api/assignments/{idAssignment}/submissions/{idSubmission}/grade:
 *   patch:
 *     summary: Beri nilai submission
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *       - in: path
 *         name: idSubmission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nilai]
 *             properties:
 *               nilai:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: nilai berhasil disimpan!
 */
router.patch(
    '/:idAssignment/submissions/:idSubmission/grade',
    requireRoles('DOSEN', 'SUPER_ADMIN'),
    async (req, res, next) => {
        try {
        const { error, value } = gradeSchema.validate(req.body);
        if (error) throw error;

        await service.gradeSubmission(
            req.params.idAssignment,
            req.params.idSubmission,
            req.user,
            value.nilai,
            value.gradeAt,
        );

        return successResponse(res, {
            message: 'nilai berhasil disimpan!',
        });
        } catch (err) {
        return next(err);
        }
    },
);

module.exports = router;
