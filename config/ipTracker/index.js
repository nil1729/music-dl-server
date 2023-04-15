const { IP_INFO_API_BASE_URL, CACHE_KEY_PREFIX } = require('../env');
const logger = require('../logger');
const MusicDlCache = require('../cache');
const { getAxiosResponse } = require('../axios');

class IpTracker {
  constructor() {
    this.baseUrl = IP_INFO_API_BASE_URL;
  }

  async getInfo(ip) {
    const cachedData = await this.getDataFromCache(ip);
    if (cachedData) {
      return this.sendResponse(ip);
    }
    return this.getFromProvider(ip);
  }

  getCacheKey(ip) {
    return CACHE_KEY_PREFIX.IP_TRACKER + ip;
  }

  getApiUrl(ip) {
    return [this.baseUrl, ip].join('/');
  }

  async getDataFromCache(ip) {
    logger.info(`getting ip information from cache [${ip}]`);
    return MusicDlCache.getCache(this.getCacheKey(ip));
  }

  async getFromProvider() {
    logger.info(`getting ip information from provider [${ip}]`);
    const responseData = await getAxiosResponse(this.getApiUrl(ip));
    this.saveDataOnCache(ip, responseData);
    return this.sendResponse(responseData);
  }

  /**
   *
   * @param {object} data
   * @returns {body: object}
   */
  sendResponse(data) {
    return { body: data };
  }

  /**
   *
   * @param {string} apiRoute
   * @param {object} data
   */
  async saveDataOnCache(ip, data) {
    MusicDlCache.setCache(this.getCacheKey(ip), data);
  }
}

module.exports = new IpTracker();
