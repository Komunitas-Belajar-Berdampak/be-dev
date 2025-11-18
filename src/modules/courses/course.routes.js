const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./course.controller');

const router = express.Router();

router.use(auth);

router.get('/', controller.getCourses);
router.get('/:id', controller.getCourseById);

router.post(
    '/',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createCourse,
);
router.put(
    '/:id',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateCourse,
);
router.patch(
    '/:id',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.patchDeskripsi,
);
router.delete(
    '/:id',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteCourse,
);

router.get('/:idCourse/meetings', controller.getMeetings);
router.get(
    '/:idCourse/meetings/:pertemuan',
    controller.getMeetingDetail,
);
router.put(
    '/:idCourse/meetings/:pertemuan',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.putMeeting,
);

router.get(
    '/:idCourse/meetings/materials',
    controller.getAllMaterialsByCourse,
);
router.get(
    '/:idCourse/meetings/:pertemuan/materials',
    controller.getMaterialsByMeeting,
);
router.get(
    '/:idCourse/meetings/:pertemuan/materials/:idMaterial',
    controller.getMaterialDetail,
);
router.post(
    '/:idCourse/meetings/:pertemuan/materials',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.createMaterial,
);
router.put(
    '/:idCourse/meetings/:pertemuan/materials/:idMaterial',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.updateMaterial,
);
router.delete(
    '/:idCourse/meetings/:pertemuan/materials/:idMaterial',
    requireRoles('SUPER_ADMIN', 'DOSEN'),
    controller.deleteMaterial,
);

module.exports = router;
