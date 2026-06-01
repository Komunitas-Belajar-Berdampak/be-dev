const { successResponse } = require('../../utils/http');
const service = require('./notification.service');

const getNotifications = async (req, res, next) => {
    try {
        const data = await service.listNotifications(req.user.sub, req.query);
        return successResponse(res, { message: 'data berhasil diambil!', data });
    } catch (err) {
        return next(err);
    }
};

const getUnreadCount = async (req, res, next) => {
    try {
        const data = await service.getUnreadCount(req.user.sub);
        return successResponse(res, { message: 'data berhasil diambil!', data });
    } catch (err) {
        return next(err);
    }
};

const getNotificationById = async (req, res, next) => {
    try {
        const data = await service.getNotificationById(req.params.id, req.user.sub);
        return successResponse(res, { message: 'data berhasil diambil!', data });
    } catch (err) {
        return next(err);
    }
};

const markRead = async (req, res, next) => {
    try {
        const data = await service.markRead(req.params.id, req.user.sub);
        return successResponse(res, { message: 'notifikasi ditandai dibaca!', data });
    } catch (err) {
        return next(err);
    }
};

const markAllRead = async (req, res, next) => {
    try {
        const data = await service.markAllRead(req.user.sub);
        return successResponse(res, { message: 'semua notifikasi ditandai dibaca!', data });
    } catch (err) {
        return next(err);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        await service.deleteNotification(req.params.id, req.user.sub);
        return successResponse(res, { message: 'notifikasi dihapus!' });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    getNotificationById,
    markRead,
    markAllRead,
    deleteNotification,
};
