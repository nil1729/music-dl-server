const amqp = require('amqplib');
const { RABBIT_MQ_URL } = require('../env');

/**
 *
 * @param  {...string} queueNames
 * @returns
 */
const connect = async (...queueNames) => {
  const connection = await amqp.connect(RABBIT_MQ_URL);
  const channel = await connection.createChannel();
  for (let i = 0; i < queueNames.length; i++) {
    await channel.assertQueue(queueNames[i]);
  }
  return channel;
};

module.exports = connect;
