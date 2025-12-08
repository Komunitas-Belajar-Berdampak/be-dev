const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./group.controller');

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * /api/courses/{idCourse}/groups:
 *   get:
 *     summary: List kelompok belajar di 1 course
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudyGroupSummary'
 */
router.get('/courses/:idCourse/groups', controller.getGroupsByCourse);

/**
 * @swagger
 * /api/courses/{idCourse}/groups/{idGroup}:
 *   get:
 *     summary: Detail kelompok belajar
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: idGroup
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/StudyGroupDetail'
 */
router.get('/courses/:idCourse/groups/:idGroup', controller.getGroupDetail);

/**
 * @swagger
 * /api/courses/{idCourse}/groups/{idGroup}/user-detail/{idUser}:
 *   get:
 *     summary: Detail kontribusi & aktivitas 1 mahasiswa dalam 1 kelompok
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: idGroup
 *       - in: path
 *         name: idUser
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/courses/:idCourse/groups/:idGroup/user-detail/:idUser',
    controller.getUserDetailInGroup,
);

/**
 * @swagger
 * /api/courses/{idCourse}/groups:
 *   post:
 *     summary: Buat kelompok belajar
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kapasitas]
 *             properties:
 *               nama: { type: string }
 *               deskripsi: { type: string }
 *               idMahasiswa:
 *                 type: array
 *                 items: { type: string }
 *               status:
 *                 type: boolean
 *                 description: 0=bisa req join, 1=tidak bisa req
 *               kapasitas: { type: integer }
 *     responses:
 *       201:
 *         description: kelompok berhasil dibuat!
 */
router.post(
    '/courses/:idCourse/groups',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createGroup,
);

/**
 * @swagger
 * /api/courses/{idCourse}/groups/{idGroup}:
 *   put:
 *     summary: Update kelompok belajar
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: idGroup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama: { type: string }
 *               deskripsi: { type: string }
 *               idMahasiswa:
 *                 type: array
 *                 items: { type: string }
 *               status: { type: boolean }
 *               kapasitas: { type: integer }
 *     responses:
 *       200:
 *         description: kelompok berhasil diubah!
 */
router.put(
    '/courses/:idCourse/groups/:idGroup',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateGroup,
);

/**
 * @swagger
 * /api/courses/{idCourse}/groups/{idGroup}:
 *   delete:
 *     summary: Hapus kelompok belajar
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCourse
 *       - in: path
 *         name: idGroup
 *     responses:
 *       200:
 *         description: kelompok berhasil dihapus!
 */
router.delete(
    '/courses/:idCourse/groups/:idGroup',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteGroup,
);

/**
 * @swagger
 * /api/groups/{idGroup}/memberships:
 *   get:
 *     summary: List anggota & request membership di satu group
 *     tags: [Memberships]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idGroup
 *         required: true
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/MembershipList'
 */
router.get(
    '/groups/:idGroup/memberships',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.getMemberships,
);

/**
 * @swagger
 * /api/groups/{idGroup}/memberships/join:
 *   post:
 *     summary: Ajukan join ke kelompok (Mahasiswa)
 *     tags: [Memberships]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idGroup
 *         required: true
 *     responses:
 *       200:
 *         description: pengajuan join terkirim!
 */
router.post(
    '/groups/:idGroup/memberships/join',
    requireRoles('MAHASISWA'),
    controller.joinGroup,
);

/**
 * @swagger
 * /api/groups/{idGroup}/memberships/{idMembership}/approve:
 *   post:
 *     summary: Approve membership
 *     tags: [Memberships]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idGroup
 *       - in: path
 *         name: idMembership
 *     responses:
 *       200:
 *         description: anggota berhasil di-approve!
 */
router.post(
    '/groups/:idGroup/memberships/:idMembership/approve',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.approveMembership,
);

/**
 * @swagger
 * /api/groups/{idGroup}/memberships/{idMembership}/reject:
 *   post:
 *     summary: Reject membership
 *     tags: [Memberships]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idGroup
 *       - in: path
 *         name: idMembership
 *     responses:
 *       200:
 *         description: pengajuan ditolak!
 */
