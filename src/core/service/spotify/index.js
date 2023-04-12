/*jshint esversion: 11 */

const { getSpotifyApiClient } = require('../../../../config/spotify');
const {
  SPOTIFY_SHORT_LINK_DOMAIN,
  SPOTIFY_STANDARD_LINK_DOMAIN,
  SPOTIFY_RESOURCE_TYPE,
  SPOTIFY_TRACK_FETCH_LIMIT,
} = require('../../../../config/spotify/constant');
const ErrorResponse = require('../../utils/ErrorResponse.class');
const ErrorMessage = require('../../utils/ErrorMessage.enum.json');
const validator = require('validator');
const { getAxiosResponse } = require('../../../../config/axios');
const extractUrls = require('extract-urls');
const logger = require('../../../../config/logger');
const { MAX_TRACK_ALLOWED_FOR_PLAYLIST } = require('../../../../config/env');

async function getTrackMetadata(trackId) {
  try {
    logger.info(`getting track metadata of track id: [${trackId}]`);
    const response = await getSpotifyApiClient().getTrack(trackId);
    return response.body;
  } catch (e) {
    console.log(e);
    throw new ErrorResponse(ErrorMessage.link_processing_failed, 506);
  }
}

async function getAlbumMetadata(albumId) {
  try {
    logger.info(`getting album metadata of album id: [${albumId}]`);
    const response = await getSpotifyApiClient().getAlbum(albumId);
    return response.body;
  } catch (e) {
    throw new ErrorResponse(ErrorMessage.link_processing_failed, 506);
  }
}

async function getAlbumTracksMeta(albumId, totalCount, startOffset = 0) {
  try {
    logger.info(`getting album tracks metadata of album id: [${albumId}]`);
    let offset = startOffset;
    let iterationCount = Math.ceil((totalCount - offset) / SPOTIFY_TRACK_FETCH_LIMIT);
    const tracks = [];
    do {
      logger.info(
        `getting album tracks metadata of album id: [${albumId}] | iteration: [${iterationCount}]`
      );
      const response = await getSpotifyApiClient().getAlbumTracks(albumId, {
        offset: offset,
        limit: SPOTIFY_TRACK_FETCH_LIMIT,
      });
      tracks.push(...response.body.items);
      iterationCount--;
      offset += SPOTIFY_TRACK_FETCH_LIMIT;
    } while (iterationCount > 0);
    return tracks;
  } catch (e) {
    throw new ErrorResponse(ErrorMessage.link_processing_failed, 506);
  }
}

async function getPlaylistMetadata(playlistId) {
  try {
    logger.info(`getting playlist metadata of playlist id: [${playlistId}]`);
    const response = await getSpotifyApiClient().getPlaylist(playlistId);
    return response.body;
  } catch (e) {
    throw new ErrorResponse(ErrorMessage.link_processing_failed, 506);
  }
}

async function getPlaylistTracksMeta(playlistId, totalCount, startOffset = 0) {
  try {
    logger.info(`getting playlist tracks metadata of playlist id: [${playlistId}]`);
    let offset = startOffset;
    let iterationCount = Math.ceil((totalCount - offset) / SPOTIFY_TRACK_FETCH_LIMIT);
    const tracks = [];
    do {
      logger.info(
        `getting playlist tracks metadata of playlist id: [${playlistId}] | iteration: [${iterationCount}]`
      );
      const response = await getSpotifyApiClient().getPlaylistTracks(playlistId, {
        offset: offset,
        limit: SPOTIFY_TRACK_FETCH_LIMIT,
      });
      tracks.push(...response.body.items);
      iterationCount--;
      offset += SPOTIFY_TRACK_FETCH_LIMIT;
    } while (iterationCount > 0);
    return tracks;
  } catch (e) {
    throw new ErrorResponse(ErrorMessage.link_processing_failed, 506);
  }
}

async function getArtistMetadata(artistId) {
  try {
    logger.info(`getting artist metadata of artist id: [${artistId}]`);
    const response = await getSpotifyApiClient().getArtist(artistId);
    return response.body;
  } catch (e) {
    throw new ErrorResponse(ErrorMessage.service_unavailable, 503);
  }
}

/**
 *
 * @param {string} url
 * @returns
 */
async function getProcessedSpotifyLink(url) {
  logger.info(`processing spotify link [${url}]`);
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
  logger.info(`finding standard spotify url for short link [${shortLink}]`);
  const responseText = await getAxiosResponse(shortLink, 'text', 100000);
  const embeddedUrls = extractUrls(responseText);
  const queryFreeLinks = embeddedUrls.map((t) => removeQueryStringAndHash(t));
  const standardLinks = queryFreeLinks.filter((t) => t.includes(SPOTIFY_STANDARD_LINK_DOMAIN));
  if (standardLinks.length === 0) throw new ErrorResponse(ErrorMessage.link_processing_failed, 506);
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
async function getResourceMetadata(resourceType, resourceId) {
  if (SPOTIFY_RESOURCE_TYPE.TRACK === resourceType) {
    return getTrackMetadata(resourceId);
  } else if (SPOTIFY_RESOURCE_TYPE.ALBUM === resourceType) {
    const albumMeta = await getAlbumMetadata(resourceId);
    if (albumMeta.tracks.total > albumMeta.tracks.limit) {
      const remainingTracks = await getAlbumTracksMeta(
        resourceId,
        albumMeta.tracks.total,
        albumMeta.tracks.limit
      );
      albumMeta.tracks.items = albumMeta.tracks.items.concat(remainingTracks);
      albumMeta.tracks.limit = albumMeta.tracks.total;
    }
    return albumMeta;
  } else if (SPOTIFY_RESOURCE_TYPE.PLAYLIST === resourceType) {
    const playlistMeta = await getPlaylistMetadata(resourceId);
    if (playlistMeta.tracks.total > playlistMeta.tracks.limit) {
      const totalCount =
        playlistMeta.tracks.total > MAX_TRACK_ALLOWED_FOR_PLAYLIST
          ? MAX_TRACK_ALLOWED_FOR_PLAYLIST
          : playlistMeta.tracks.total;
      const remainingTracks = await getPlaylistTracksMeta(
        resourceId,
        totalCount,
        playlistMeta.tracks.limit
      );
      playlistMeta.tracks.items = playlistMeta.tracks.items.concat(remainingTracks);
      playlistMeta.tracks.limit = playlistMeta.tracks.total;
    }
    return playlistMeta;
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

module.exports = {
  getProcessedSpotifyLink,
  getResourceMetadata,
  getSpotifyResourceType,
  getResourceId,
  getArtistMetadata,
  getAlbumMetadata,
  getAlbumTracksMeta,
  getTrackMetadata,
};
