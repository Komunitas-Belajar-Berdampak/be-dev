const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./notification.controller');

const router = express.Router();

router.use(auth, requireRoles('MAHASISWA'));

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notifikasi in-app untuk mahasiswa
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Daftar notifikasi mahasiswa
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipe
 *         schema:
 *           type: string
 *           enum: [NEW_ASSIGNMENT, DEADLINE_SOON, LATE_SUBMISSION]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: idCourse
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get('/', controller.getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Jumlah notifikasi belum dibaca
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get('/unread-count', controller.getUnreadCount);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Tandai semua notifikasi sebagai dibaca
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: semua notifikasi ditandai dibaca!
 */
// HARUS sebelum /:id agar "read-all" tidak ditangkap sebagai param
router.patch('/read-all', controller.markAllRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Detail satu notifikasi
 *     tags: [Notifications]
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
 *         description: Notifikasi tidak ditemukan
 */
router.get('/:id', controller.getNotificationById);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Tandai satu notifikasi sebagai dibaca
 *     tags: [Notifications]
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
 *         description: notifikasi ditandai dibaca!
 *       404:
 *         description: Notifikasi tidak ditemukan
 */
router.patch('/:id/read', controller.markRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Hapus satu notifikasi
 *     tags: [Notifications]
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
 *         description: notifikasi dihapus!
 *       404:
 *         description: Notifikasi tidak ditemukan
 */
router.delete('/:id', controller.deleteNotification);

module.exports = router;
