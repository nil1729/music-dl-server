const logger = require('../../../../config/logger');
const PublisherService = require('../../../pubsub/publisher');

/**
 *
 * @param {object} request
 */
async function trackIp(request) {
  // running nginx as reverse proxy
  const clientIp = request.headers['x-forwarded-for'];
  await PublisherService.publishIp(clientIp);
  logger.info(`client ip: [${clientIp}] published successfully`);
}

module.exports = { trackIp };
