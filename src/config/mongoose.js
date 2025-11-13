const mongoose = require('mongoose');
const config = require('./index');
const { logger } = require('../libs/logger');

mongoose.set('strictQuery', true);

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
