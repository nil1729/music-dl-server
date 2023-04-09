/*jshint esversion: 11 */

const { getSpotifyApiClient } = require('../../../../config/spotify');
const {
  SPOTIFY_SHORT_LINK_DOMAIN,
  SPOTIFY_STANDARD_LINK_DOMAIN,
  SPOTIFY_RESOURCE_TYPE,
} = require('../../../../config/spotify/config');
const ErrorResponse = require('../../utils/ErrorResponse.class');
const ErrorMessage = require('../../utils/ErrorMessage.enum.json');
const validator = require('validator');
const { getAxiosResponse } = require('../../utils/Axios');
const extractUrls = require('extract-urls');

async function getTrackMetadata(trackId) {
  try {
    const track = await getSpotifyApiClient().getTrack(trackId);
    console.dir(track, null);
    return track.body;
  } catch (error) {
    console.log(error);
  }
}

/**
 *
 * @param {string} url
 * @returns
 */
async function getProcessedSpotifyLink(url) {
  if (validator.isURL(url, { host_whitelist: [SPOTIFY_SHORT_LINK_DOMAIN] })) {
    return getStandardLink(url);
  } else if (validator.isURL(url, { host_whitelist: [SPOTIFY_STANDARD_LINK_DOMAIN] })) {
    return removeQueryStringAndHash(url);
  }
  throw new ErrorResponse(ErrorMessage.invalid_url, 400);
}

/**
 *
 * @param {string} shortLink
 */
async function getStandardLink(shortLink) {
  const responseText = await getAxiosResponse(shortLink, 'text', 100000);
  const embeddedUrls = extractUrls(responseText);
  const queryFreeLinks = embeddedUrls.map((t) => removeQueryStringAndHash(t));
  const standardLinks = queryFreeLinks.filter((t) => t.includes(SPOTIFY_STANDARD_LINK_DOMAIN));
  if (standardLinks.length === 0) throw new ErrorResponse(ErrorMessage.link_processing_failed, 503);
  return standardLinks[0];
}

/**
 *
 * @param {string} standardLink
 */
function getSpotifyResourceType(standardLink) {
  const validResourceType = Object.keys(SPOTIFY_RESOURCE_TYPE).find((key) =>
    standardLink.includes(SPOTIFY_RESOURCE_TYPE[key])
  );
  if (!validResourceType) {
    throw new ErrorResponse(ErrorMessage.unsupported_resource, 400);
  }
  return SPOTIFY_RESOURCE_TYPE[validResourceType];
}

/**
 *
 * @param {string} resourceType
 * @param {string} url
 */
async function getResourceMetadata(resourceType, url) {
  const resourceId = getResourceId(resourceType, url);
  if (SPOTIFY_RESOURCE_TYPE.TRACK === resourceType) {
    const metadata = await getTrackMetadata(resourceId);
  } else if (SPOTIFY_RESOURCE_TYPE.ALBUM === resourceType) {
  } else if (SPOTIFY_RESOURCE_TYPE.PLAYLIST === resourceType) {
  }
  return null;
}

function removeQueryStringAndHash(url) {
  const urlObj = new URL(url);
  urlObj.search = '';
  urlObj.hash = '';
  return urlObj.toString();
}

function getResourceId(resourceType, url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname.toString();
  const resourceId = pathname
    .replace(new RegExp('\\b' + resourceType + '\\b', 'gi'), '')
    .replace(/\//g, '');
  return resourceId;
}

module.exports = { getProcessedSpotifyLink, getResourceMetadata, getSpotifyResourceType };
