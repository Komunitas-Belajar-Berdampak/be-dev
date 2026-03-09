const express = require('express');
const auth = require('../../middlewares/auth');
const requireRoles = require('../../middlewares/rbac');
const controller = require('./course-dashboard.controller');

const router = express.Router();

router.use(auth, requireRoles('DOSEN', 'SUPER_ADMIN'));

router.get('/:idCourse', controller.getCourseDashboard);
router.get('/:idCourse/pertemuan/:pertemuan', controller.getMeetingDashboard);

module.exports = router;