router.post(
    '/groups/:idGroup/memberships/:idMembership/reject',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.rejectMembership,
);

/**
 * @swagger
 * /api/groups/{idGroup}/threads:
 *   get:
 *     summary: List thread dalam satu kelompok
 *     tags: [Threads]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idGroup
 *         required: true
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ThreadSummary'
 */
router.get(
    '/groups/:idGroup/threads',
    controller.getThreadsByGroup,
);

/**
 * @swagger
 * /api/groups/{idGroup}/threads:
 *   post:
 *     summary: Buat thread baru
 *     tags: [Threads]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idGroup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [judul]
 *             properties:
 *               judul: { type: string }
 *               idAssignment: { type: string }
 *     responses:
 *       201:
 *         description: thread dibuat!
 */
router.post(
    '/groups/:idGroup/threads',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.createThread,
);

/**
 * @swagger
 * /api/threads/{idThread}/posts:
 *   get:
 *     summary: List post dalam thread
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idThread
 *         required: true
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 */
router.get(
    '/threads/:idThread/posts',
    controller.getPostsByThread,
);

/**
 * @swagger
 * /api/threads/{idThread}/posts:
 *   post:
 *     summary: Buat post baru (tambahkan poin kontribusi)
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idThread
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [konten]
 *             properties:
 *               konten:
 *                 type: object
 *     responses:
 *       201:
 *         description: post dibuat!
 */
router.post(
    '/threads/:idThread/posts',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.createPost,
);

/**
 * @swagger
 * /api/threads/{idThread}/posts/{idPost}:
 *   put:
 *     summary: Edit post
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idThread
 *       - in: path
 *         name: idPost
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [konten]
 *             properties:
 *               konten:
 *                 type: object
 *     responses:
 *       200:
 *         description: post berhasil diedit!
 */
router.put(
    '/threads/:idThread/posts/:idPost',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.updatePostController,
);

/**
 * @swagger
 * /api/threads/{idThread}/posts/{idPost}:
 *   delete:
 *     summary: Hapus post (kurangi poin kontribusi)
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idThread
 *       - in: path
 *         name: idPost
 *     responses:
 *       200:
 *         description: post berhasil dihapus!
 */
router.delete(
    '/threads/:idThread/posts/:idPost',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.deletePostController,
);

/**
 * @swagger
 * /api/threads/{idThread}/tasks:
 *   get:
 *     summary: List task dalam thread
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idThread
 *         required: true
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/threads/:idThread/tasks',
    controller.getTasksByThread,
);

/**
 * @swagger
 * /api/threads/{idThread}/tasks:
 *   post:
 *     summary: Buat task baru
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idThread
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task, IdMahasiswa, status]
 *             properties:
 *               task: { type: string }
 *               IdMahasiswa:
 *                 type: array
 *                 items: { type: string }
 *               status:
 *                 type: string
 *                 enum: [DO, IN PROGRESS, DONE]
 *     responses:
 *       201:
 *         description: data berhasil ditambah!
 */
router.post(
    '/threads/:idThread/tasks',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.createTask,
);

/**
 * @swagger
 * /api/threads/{idThread}/tasks/{idTask}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idThread
 *       - in: path
 *         name: idTask
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task: { type: string }
 *               IdMahasiswa:
 *                 type: array
 *                 items: { type: string }
 *               status:
 *                 type: string
 *                 enum: [DO, IN PROGRESS, DONE]
 *     responses:
 *       200:
 *         description: task diubah!
 */
router.put(
    '/threads/:idThread/tasks/:idTask',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.updateTaskController,
);

/**
 * @swagger
 * /api/threads/{idThread}/tasks/{idTask}:
 *   delete:
 *     summary: Hapus task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idThread
 *       - in: path
 *         name: idTask
 *     responses:
 *       200:
 *         description: task dihapus!
 */
router.delete(
    '/threads/:idThread/tasks/:idTask',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.deleteTaskController,
);

module.exports = router;
