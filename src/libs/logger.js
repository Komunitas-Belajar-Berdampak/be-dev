const pino = require('pino');
const pinoHttp = require('pino-http');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDev
        ? {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
        }
        : undefined,
});

const httpLogger = pinoHttp({ logger });

module.exports = { logger, httpLogger };
