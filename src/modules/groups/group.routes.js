const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./group.controller');

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * /api/sg/course/{idCourse}:
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
router.get('/sg/course/:idCourse', controller.getGroupsByCourse);

/**
 * @swagger
 * /api/sg/group/{id}:
 *   get:
 *     summary: Detail kelompok belajar
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                   $ref: '#/components/schemas/StudyGroupDetail'
 */
router.get('/sg/group/:id', controller.getGroupDetail);

/**
 * @swagger
 * /api/sg/{id}/user-detail/{idUser}:
 *   get:
 *     summary: Detail kontribusi & aktivitas 1 mahasiswa dalam 1 kelompok
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: idUser
 *         required: true
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/sg/:id/user-detail/:idUser',
    controller.getUserDetailInGroup,
);

/**
 * @swagger
 * /api/sg/{idCourse}:
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
    '/sg/:idCourse',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createGroup,
);

/**
 * @swagger
 * /api/sg/{id}:
 *   put:
 *     summary: Update kelompok belajar
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
    '/sg/:id',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateGroup,
);

/**
 * @swagger
 * /api/sg/{id}:
 *   delete:
 *     summary: Hapus kelompok belajar
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: kelompok berhasil dihapus!
 */
router.delete(
    '/sg/:id',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteGroup,
);

/**
 * @swagger
 * /api/memberships/{idStudyGroup}:
 *   get:
 *     summary: List anggota & request membership di satu group
 *     tags: [Memberships]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idStudyGroup
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
    '/memberships/:idStudyGroup',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.getMemberships,
);

/**
 * @swagger
 * /api/memberships/{idStudyGroup}/join:
 *   post:
 *     summary: Ajukan join ke kelompok (Mahasiswa)
 *     tags: [Memberships]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idStudyGroup
 *         required: true
 *     responses:
 *       200:
 *         description: pengajuan join terkirim!
 */
router.post(
    '/memberships/:idStudyGroup/join',
    requireRoles('MAHASISWA'),
    controller.joinGroup,
);

/**
 * @swagger
 * /api/memberships/{idMembership}/sg/{idStudyGroup}/approve:
 *   post:
 *     summary: Approve membership
 *     tags: [Memberships]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idMembership
 *         required: true
 *       - in: path
 *         name: idStudyGroup
 *         required: true
 *     responses:
 *       200:
 *         description: anggota berhasil di-approve!
 */
router.post(
    '/memberships/:idMembership/sg/:idStudyGroup/approve',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.approveMembership,
);

/**
 * @swagger
 * /api/memberships/{idMembership}/sg/{idStudyGroup}/reject:
 *   post:
 *     summary: Reject membership
 *     tags: [Memberships]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idMembership
 *         required: true
 *       - in: path
 *         name: idStudyGroup
 *         required: true
 *     responses:
 *       200:
 *         description: pengajuan ditolak!
 */
router.post(
    '/memberships/:idMembership/sg/:idStudyGroup/reject',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.rejectMembership,
);

/**
 * @swagger
 * /api/threads/{id}:
 *   get:
 *     summary: List threads in study group OR list posts in thread
 *     tags: [Threads, Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Study Group ID or Thread ID
 *     responses:
 *       200:
 *         description: data berhasil diambil!
 */
router.get(
    '/threads/:id',
    controller.getThreadsOrPosts,
);

/**
 * @swagger
 * /api/threads/{id}:
 *   post:
 *     summary: Create thread in study group OR create post in thread
 *     tags: [Threads, Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Study Group ID or Thread ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [judul]
 *                 properties:
 *                   judul: { type: string }
 *                   idAssignment: { type: string }
 *               - type: object
 *                 required: [konten]
 *                 properties:
 *                   konten: { type: object }
 *     responses:
 *       201:
 *         description: thread dibuat! OR post dibuat!
 */
router.post(
    '/threads/:id',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.createThreadOrPost,
);

/**
 * @swagger
 * /api/posts/{idPost}:
 *   put:
 *     summary: Edit post
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPost
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
 *       200:
 *         description: post berhasil diedit!
 */
router.put(
    '/posts/:idPost',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.updatePostController,
);

/**
 * @swagger
 * /api/posts/{idPost}:
 *   delete:
 *     summary: Hapus post (kurangi poin kontribusi)
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPost
 *         required: true
 *     responses:
 *       200:
 *         description: post berhasil dihapus!
 */
router.delete(
    '/posts/:idPost',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.deletePostController,
);

/**
 * @swagger
 * /api/tasks/{idThread}:
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
    '/tasks/:idThread',
    controller.getTasksByThread,
);

/**
 * @swagger
 * /api/tasks/{idThread}:
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
    '/tasks/:idThread',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.createTask,
);

/**
 * @swagger
 * /api/tasks/{idTasks}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idTasks
 *         required: true
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
    '/tasks/:idTasks',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.updateTaskController,
);

/**
 * @swagger
 * /api/tasks/{idTasks}:
 *   delete:
 *     summary: Hapus task
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idTasks
 *         required: true
 *     responses:
 *       200:
 *         description: task dihapus!
 */
router.delete(
    '/tasks/:idTasks',
    requireRoles('MAHASISWA', 'DOSEN', 'SUPER_ADMIN'),
    controller.deleteTaskController,
);

module.exports = router;
