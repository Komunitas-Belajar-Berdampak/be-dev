class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

const successResponse = (res, { statusCode = 200, message = 'OK', data }) => {
    const payload = {
        status: 'success',
        message,
    };

    if (data !== undefined) {
        payload.data = data;
    }

    return res.status(statusCode).json(payload);
};

const errorResponse = (res, { statusCode = 500, message, details }) => {
    const payload = {
        status: 'error',
        message,
    };

    if (details) {
        payload.details = details;
    }

    return res.status(statusCode).json(payload);
};

module.exports = {
    ApiError,
    successResponse,
    errorResponse,
};
