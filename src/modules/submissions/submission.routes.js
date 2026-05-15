const express = require('express');
const axios = require('axios');
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tugas tidak ditemukan
 */
router.get(
    '/:idAssignment/all',
    requireRoles('DOSEN', 'SUPER_ADMIN'),
    async (req, res, next) => {
        try {
            const result = await service.listAllSubmissions(
                req.params.idAssignment,
                req.user,
                req.query
            );
            return successResponse(res, {
                message: 'data berhasil diambil!',
                summary: result.summary,
                data: result.items,
                pagination: result.pagination,
            });
        } catch (err) {
            return next(err);
        }
    }
);

/**
 * @swagger
 * /api/submissions/{idAssignment}/file-proxy:
 *   get:
 *     summary: Proxy download file submission dari R2 (hindari CORS)
 *     tags: [Submissions]
 *     description: Hanya DOSEN / SUPER_ADMIN. Mengunduh file dari R2 melalui server untuk menghindari CORS.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAssignment
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fileUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: URL file di R2 yang ingin diunduh
 *     responses:
 *       200:
 *         description: Stream file berhasil
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: fileUrl tidak diberikan
 *       403:
 *         description: URL tidak diizinkan
 *       404:
 *         description: File tidak ditemukan di upstream
 */
router.get(
    '/:idAssignment/file-proxy',
    requireRoles('DOSEN', 'SUPER_ADMIN'),
    async (req, res, next) => {
        try {
            const { fileUrl } = req.query;

            if (!fileUrl) {
                return res.status(400).json({ message: 'Query param fileUrl wajib diisi' });
            }

            // Validasi: hanya izinkan URL dari domain R2 kita sendiri
            const R2_BASE = process.env.R2_BASE_URL ?? '';
            if (R2_BASE && !fileUrl.startsWith(R2_BASE)) {
                return res.status(403).json({ message: 'URL tidak diizinkan' });
            }

            const upstream = await axios.get(fileUrl, {
                responseType: 'stream',
                timeout: 30_000,
            });

            // Teruskan header penting dari upstream ke client
            const contentType =
                upstream.headers['content-type'] ?? 'application/octet-stream';
            const contentDisposition = upstream.headers['content-disposition'];
            const contentLength = upstream.headers['content-length'];

            res.setHeader('Content-Type', contentType);
            if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
            if (contentLength) res.setHeader('Content-Length', contentLength);

            // Pipe stream langsung ke response
            upstream.data.pipe(res);

            // Handle error di tengah stream
            upstream.data.on('error', (err) => {
                console.error('[file-proxy] stream error:', err);
                if (!res.headersSent) next(err);
                else res.destroy(err);
            });
        } catch (err) {
            if (err.response?.status === 404) {
                return res.status(404).json({ message: 'File tidak ditemukan di upstream' });
            }
            return next(err);
        }
    }
);

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
 *     responses:
 *       201:
 *         description: tugas sudah tersubmit!
 *       400:
 *         description: Sudah pernah submit
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (bukan mahasiswa)
 *       422:
 *         description: Tenggat sudah lewat
 */
router.post(
    '/:idAssignment',
    createUpload('file', { required: true }),
    async (req, res, next) => {
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
    }
);

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
 *     responses:
 *       200:
 *         description: submissions telah diubah!
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Submission belum ada
 *       422:
 *         description: Tenggat sudah lewat
 */
router.patch(
    '/:idAssignment',
    createUpload('file', { required: false }),
    async (req, res, next) => {
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
    }
);

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
    }
);

module.exports = router;