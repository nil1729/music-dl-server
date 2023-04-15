const { IP_TRACKER_QUEUE, CONSUMER_SLEEP_DURATION } = require('../../config/env');
const logger = require('../../config/logger');
const connectToRabbitMq = require('../../config/pubsub');
const { saveIpLog } = require('../core/service/ipTracker');

class SubscriberService {
  async connect() {
    try {
      this.channel = await connectToRabbitMq(IP_TRACKER_QUEUE);
      logger.info('subscriber service connected to queue successfully');
    } catch (error) {
      logger.error(`failed to connect subscriber service to queue`);
    }
  }

  async processIp() {
    await this.connect();
    this.channel.qos(1);
    this.channel.consume(IP_TRACKER_QUEUE, this.ipMessageConsumer(this), { noAck: false });
  }

  ipMessageConsumer(cls) {
    return async function (message) {
      const messageString = message.content.toString();
      try {
        const ipJson = JSON.parse(messageString);
        await saveIpLog(ipJson);
        await cls.sleep();
        cls.channel.ack(message);
      } catch (e) {
        logger.error(`consumer service failed to process message : [${messageString}]`);
      }
    };
  }

  async sleep() {
    logger.info(`consumer service sleeping for ${CONSUMER_SLEEP_DURATION} ms`);
    return new Promise((resolve) => setTimeout(resolve, CONSUMER_SLEEP_DURATION));
  }
}

module.exports = new SubscriberService();
