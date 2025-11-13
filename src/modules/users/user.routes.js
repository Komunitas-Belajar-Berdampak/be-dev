const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const {
    createUserSchema,
    updateUserSchema,
    patchUserSchema,
} = require('../../validators/users');
const controller = require('./user.controller');

const router = express.Router();

router.use(auth);

router.get('/', requireRoles('SUPER_ADMIN'), controller.getUsers);
router.get('/:id', requireRoles('SUPER_ADMIN'), controller.getUserById);
router.post(
    '/',
    requireRoles('SUPER_ADMIN'),
    validate(createUserSchema),
    controller.createUser,
);
router.put(
    '/:id',
    requireRoles('SUPER_ADMIN'),
    validate(updateUserSchema),
    controller.updateUser,
);

router.patch(
    '/:id',
    validate(patchUserSchema),
    controller.patchUser,
);

module.exports = router;