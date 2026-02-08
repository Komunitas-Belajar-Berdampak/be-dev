const mongoose = require('mongoose');
const config = require('./index');
const { logger } = require('../libs/logger');

mongoose.set('strictQuery', true);

// Listen to index creation events (for monitoring)
mongoose.connection.on('index', (model) => {
    logger.info(`Index built for model: ${model}`);
});

mongoose.connection.on('error', (err) => {
    if (err.code === 11000) {
        logger.warn('Duplicate key error - index might already exist');
    }
});

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info({ uri: config.mongoUri }, 'MongoDB connected');
    } catch (err) {
        logger.error({ err }, 'MongoDB connection error');
        throw err;
    }
};

module.exports = { connectDB };
