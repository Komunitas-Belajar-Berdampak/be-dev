const ActivityLog = require('./activity-log.model');

async function logActivity({ aktivitas, idUser, idContribusionThread, kontribusi = 0 }) {
    try {
        await ActivityLog.create({
        aktivitas,
        idUser,
        idContribusionThread: idContribusionThread || null,
        kontribusi,
        });
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

module.exports = {
    logActivity,
};
