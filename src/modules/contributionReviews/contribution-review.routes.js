const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./contribution-review.controller');

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * /api/contribution-reviews/sg/{idStudyGroup}:
 *   get:
 *     summary: List contribution reviews dalam study group
 *     description: Hanya untuk DOSEN/SUPER_ADMIN. Bisa filter status PENDING/REVIEWED.
 *     tags: [ContributionReviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idStudyGroup
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string, enum: [PENDING, REVIEWED] }
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/sg/:idStudyGroup',
    requireRoles('DOSEN', 'SUPER_ADMIN'),
    controller.getReviewsByStudyGroup,
);

/**
 * @swagger
 * /api/contribution-reviews/{idReview}:
 *   patch:
 *     summary: Review kontribusi mahasiswa (set REVIEWED)
 *     description: Otomatis set reviewedAt ke waktu sekarang.
 *     tags: [ContributionReviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idReview
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, finalPoints]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [REVIEWED]
 *               finalPoints:
 *                 type: number
 *                 minimum: 0
 *               lecturerNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: data berhasil direviewed!
 */
router.patch(
    '/:idReview',
    requireRoles('DOSEN', 'SUPER_ADMIN'),
    controller.patchReview,
);

module.exports = router;
