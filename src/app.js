const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('./config');

const { httpLogger } = require('./libs/logger');
const errorHandler = require('./middlewares/error');

const authRoutes = require('./modules/auth/auth.routes');
const rolesRoutes = require('./modules/roles/roles.routes');
const userRoutes = require('./modules/users/user.routes');
const academicTermRoutes = require('./modules/academicTerms/academic-term.routes');
const facultyRoutes = require('./modules/faculties/faculty.routes');
const majorRoutes = require('./modules/majors/major.routes');
const courseRoutes = require('./modules/courses/course.routes');

const app = express();

app.use(httpLogger);

app.use(helmet());
app.use(
    cors({
        origin: config.cors.origins,
    }),
);
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

app.use(
    rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        standardHeaders: true,
        legacyHeaders: false,
    }),
);

app.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'STA backend running',
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic-terms', academicTermRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/courses', courseRoutes);

app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Not Found',
    });
});

app.use(errorHandler);

module.exports = app;