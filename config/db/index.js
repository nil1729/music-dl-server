const logger = require('../logger');
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const connect = () => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.MUSIC_DL_PRIMARY_DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(function (conn) {
        logger.info(`database connected (${conn.connection.name}): ${conn.connection.host}`);
        resolve(conn);
      })
      .catch(function (e) {
        logger.error('error connecting to database', e);
        reject(e);
      });
  });
};

module.exports = connect;
