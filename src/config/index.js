const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please create a .env file based on .env.example');
    process.exit(1);
}

// Validate JWT secret strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long for security');
    process.exit(1);
}

const config = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,

    mongoUri: process.env.MONGO_URI,

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    },

    cors: {
        origins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
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
