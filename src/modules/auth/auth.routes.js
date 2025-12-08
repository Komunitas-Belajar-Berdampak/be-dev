const express = require('express');
const { loginSchema } = require('../../validators/auth');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const controller = require('./auth.controller');

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login dengan NRP dan password
 *     description: Mengembalikan JWT token dan data user jika kredensial benar.
 *     security: []   # login tidak pakai bearerAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: NRP atau password salah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validate(loginSchema), controller.login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout
 *     description: Logout di sisi client (server stateless, hanya buang token di client).
 *     responses:
 *       200:
 *         description: Logout berhasil
 */
router.post('/logout', auth, controller.logout);

module.exports = router;