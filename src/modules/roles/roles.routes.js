const express = require('express');
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./roles.controller');

const router = express.Router();

const roleBodySchema = Joi.object({
    nama: Joi.string().trim().required(),
});

router.use(auth);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/', controller.getRoles);
router.post('/', validate(roleBodySchema), controller.createRole);
router.put('/:id', validate(roleBodySchema), controller.updateRole);
router.delete('/:id', controller.deleteRole);

module.exports = router;