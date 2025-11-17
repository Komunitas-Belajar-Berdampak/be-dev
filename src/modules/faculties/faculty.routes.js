const express = require('express');
const Joi = require('joi');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const controller = require('./faculty.controller');

const router = express.Router();

const createFacultySchema = Joi.object({
    namaFakultas: Joi.string().trim().required(),
    kodeFakultas: Joi.string().trim().optional().allow(null, ''),
});

const updateFacultySchema = Joi.object({
    namaFakultas: Joi.string().trim().optional(),
    kodeFakultas: Joi.string().trim().optional().allow(null, ''),
}).min(1);

router.use(auth, requireRoles('SUPER_ADMIN'));

router.get('/', controller.getFaculties);
router.post('/', validate(createFacultySchema), controller.createFaculty);
router.put('/:id', validate(updateFacultySchema), controller.updateFaculty);

module.exports = router;
