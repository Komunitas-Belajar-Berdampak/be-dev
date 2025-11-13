const { ApiError } = require('../utils/http');

const validate = (schema, property = 'body') => (req, res, next) => {
    const data = req[property];

    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const messages = error.details.map((d) => d.message);
        return next(new ApiError(400, messages[0], messages));
    }

    req[property] = value;
    return next();
};

module.exports = validate;