const express = require('express');
const Joi = require('joi');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const controller = require('./major.controller');

const router = express.Router();

const createSchema = Joi.object({
    kodeProdi: Joi.string().trim().required(),
    namaProdi: Joi.string().trim().required(),
    idFakultas: Joi.string().required(),
});

const updateSchema = Joi.object({
    kodeProdi: Joi.string().trim().optional(),
    namaProdi: Joi.string().trim().optional(),
    idFakultas: Joi.string().optional(),
}).min(1);

router.use(auth, requireRoles('SUPER_ADMIN'));

router.get('/', controller.getMajors);
router.post('/', validate(createSchema), controller.createMajor);
router.put('/:id', validate(updateSchema), controller.updateMajor);

module.exports = router;