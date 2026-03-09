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

// ── Summary ──────────────────────────────────────────────────────────────────
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

// ── All submissions (dosen/admin) ─────────────────────────────────────────────
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

// ── My submission (mahasiswa) ─────────────────────────────────────────────────
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

// ── Submit tugas (mahasiswa) ──────────────────────────────────────────────────
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

// ── Edit submission (mahasiswa) ───────────────────────────────────────────────
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

// ── Grade submission (dosen/admin) ────────────────────────────────────────────
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