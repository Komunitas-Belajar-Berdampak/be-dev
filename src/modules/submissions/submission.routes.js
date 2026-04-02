const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const { createUpload } = require('../../middlewares/upload');
const { uploadFile } = require('../../libs/s3');
const { successResponse } = require('../../utils/http');
const service = require('./submission.service');

const router = express.Router();

const Joi = require('joi');

const gradeSchema = Joi.object({
    nilai: Joi.number().min(0).max(100).required(),
    gradeAt: Joi.date().optional(),
});

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: API pengumpulan dan penilaian tugas
 */

/**
 * @swagger
 * /api/submissions/{idAssignment}/summary:
 *   get:
 *     summary: Ringkasan submission untuk satu tugas
 *     tags: [Submissions]
 *     description: Hanya DOSEN / SUPER_ADMIN
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
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
 *                   type: object
 *                   properties:
 *                     totalMahasiswa:
 *                       type: integer
 *                     telahSubmit:
 *                       type: integer
 *                     butuhPenilaian:
 *                       type: integer
 *                     telat:
 *                       type: integer
 *                     tenggat:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     tugasJudul:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tugas tidak ditemukan
 */
router.get(
    '/:idAssignment/summary',
    requireRoles('DOSEN', 'SUPER_ADMIN'),
    async (req, res, next) => {
        try {
            const data = await service.getSubmissionSummary(
                req.params.idAssignment,
                req.user
            );
            return successResponse(res, {
                message: 'data berhasil diambil!',
                data,
            });
        } catch (err) {
            return next(err);
        }
    }
);

/**
 * @swagger
 * /api/submissions/{idAssignment}/all:
 *   get:
 *     summary: List semua submission (DOSEN / SUPER_ADMIN)
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Halaman (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Jumlah per halaman (default 10)
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
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalMahasiswa:
 *                       type: integer
 *                     telahSubmit:
 *                       type: integer
 *                     butuhPenilaian:
 *                       type: integer
 *                     telat:
 *                       type: integer
 *                     tenggat:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubmissionListItem'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tugas tidak ditemukan
 */
router.get('/:idAssignment/all', requireRoles('DOSEN', 'SUPER_ADMIN'), async (req, res, next) => {
    try {
        const result = await service.listAllSubmissions(req.params.idAssignment, req.user, req.query);
        return successResponse(res, {
            message: 'data berhasil diambil!',
            summary: result.summary,
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
 *     summary: Lihat submission saya (MAHASISWA)
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
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
 *                   type: object
 *                   nullable: true
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
 *                       nullable: true
 *                     grade:
 *                       type: number
 *                       nullable: true
 *                     gradeAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tugas tidak ditemukan
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
 *     summary: Kumpulkan tugas (MAHASISWA)
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File tugas yang dikumpulkan
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
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     aiFlag:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         suspicious:
 *                           type: boolean
 *                         reason:
 *                           type: string
 *       400:
 *         description: Sudah pernah submit
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (bukan mahasiswa)
 *       422:
 *         description: Tenggat sudah lewat
 */
router.post('/:idAssignment', createUpload('file', { required: true }), async (req, res, next) => {
    try {
        const fileUrl = await uploadFile(req.file, 'submissions');
        const data = await service.createSubmission(
            req.params.idAssignment,
            req.user,
            fileUrl,
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
 *     summary: Edit submission saya (MAHASISWA)
 *     tags: [Submissions]
 *     description: Hanya bisa dilakukan sebelum tenggat lewat
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File baru (opsional, jika tidak diisi file lama tetap dipakai)
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Submission belum ada
 *       422:
 *         description: Tenggat sudah lewat
 */
router.patch('/:idAssignment', createUpload('file', { required: false }), async (req, res, next) => {
    try {
        const fileUrl = req.file ? await uploadFile(req.file, 'submissions') : undefined;
        const data = await service.updateMySubmission(
            req.params.idAssignment,
            req.user,
            fileUrl,
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
 *     summary: Beri nilai submission (DOSEN / SUPER_ADMIN)
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: idSubmission
 *         required: true
 *         schema:
 *           type: string
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
 *               gradeAt:
 *                 type: string
 *                 format: date-time
 *                 description: Tanggal penilaian (opsional, default sekarang)
 *     responses:
 *       200:
 *         description: nilai berhasil disimpan!
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Submission tidak ditemukan
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
