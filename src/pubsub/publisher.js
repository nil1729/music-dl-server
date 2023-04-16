const { IP_TRACKER_QUEUE, MAX_RETRY } = require('../../config/env');
const logger = require('../../config/logger');
const connectToRabbitMq = require('../../config/pubsub');

class PublisherService {
  constructor() {
    this.connect();
  }
  async connect() {
    try {
      this.channel = await connectToRabbitMq(IP_TRACKER_QUEUE);
      logger.info('publisher service connected to queue successfully');
    } catch (error) {
      logger.error(`failed to connect publisher service to queue`);
    }
  }
  /**
   *
   * @param {string} ip
   */
  async publishIpLog(ip, url, retryCount = MAX_RETRY) {
    if (retryCount > MAX_RETRY) {
      logger.error(`maximum retry exceeded to publish the client ip: [${ip}]`);
      return;
    }
    const body = { ip: ip, url: url };
    const ack = await this.channel.sendToQueue(IP_TRACKER_QUEUE, Buffer.from(JSON.stringify(body)));
    if (!ack) {
      return this.publishIpLog(ip, url, retryCount + 1);
    }
  }
}

module.exports = new PublisherService();
