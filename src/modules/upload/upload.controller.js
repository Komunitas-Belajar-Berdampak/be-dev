const { successResponse } = require('../../utils/http');
const uploadService = require('./upload.service');

const presign = async (req, res, next) => {
    try {
        const data = await uploadService.generatePresignedUpload(req.body);
        return successResponse(res, {
            statusCode: 201,
            message: 'presigned URL berhasil dibuat!',
            data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = { presign };
