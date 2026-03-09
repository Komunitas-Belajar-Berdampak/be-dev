const multer = require('multer');
const { ApiError } = require('../utils/http');

const storage = multer.memoryStorage();

/**
 * Creates a multer middleware for a single file field.
 * @param {string} fieldName - form field name for the file
 * @param {object} options
 * @param {number} options.maxSizeMB - max file size in MB (default 50)
 * @param {boolean} options.required - whether file is required (default true)
 */
const createUpload = (fieldName = 'file', options = {}) => {
    const { maxSizeMB = 50, required = true } = options;

    const instance = multer({
        storage,
        limits: { fileSize: maxSizeMB * 1024 * 1024 },
    });

    const single = instance.single(fieldName);

    return (req, res, next) => {
        single(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ApiError(400, `Ukuran file melebihi batas maksimal ${maxSizeMB}MB`));
                }
                return next(new ApiError(400, err.message));
            }

            if (required && !req.file) {
                return next(new ApiError(400, 'File wajib disertakan'));
            }

            next();
        });
    };
};

module.exports = { createUpload };
