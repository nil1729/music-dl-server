/*jshint esversion: 11 */

const YtSearch = require('yt-search');
const { sendAxiosRequest } = require('../../config/axios');
const {
  MUSIC_MAX_DURATION,
  YT_MP4_CONVERTER_URL,
  YT_GOOGLE_CDN_TOKEN,
  YT_MP4_QUALITY,
  DOWNLOAD_PATH_MP3,
  DOWNLOAD_PATH_MP4,
  DEV_ENV,
} = require('../../config/env');
const Path = require('path');
const Axios = require('axios');
const fs = require('fs');
const FfmpegCommand = require('fluent-ffmpeg');
const logger = require('../../config/logger');
const MusicDlStorage = require('../../config/storage');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// for development only
if (process.env.NODE_ENV === DEV_ENV) {
  FfmpegCommand.setFfmpegPath(ffmpegPath);
}

/**
 *
 * @param {string} searchKeyword
 * @param {number} maxDurationMs
 * @returns
 */
async function getYtSearchResults(searchKeyword, maxDurationMs = MUSIC_MAX_DURATION) {
  logger.info(
    `searching yt for track [${searchKeyword}] with max duration [${Math.ceil(
      maxDurationMs / 1000
    )}s]`
  );
  const response = await YtSearch(searchKeyword);
  return response.videos.filter((v) => v.duration.seconds * 1000 < maxDurationMs).slice(0, 10);
}

/**
 *
 * @param {string} ytUrl
 */
async function getYtMp4Cdn(ytUrl) {
  logger.info(`searching mp4 cdn for yt video: [${ytUrl}]`);
  const data = await sendAxiosRequest(YT_MP4_CONVERTER_URL, { url: ytUrl });
  const mp4Cdn = data.url
    .filter((u) => !u.no_audio)
    .filter((u) => {
      const cdnUrl = new URL(u.url);
      return cdnUrl.host.includes(YT_GOOGLE_CDN_TOKEN);
    })
    .find((u) => (u.qualityNumber = YT_MP4_QUALITY))?.url;
  return mp4Cdn;
}

/**
 *
 * @param {string} url
 * @param {string} ext
 */
async function downloadFromUrl(url, ext) {
  logger.info(`downloading mp4 from cdn: [${url}]`);
  const downloadPath = getFilePath(ext);
  return new Promise(async function (resolve, reject) {
    const response = await Axios.get(url, { responseType: 'stream' });
    const fsWriter = fs.createWriteStream(downloadPath);
    response.data.pipe(fsWriter);
    fsWriter.on('finish', function () {
      resolve(downloadPath);
    });
    fsWriter.on('error', function () {
      resolve(null);
    });
  });
}

/**
 *
 * @param {string} mp4File
 */
async function convertMp4ToMp3(mp4File) {
  return new Promise(function (resolve, reject) {
    const mp3FilePath = getFilePath('.mp3');
    logger.info(`converting mp4 [${mp4File}] to mp3 [${mp3FilePath}]`);
    FfmpegCommand(mp4File)
      .toFormat('mp3')
      .save(mp3FilePath)
      .on('end', function () {
        resolve(mp3FilePath);
      })
      .on('error', function (e) {
        console.debug('FFMPEG ERROR ::: ', e);
        resolve(null);
      });
  });
}

function getRandomFileName(ext) {
  const rnd = Math.random().toString();
  const currentTime = new Date().getTime().toString();
  return currentTime + rnd + ext;
}

function getFilePath(ext) {
  const fileName = getRandomFileName(ext);
  if (ext === '.mp4') {
    return Path.resolve(DOWNLOAD_PATH_MP4, fileName);
  } else if (ext === '.mp3') {
    return Path.resolve(DOWNLOAD_PATH_MP3, fileName);
  }
}

/**
 *
 * @param {*} fileId
 * @param {*} localFilePath
 */
async function uploadToMusicDlStorage(fileId, localFilePath) {
  logger.info(`uploading [${localFilePath}] to music-dl storage`);
  const dlStorage = new MusicDlStorage();
  const storageMeta = await dlStorage.upload(fileId, localFilePath);
  return storageMeta;
}

module.exports = {
  getYtSearchResults,
  getYtMp4Cdn,
  downloadFromUrl,
  convertMp4ToMp3,
  uploadToMusicDlStorage,
};
