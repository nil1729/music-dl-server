const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const responseTime = require('response-time');
const xss = require('xss-clean');
const hpp = require('hpp');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/request/errorHandler');
const connectDatabase = require('../../config/db');
const logger = require('../../config/logger');
const { CORE_SERVICE_PORT: PORT, NODE_ENV } = require('../../config/env');
const { initAccessTokenReloader } = require('../../config/spotify');

// Initialize App
const app = express();

// Prevent Http Params Pollution
app.use(morgan('common'));

// Body Parser Setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// To remove data, use:
app.use(mongoSanitize());

// Remove XSS
app.use(xss());

// Prevent Http Params Pollution
app.use(hpp());

// response time header
app.use(responseTime());

// Use Routes in app
app.use('/api', apiRoutes);

// Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDatabase();
  logger.info(`core service running in ${NODE_ENV} mode on port ${PORT}`);
  initAccessTokenReloader();
});

module.exports = app;
