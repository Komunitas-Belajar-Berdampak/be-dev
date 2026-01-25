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
    file: Joi.string().optional(),
}).min(1);

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

// Register more specific routes first
/**
 * @swagger
 * /api/submissions/{idAssignment}/all:
 *   get:
 *     summary: Ambil semua submissions untuk assignment (untuk dosen/admin)
 *     tags: [Submissions]
 *     description: Dosen/admin dapat melihat semua submissions untuk assignment tertentu
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: idAssignment
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID assignment
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
 *                       mahasiswa:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nrp:
 *                             type: string
 *                           nama:
 *                             type: string
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *                       file:
 *                         type: string
 *                         description: pathFile
 *                       grade:
 *                         type: number
 *                       gradeAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/:idAssignment/all', requireRoles('DOSEN', 'SUPER_ADMIN'), async (req, res, next) => {
    try {
        const result = await service.listAllSubmissions(req.params.idAssignment, req.user, req.query);
        return successResponse(res, {
            message: 'data berhasil diambil!',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (err) {
        return next(err);
    }
});

/**
 * @swagger
 * /api/submissions/{idAssignment}:
 *   get:
 *     summary: Ambil submission mahasiswa sendiri untuk assignment tertentu
 *     tags: [Submissions]
 *     description: Mahasiswa dapat melihat submission mereka sendiri
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: idAssignment
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID assignment
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
 *                       nullable: true
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     file:
 *                       type: string
 *                       description: pathFile
 *                       nullable: true
 *                     grade:
 *                       type: number
 *                       nullable: true
 *                     gradeAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 */
router.get('/:idAssignment', async (req, res, next) => {
    try {
        const data = await service.getMySubmission(req.params.idAssignment, req.user);
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
 * /api/submissions/{idAssignment}:
 *   post:
 *     summary: Submit tugas (mahasiswa)
 *     tags: [Submissions]
 *     description: Mahasiswa submit tugas untuk assignment tertentu. submittedAt otomatis menggunakan waktu sekarang.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: idAssignment
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 description: Path file submission
 *     responses:
 *       201:
 *         description: tugas sudah tersubmit!
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
 *                     file:
 *                       type: string
 *                       description: pathFile
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Sudah submit sebelumnya, gunakan PATCH untuk mengubah
 *       422:
 *         description: Tenggat waktu telah lewat
 */
router.post('/:idAssignment', async (req, res, next) => {
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
 * /api/submissions/{idAssignment}:
 *   patch:
 *     summary: Edit submission (mahasiswa)
 *     tags: [Submissions]
 *     description: Mahasiswa dapat mengubah submission mereka jika belum melewati deadline. submittedAt otomatis diupdate ke waktu sekarang.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: idAssignment
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 description: Path file submission baru (optional)
 *     responses:
 *       200:
 *         description: submissions telah diubah!
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
 *                     file:
 *                       type: string
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Submission tidak ditemukan, silakan submit terlebih dahulu
 *       422:
 *         description: Tenggat waktu telah lewat, tidak bisa mengubah submission
 */
router.patch('/:idAssignment', async (req, res, next) => {
    try {
        const { error, value } = updateSchema.validate(req.body);
        if (error) throw error;

        const data = await service.updateMySubmission(
            req.params.idAssignment,
            req.user,
            value.file,
        );

        return successResponse(res, {
            message: 'submissions telah diubah!',
            data,
        });
    } catch (err) {
        return next(err);
    }
});

/**
 * @swagger
 * /api/submissions/assignments/{idAssignment}/submissions/{idSubmission}/grade:
 *   patch:
 *     summary: Beri nilai submission (untuk dosen/admin)
 *     tags: [Submissions]
 *     description: Dosen/admin dapat memberi nilai pada submission mahasiswa. gradeAt otomatis menggunakan waktu sekarang jika tidak diisi.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *         required: true
 *         schema:
 *           type: string
 *         description: ID assignment
 *       - in: path
 *         name: idSubmission
 *         required: true
 *         schema:
 *           type: string
 *         description: ID submission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nilai
 *             properties:
 *               nilai:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Nilai submission (0-100)
 *               gradeAt:
 *                 type: string
 *                 format: date-time
 *                 description: Waktu penilaian (otomatis jika tidak diisi)
 *     responses:
 *       200:
 *         description: nilai berhasil disimpan!
 */
router.patch(
    '/assignments/:idAssignment/submissions/:idSubmission/grade',
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
