const logger = require('../../../../config/logger');
const PublisherService = require('../../../pubsub/publisher');
const IpTrace = require('../../model/IpTrace');
const IpTracker = require('../../../../config/ipTracker');
const IpTraceUrlMap = require('../../model/IpTraceUrlMap');
const {
  IP_TRACKING_SERVICE_STATUS,
  IP_TRACKING_RUNNING_STATUS,
} = require('../../../../config/env');

/**
 *
 * @param {object} request
 */
async function trackIp(request) {
  if (IP_TRACKING_RUNNING_STATUS === IP_TRACKING_SERVICE_STATUS.RUNNING) {
    // running nginx as reverse proxy
    const clientIp = request.headers['x-forwarded-for'];
    const existingIpTrace = await getIpTrace(clientIp);
    if (existingIpTrace) {
      return saveIpLog(existingIpTrace._id, request.originalUrl);
    }
    publishIpLog(clientIp, request.originalUrl);
  }
}

async function publishIpLog(ip, urlPath) {
  await PublisherService.publishIpLog(ip, urlPath);
  logger.info(`client ip: [${ip}] published successfully`);
}

async function getIpTrace(ip) {
  const ipTrace = await IpTrace.findOne({ ip: ip });
  return ipTrace;
}

async function saveIpTrace(ip) {
  logger.info(`saving ip [${ip}] trace into database`);
  try {
    const existingIpTrace = await getIpTrace(ip);
    if (existingIpTrace) {
      return existingIpTrace._id;
    }
    const response = await IpTracker.getInfo(ip);
    const ipTraceDoc = {
      ip: ip,
      coordinates: {
        lat: response.body.lat,
        lng: response.body.lng,
      },
      country: response.body.country,
      country_code: response.body.country_code,
      region: response.body.region,
      region_code: response.body.region_code,
      isp: response.body.isp,
      timezone: response.body.timezone,
    };
    const savedDoc = await IpTrace.create(ipTraceDoc);
    return savedDoc.id;
  } catch (e) {
    console.debug(e);
    logger.error(`failed to save ip trace for client ip: [${ip}]`);
  }
}

async function saveIpLog(ipTraceId, urlPath) {
  logger.info(`saving ip trace id [${ipTraceId}] trace and url [${urlPath}] map into database`);
  try {
    const ipTraceUrlMapDoc = { ip_trace_id: ipTraceId, url: urlPath };
    const existingIpTraceUrlMap = await IpTraceUrlMap.findOne(ipTraceUrlMapDoc);
    if (existingIpTraceUrlMap) {
      await IpTraceUrlMap.updateOne(
        { _id: existingIpTraceUrlMap._id },
        { $set: { request_count: existingIpTraceUrlMap.request_count + 1 } }
      );
      return existingIpTraceUrlMap._id;
    }
    const savedDoc = await IpTraceUrlMap.create(ipTraceUrlMapDoc);
    return savedDoc.id;
  } catch (e) {
    console.debug(e);
    logger.error(
      `failed to save ip trace map for client ip trace id: [${ipTraceId}] and url [${urlPath}]`
    );
  }
}

module.exports = { trackIp, saveIpLog, saveIpTrace };
