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

router.get(
    '/groups/:idGroup/threads',
    controller.getThreadsByGroup,
);
router.post(
    '/groups/:idGroup/threads',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.createThread,
);

router.get(
    '/threads/:idThread/posts',
    controller.getPostsByThread,
);
router.post(
    '/threads/:idThread/posts',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.createPost,
);
router.put(
    '/threads/:idThread/posts/:idPost',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.updatePostController,
);
router.delete(
    '/threads/:idThread/posts/:idPost',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.deletePostController,
);

router.get(
    '/threads/:idThread/tasks',
    controller.getTasksByThread,
);
router.post(
    '/threads/:idThread/tasks',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.createTask,
);
router.put(
    '/threads/:idThread/tasks/:idTask',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.updateTaskController,
);
router.delete(
    '/threads/:idThread/tasks/:idTask',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.deleteTaskController,
);

module.exports = router;
