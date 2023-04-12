const { getAuthenticatedResponse } = require('../axios');
const { SPOTIFY_API_HOST, SPOTIFY_CACHE_TTL } = require('../env');
const { SPOTIFY_API, SPOTIFY_RESOURCE_TYPE } = require('./constant');
const logger = require('../logger');
const MusicDlCache = require('../cache');

class MusicDlSpotifyApi {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  /**
   *
   * @param {string} trackId
   */
  async getTrack(trackId) {
    return this.getData(SPOTIFY_API.GET_TRACK(trackId));
  }

  /**
   *
   * @param {string} albumId
   */
  async getAlbum(albumId) {
    return this.getData(SPOTIFY_API.GET_ALBUM(albumId));
  }

  /**
   *
   * @param {string} albumId
   */
  async getAlbumTracks(albumId, { limit = 50, offset = 0 }) {
    return this.getData(SPOTIFY_API.GET_ALBUM_TRACKS(albumId, limit, offset));
  }

  /**
   *
   * @param {string} playlistId
   */
  async getPlaylist(playlistId) {
    return this.getData(SPOTIFY_API.GET_PLAYLIST(playlistId));
  }

  /**
   *
   * @param {string} playlistId
   */
  async getPlaylistTracks(playlistId, { limit = 50, offset = 0 }) {
    return this.getData(SPOTIFY_API.GET_PLAYLIST_TRACKS(playlistId, limit, offset));
  }

  /**
   *
   * @param {string} artistId
   */
  async getArtist(artistId) {
    return this.getData(SPOTIFY_API.GET_ARTIST(artistId));
  }

  /**
   *
   * @param {object} apiRoute
   * @returns {object}
   */
  async getData(apiRoute) {
    const cachedData = await this.getDataFromCache(apiRoute);
    if (cachedData) {
      return this.sendResponse(cachedData);
    }
    return this.getDataFromSpotify(apiRoute);
  }

  /**
   *
   * @param {object} apiRoute
   * @returns {object}
   */
  async getDataFromSpotify(apiRoute) {
    logger.info(`getting data from spotify api [${apiRoute}]`);
    const responseData = await getAuthenticatedResponse(this.getApiUrl(apiRoute), this.accessToken);
    this.saveDataOnCache(apiRoute, responseData);
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
   * @returns {string}
   */
  getApiUrl(apiRoute) {
    return [SPOTIFY_API_HOST, apiRoute].join('/');
  }

  /**
   *
   * @param {string} apiRoute
   */
  parseResourceType(apiRoute) {
    return Object.keys(SPOTIFY_RESOURCE_TYPE).find((i) => apiRoute.includes(i.toLowerCase()));
  }

  /**
   *
   * @param {string} apiRoute
   */
  async getDataFromCache(apiRoute) {
    logger.info(`getting data from cache [${apiRoute}]`);
    return MusicDlCache.getCache(apiRoute);
  }

  /**
   *
   * @param {string} apiRoute
   * @param {object} data
   */
  async saveDataOnCache(apiRoute, data) {
    const resourceType = this.parseResourceType(apiRoute);
    if (resourceType === SPOTIFY_RESOURCE_TYPE.PLAYLIST) {
      MusicDlCache.setCache(apiRoute, data, SPOTIFY_CACHE_TTL.PLAYLIST);
    } else {
      MusicDlCache.setCache(apiRoute, data);
    }
  }
}

module.exports = MusicDlSpotifyApi;
