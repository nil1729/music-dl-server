/*jshint esversion: 11 */

const ErrorResponse = require('../../utils/ErrorResponse.class');
const ErrorMessage = require('../../utils/ErrorMessage.enum.json');
const { SPOTIFY_RESOURCE_TYPE } = require('../../../../config/spotify/constant');
const LocalTrack = require('../../model/Track');
const logger = require('../../../../config/logger');
const {
  MAX_RETRY: MAX_RETRY_FOR_SAVING,
  MUSIC_DL_CDN_HOST,
  DOWNLOAD_PATH_M4A,
  DOWNLOAD_PATH_MP3,
  CACHE_KEY_PREFIX,
} = require('../../../../config/env');
const { getLocalMetadata } = require('../metadata');
const {
  getYtSearchResults,
  getYtMp4Cdn,
  downloadFromUrl,
  convertMp4ToMp3,
  uploadToMusicDlStorage,
  getYtAudioByMusicDlConverter,
} = require('../../../downloader');
const Path = require('path');
const MusicDlCache = require('../../../../config/cache');
const { saveAlbumMeta } = require('../metadata');

/**
 *
 * @param {string} trackId
 * @returns
 */
async function getTrackCDN(trackId) {
  const trackDoc = await getLocalMetadata(SPOTIFY_RESOURCE_TYPE.TRACK, trackId);
  if (!trackDoc) {
    return sendTrackFromCache(trackId);
  }
  if (trackDoc.music_dl_downloaded) {
    return sendAudioCdnFromLocal(trackDoc);
  }
  return downloadAndSendCDN(trackDoc);
}

/**
 *
 * @param {string} trackId
 */
async function sendTrackFromCache(trackId) {
  const trackCacheKey = CACHE_KEY_PREFIX.TRACK + trackId;
  const trackMeta = await MusicDlCache.getCache(trackCacheKey);
  if (!trackMeta) {
    throw new ErrorResponse(ErrorMessage.service_unavailable);
  }
  return downloadAndSendCDN(trackMeta, saveAudioFileFromCacheMeta);
}

/**
 *
 * @param {object} track
 */
function sendAudioCdnFromLocal(track) {
  if (track.music_dl_cdn) return track.music_dl_cdn;
  uploadAndSaveAudioFile(track._id);
  return buildLocalDownloadUrl(track.music_dl_storage_meta.local_id);
}

/**
 *
 * @param {object} track
 * @returns
 */
