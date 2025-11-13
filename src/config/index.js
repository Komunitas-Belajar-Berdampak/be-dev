const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,

    mongoUri:
        process.env.MONGO_URI ||
        'mongodb+srv://Joshua:wreqtyjlh28@websitekomunitasbelajar.pxagysm.mongodb.net/WebsiteKomunitasBelajar',

    jwt: {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    },

    cors: {
        origins: (process.env.CORS_ORIGINS || '*')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    },

    rateLimit: {
        windowMs: Number(process.env.RATE_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.RATE_MAX) || 100,
    },
};

module.exports = config;
