/*jshint esversion: 11 */

const ErrorResponse = require('../../utils/ErrorResponse.class');
const SuccessResponse = require('../../utils/SuccessResponse.class');
const ErrorMessage = require('../../utils/ErrorMessage.enum.json');
const validator = require('validator');
const {
  getProcessedSpotifyLink,
  getSpotifyResourceType,
  getResourceMetadata,
  getResourceId,
  getArtistMetadata,
  getAlbumMetadata,
  getAlbumTracksMeta,
  getTrackMetadata,
} = require('../spotify');
const { SPOTIFY_RESOURCE_TYPE } = require('../../../../config/spotify/constant');
const LocalTrack = require('../../model/Track');
const LocalArtist = require('../../model/Artist');
const LocalAlbum = require('../../model/Album');
const LocalAlbumTrackMap = require('../../model/AlbumTrack');
const logger = require('../../../../config/logger');
const { MAX_RETRY: MAX_RETRY_FOR_SAVING } = require('../../../../config/env');
const { getLocalMetadata } = require('../metadata');
const {
  getYtSearchResults,
  getYtMp4Cdn,
  downloadFromUrl,
  convertMp4ToMp3,
} = require('../../../downloader');

/**
 *
 * @param {string} trackId
 * @returns
 */
async function getTrackCDN(trackId) {
  const trackDoc = await getLocalMetadata(SPOTIFY_RESOURCE_TYPE.TRACK, trackId);
  if (!trackDoc) {
    throw new ErrorResponse(ErrorMessage.service_unavailable, 503);
  }
  if (trackDoc.music_dl_downloaded) {
    return trackDoc.music_dl_cdn;
  }
  return downloadAndSendCDN(trackDoc);
}

async function downloadAndSendCDN(track) {
  const searchKeyword = `${track.name} ${track.artists[0].name}`;
  const maxDuration = track.duration + 60 * 1000;
  const results = await getYtSearchResults(searchKeyword, maxDuration);
  if (results.length === 0) {
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  const mp4CDN = await getYtMp4Cdn(results[0].url);
  if (!mp4CDN) {
    logger.warn(`cdn not found for track [${track.track_id}] and YT [${results[0].url}]`);
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  const mp4FilePath = await downloadFromUrl(mp4CDN, '.mp4');
  if (!mp4FilePath) {
    logger.warn(`mp4 download failed track [${track.track_id}] and YT [${results[0].url}]`);
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  const mp3FilePath = await convertMp4ToMp3(mp4FilePath);
  saveMp3File(track, mp3FilePath);
  return buildLocalDownloadUrl(mp3FilePath);
}

/**
 *
 * @param {object} track
 * @param {string} filePath
 */
function saveMp3File(track, filePath) {}

function buildLocalDownloadUrl(filePath) {}

module.exports = { getTrackCDN };
