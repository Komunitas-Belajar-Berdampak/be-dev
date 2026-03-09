const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./dashboard.controller');

const router = express.Router();

router.use(auth, requireRoles('SUPER_ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Statistik dan performa sistem
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Ambil statistik dashboard
 *     tags: [Dashboard]
 *     description: |
 *       Menampilkan statistik keseluruhan sistem untuk keperluan dashboard.
 *       Hanya dapat diakses oleh SUPER_ADMIN.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: data dashboard berhasil diambil!
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
 *                     totalUser:
 *                       type: integer
 *                     totalMahasiswa:
 *                       type: integer
 *                     totalDosen:
 *                       type: integer
 *                     totalAdmin:
 *                       type: integer
 *                     totalUserPerRole:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                           total:
 *                             type: integer
 *                     statusUser:
 *                       type: object
 *                       properties:
 *                         aktif:
 *                           type: integer
 *                         tidakAktif:
 *                           type: integer
 *                     totalMatakuliah:
 *                       type: integer
 *                     periodeAktif:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         periode:
 *                           type: string
 *                         semesterType:
 *                           type: string
 *                           nullable: true
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                     totalFakultas:
 *                       type: integer
 */
router.get('/stats', controller.getStats);

module.exports = router;