async function downloadAndSendCDN(track, saveFn = saveAudioFile) {
  const searchKeyword = `${track.name} ${track.artists[0].name}`;
  const maxDuration = track.duration_ms + 60 * 1000;
  const results = await getYtSearchResults(searchKeyword, maxDuration);
  if (results.length === 0) {
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  const audioFilePath = await getAudioFile(results[0].url, track.track_id);
  saveFn(track, audioFilePath);
  return buildLocalDownloadUrl(audioFilePath);
}

/**
 *
 * @param {string} ytUrl
 * @param {string} trackId
 */
async function getAudioFile(ytUrl, trackId) {
  const m4aPath = await getAudioM4a(ytUrl, trackId);
  if (!m4aPath) {
    logger.warn(`failed to download [m4a] for track [${trackId}] and YT [${ytUrl}]`);
    return getAudioMp3(ytUrl, trackId);
  }
  return m4aPath;
}

/**
 *
 * @param {string} ytUrl
 * @param {string} trackId
 * @deprecated
 *
 */
async function getAudioMp3(ytUrl, trackId) {
  const mp4CDN = await getYtMp4Cdn(ytUrl);
  if (!mp4CDN) {
    logger.warn(`cdn not found for track [${trackId}] and YT [${ytUrl}]`);
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  const mp4FilePath = await downloadFromUrl(mp4CDN, '.mp4');
  if (!mp4FilePath) {
    logger.warn(`mp4 download failed for track [${trackId}] and YT [${ytUrl}]`);
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  const mp3FilePath = await convertMp4ToMp3(mp4FilePath);
  if (!mp3FilePath) {
    logger.warn(`mp3 conversion failed for track [${trackId}] and YT [${ytUrl}]`);
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  return mp3FilePath;
}

async function getAudioM4a(ytUrl, trackId) {
  const m4aPath = await getYtAudioByMusicDlConverter(ytUrl);
  if (!m4aPath) {
    logger.warn(`audio download failed for track [${trackId}] and YT [${ytUrl}]`);
    throw new ErrorResponse(ErrorMessage.processing_failed);
  }
  return Path.resolve(DOWNLOAD_PATH_M4A, m4aPath).toString();
}

/**
 *
 * @param {string} track
 * @param {object} filePath
 */
async function saveAudioFileFromCacheMeta(trackMeta, filePath) {
  logger.info(`saving track meta from cache for track id: [${trackMeta.id}]`);
  await saveAlbumMeta(trackMeta.album.id);
  const localTrackDoc = await LocalTrack.findOne({ track_id: trackMeta.id });
  if (!localTrackDoc) {
    logger.error(`track meta not saved properly for track id: [${trackMeta.id}]`);
  }
  saveAudioFile(localTrackDoc, filePath);
}

/**
 *
 * @param {object} track
 * @param {string} filePath
 */
async function saveAudioFile(track, filePath) {
  logger.info(`saving audio file for track [${track.track_id}] at location [${filePath}]`);
  await saveLocalAudioFile(track, filePath);
  await uploadAndSaveAudioFile(track._id);
}

/**
 *
 * @param {object} track
 * @param {string} filePath
 * @param {number} retryCount
 * @returns
 */
async function saveLocalAudioFile(track, filePath, retryCount = MAX_RETRY_FOR_SAVING) {
  if (retryCount > MAX_RETRY_FOR_SAVING) {
    logger.warn(
      `max retry count exceeded for saving local audio for track [${track.track_id}] | file location: [${filePath}]`
    );
    return;
  }
  try {
    logger.info(`saving local audio file for track [${track.track_id}] at location [${filePath}]`);
    const fileId = Path.basename(filePath);
    const updatedDoc = {
      music_dl_downloaded: true,
      music_dl_storage_meta: {
        local_id: fileId,
      },
    };
    await LocalTrack.updateOne({ _id: track._id }, { $set: updatedDoc });
  } catch (e) {
    console.debug(e);
    logger.warn(
      `failed to save local audio for track [${track.track_id}] | file location: [${filePath}]`
    );
    saveAudioFile(track, filePath, retryCount + 1);
  }
}

async function uploadAndSaveAudioFile(localTrackId, retryCount = MAX_RETRY_FOR_SAVING) {
  const track = await LocalTrack.findOne({ _id: localTrackId });
  if (retryCount > MAX_RETRY_FOR_SAVING) {
    logger.warn(
      `max retry count exceeded for uploading audio for track [${track.track_id}] | file location: [${filePath}]`
    );
    return;
  }
  try {
    if (track.music_dl_downloaded && track.music_dl_cdn) {
      logger.info(
        `audio file exists for track [${track.track_id}] with fileId: [${track.music_dl_storage_meta.local_id}]`
      );
      return;
    }
    logger.info(
      `uploading audio file for track [${track.track_id}] at location [${track.music_dl_storage_meta.local_id}]`
    );
    const filePath = await getAudioFilePath(track.music_dl_storage_meta.local_id);
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
    console.debug(e);
    logger.warn(
      `failed to upload audio for track [${track.track_id}] | file location: [${filePath}]`
    );
    saveAudioFile(track, filePath, retryCount + 1);
  }
}

/**
 *
 * @param {string} filePath
 * @returns
 */
function buildLocalDownloadUrl(filePath) {
  const fileName = Path.basename(filePath);
  return `${MUSIC_DL_CDN_HOST}/media/${fileName}`;
}

/**
 *
 * @param {string} fileId
 */
function getAudioFilePath(fileId) {
  const fileExt = Path.extname(fileId);
  if (fileExt === '.m4a') {
    return Path.resolve(DOWNLOAD_PATH_M4A, fileId);
  } else if (fileExt === '.mp3') {
    return Path.resolve(DOWNLOAD_PATH_MP3, fileId);
  } else {
    throw new Error(ErrorMessage.unsupported_resource);
  }
}

module.exports = { getTrackCDN };
