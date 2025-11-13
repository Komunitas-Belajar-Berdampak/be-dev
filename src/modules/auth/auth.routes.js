const express = require('express');
const { loginSchema } = require('../../validators/auth');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const controller = require('./auth.controller');

const router = express.Router();

router.post('/login', validate(loginSchema), controller.login);

router.post('/logout', auth, controller.logout);

module.exports = router;