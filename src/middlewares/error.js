const { ApiError, errorResponse } = require('../utils/http');
const { logger } = require('../libs/logger');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return res.end();
    }

    if (err instanceof ApiError) {
        return errorResponse(res, {
        statusCode: err.statusCode,
        message: err.message,
        details: err.details,
        });
    }

    logger.error({ err }, 'Unhandled error');

    return errorResponse(res, {
        statusCode: 500,
        message: 'Internal server error',
    });
};

module.exports = errorHandler;
