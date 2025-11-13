const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const { logger } = require('./libs/logger');
const { connectDB } = require('./config/mongoose');

require('./modules/majors/major.model');

const server = http.createServer(app);

const start = async () => {
    try {
        await connectDB();

        server.listen(config.port, () => {
        logger.info({ port: config.port }, 'Server listening');
        });
    } catch (err) {
        logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
};

start();

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down');
    server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'Unhandled promise rejection');
});