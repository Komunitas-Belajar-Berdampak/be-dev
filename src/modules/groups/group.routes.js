const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./group.controller');

const router = express.Router();

router.use(auth);

router.get('/courses/:idCourse/groups', controller.getGroupsByCourse);

router.get('/courses/:idCourse/groups/:idGroup', controller.getGroupDetail);

router.get(
    '/courses/:idCourse/groups/:idGroup/user-detail/:idUser',
    controller.getUserDetailInGroup,
);

router.post(
    '/courses/:idCourse/groups',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createGroup,
);

router.put(
    '/courses/:idCourse/groups/:idGroup',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateGroup,
);

router.delete(
    '/courses/:idCourse/groups/:idGroup',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteGroup,
);

router.get(
    '/groups/:idGroup/memberships',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.getMemberships,
);

router.post(
    '/groups/:idGroup/memberships/join',
    requireRoles('MAHASISWA'),
    controller.joinGroup,
);

router.post(
    '/groups/:idGroup/memberships/:idMembership/approve',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.approveMembership,
);

router.post(
    '/groups/:idGroup/memberships/:idMembership/reject',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.rejectMembership,
);

module.exports = router;
