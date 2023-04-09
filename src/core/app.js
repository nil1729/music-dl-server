const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/request/errorHandler');
const connectDatabase = require('../../config/db');
const logger = require('../../config/logger');
const { PORT, NODE_ENV } = require('./env');

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

// Use Routes in app
app.use('/api', apiRoutes);

// Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDatabase();
  logger.info(`core service running in ${NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
