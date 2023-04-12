const Redis = require('redis');
const logger = require('../logger');

const RedisClient = Redis.createClient();

RedisClient.on('error', function (err) {
  console.debug(err);
  logger.error('error connection to redis instance ');
});

module.exports = RedisClient;
