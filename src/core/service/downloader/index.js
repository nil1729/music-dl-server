/*jshint esversion: 11 */

const ErrorResponse = require('../../utils/ErrorResponse.class');
const ErrorMessage = require('../../utils/ErrorMessage.enum.json');
const { SPOTIFY_RESOURCE_TYPE } = require('../../../../config/spotify/constant');
const LocalTrack = require('../../model/Track');
const logger = require('../../../../config/logger');
const { MAX_RETRY: MAX_RETRY_FOR_SAVING, MUSIC_DL_CDN_HOST } = require('../../../../config/env');
const { getLocalMetadata } = require('../metadata');
const {
  getYtSearchResults,
  getYtMp4Cdn,
  downloadFromUrl,
  convertMp4ToMp3,
  uploadToMusicDlStorage,
} = require('../../../downloader');
const Path = require('path');

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
    logger.warn(`mp4 download failed for track [${track.track_id}] and YT [${results[0].url}]`);
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  const mp3FilePath = await convertMp4ToMp3(mp4FilePath);
  if (!mp3FilePath) {
    logger.warn(`mp3 conversion failed for track [${track.track_id}] and YT [${results[0].url}]`);
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  saveMp3File(track, mp3FilePath);
  return buildLocalDownloadUrl(mp3FilePath);
}

/**
 *
 * @param {object} track
 * @param {string} filePath
 */
async function saveMp3File(track, filePath, retryCount = MAX_RETRY_FOR_SAVING) {
  if (retryCount > MAX_RETRY_FOR_SAVING) {
    logger.warn(
      `max retry count exceeded for uploading mp3 for track [${track.track_id}] | file location: [${filePath}]`
    );
    return;
  }
  try {
    logger.info(`saving mp3 file for track [${track.track_id}] at location [${filePath}]`);
    const { cdnUrl, apiUrl, viewUrl, fileId } = await uploadToMusicDlStorage(
      track.track_id,
      filePath
    );
    const updatedDoc = {
      music_dl_downloaded: true,
      music_dl_cdn: cdnUrl,
      music_dl_storage_meta: {
        view_url: viewUrl,
        api_url: apiUrl,
        local_id: fileId,
      },
    };
    await LocalTrack.updateOne({ _id: track._id }, { $set: updatedDoc });
  } catch (e) {
    logger.info(
      `failed to upload mp3 for track [${track.track_id}] | file location: [${filePath}]`
    );
    saveMp3File(track, filePath, retryCount + 1);
  }
}

function buildLocalDownloadUrl(filePath) {
  const fileName = Path.basename(filePath);
  return `${MUSIC_DL_CDN_HOST}/media/${fileName}`;
}

module.exports = { getTrackCDN };
