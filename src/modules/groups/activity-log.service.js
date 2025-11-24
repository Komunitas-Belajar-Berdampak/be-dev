const ActivityLog = require('./activity-log.model');

async function logActivity({ aktivitas, idUser, idContribusionThread }) {
    try {
        await ActivityLog.create({
        aktivitas,
        idUser,
        idContribusionThread: idContribusionThread || null,
        });
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

module.exports = {
    logActivity,
};
