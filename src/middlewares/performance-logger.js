/**
 * Performance logging middleware
 * Logs the response time for each API request
 */

const { logger } = require('../libs/logger');

const performanceLogger = (req, res, next) => {
  const start = Date.now();

  // Capture when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;

    let performance;
    if (duration < 100) {
      performance = 'EXCELLENT';
    } else if (duration < 300) {
      performance = 'GOOD';
    } else if (duration < 1000) {
      performance = 'OK';
    } else {
      performance = 'SLOW';
    }

    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${duration}ms`,
      performance: performance
    }, `[${performance}] ${req.method} ${req.originalUrl} - ${duration}ms`);
  });

  next();
};

module.exports = performanceLogger;
