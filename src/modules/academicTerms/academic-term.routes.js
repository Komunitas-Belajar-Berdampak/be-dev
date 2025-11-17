const express = require('express');
const Joi = require('joi');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const controller = require('./academic-term.controller');

const router = express.Router();

const createTermSchema = Joi.object({
    periode: Joi.string().trim().required(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid('aktif', 'tidak aktif').optional(),
});

router.use(auth, requireRoles('SUPER_ADMIN'));

router.get('/', controller.getTerms);
router.post('/', validate(createTermSchema), controller.createTerm);
router.delete('/:id', controller.deleteTerm);

module.exports = router;