const { getAuthenticatedResponse } = require('../axios');
const { SPOTIFY_API_HOST } = require('../env');
const { SPOTIFY_API } = require('./constant');
const logger = require('../logger');

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

  async getData(apiRoute) {
    logger.info(`getting data from spotify api [${apiRoute}]`);
    const responseData = await getAuthenticatedResponse(this.getApiUrl(apiRoute), this.accessToken);
    return { body: responseData };
  }

  /**
   *
   * @param {string} apiRoute
   * @returns {string}
   */
  getApiUrl(apiRoute) {
    return [SPOTIFY_API_HOST, apiRoute].join('/');
  }
}

module.exports = MusicDlSpotifyApi;
