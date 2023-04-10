/*jshint esversion: 11 */
const Fs = require('fs');
const { filesize: FileSize } = require('filesize');
const Path = require('path');
const {
  MUSIC_DL_STORAGE_ACCESS_TOKEN,
  MUSIC_DL_STORAGE_USER,
  MUSIC_DL_STORAGE_USER_EMAIL,
  MUSIC_DL_BUCKET_NAME,
  MUSIC_DL_STORAGE_HOST,
} = require('../env');
const { sendCustomAxiosRequest } = require('../axios');

class MusicDlStorage {
  constructor() {
    this.headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: 'Bearer ' + MUSIC_DL_STORAGE_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    };
    this.committer = {
      name: MUSIC_DL_STORAGE_USER,
      email: MUSIC_DL_STORAGE_USER_EMAIL,
    };
    this.bucket = MUSIC_DL_BUCKET_NAME;
    this.host = MUSIC_DL_STORAGE_HOST;
  }

  /**
   *
   * @param {string} fileBuffer
   * @param {string} storagePath
   * @param {string} localFilePath
   */
  async upload(storagePath, localFilePath) {
    const payload = {
      message: this.getFileStat(localFilePath),
      committer: this.committer,
      content: this.getBase64(localFilePath),
    };
    const storageUrl = this.getStorageUrl(storagePath, localFilePath);
    const data = await sendCustomAxiosRequest('PUT', storageUrl, payload, this.headers);
    return {
      viewUrl: data.content.html_url,
      apiUrl: data.content.url,
      cdnUrl: data.content.download_url,
      fileId: this.getFileName(localFilePath),
    };
  }

  getStorageUrl(storagePath, localFilePath) {
    return [this.host, this.bucket, storagePath, this.getFileName(localFilePath)].join('/');
  }

  getFileName(filePath) {
    return Path.basename(filePath);
  }

  getBase64(filePath) {
    const fileBuffer = Fs.readFileSync(Path.resolve(filePath));
    const base64String = fileBuffer.toString('base64');
    return base64String;
  }

  getFileStat(filePath) {
    const { size } = Fs.statSync(filePath);
    const readableFileSize = FileSize(size);
    return `File Size: [${readableFileSize}]`;
  }
}

module.exports = MusicDlStorage;
