const Redis = require("redis");
const logger = require("../logger");
const { REDIS_URL } = require("../env");

const RedisClient = Redis.createClient({
  url: REDIS_URL,
});

RedisClient.on("error", function (err) {
  console.debug(err);
  logger.error("error connection to redis instance ");
});

module.exports = RedisClient;
