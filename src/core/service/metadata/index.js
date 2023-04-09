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
const { SPOTIFY_RESOURCE_TYPE } = require('../../../../config/spotify/config');
const LocalTrack = require('../../model/Track');
const LocalArtist = require('../../model/Artist');
const LocalAlbum = require('../../model/Album');
const LocalAlbumTrackMap = require('../../model/AlbumTrack');
const logger = require('../../../../config/logger');

/**
 *
 * @param {string} link
 * @returns
 */
async function getMetadata(link) {
  const processedLink = await getProcessedSpotifyLink(link);
  const spotifyResourceType = getSpotifyResourceType(processedLink);
  const resourceId = getResourceId(spotifyResourceType, processedLink);
  const cachedMeta = await getLocalMetadata(spotifyResourceType, resourceId);
  if (cachedMeta) {
    console.log('CACHE HIT');
  }
  const metadata = await getResourceMetadata(spotifyResourceType, resourceId);
  saveLocalMeta(spotifyResourceType, resourceId, metadata);
  return metadata;
}

/**
 *
 * @param {string} resourceType
 * @param {string} resourceId
 */
async function getLocalMetadata(resourceType, resourceId) {
  try {
    if (SPOTIFY_RESOURCE_TYPE.TRACK === resourceType) {
      return await LocalTrack.findOne({ track_id: resourceId }).populate([{ path: 'album' }]);
    } else {
      throw new ErrorMessage(ErrorMessage.service_unavailable, 503);
    }
  } catch (e) {
    return null;
  }
}

/**
 *
 * @param {string} resourceType
 * @param {string} resourceId
 * @param {object} data
 */
async function saveLocalMeta(resourceType, resourceId, data) {
  try {
    if (SPOTIFY_RESOURCE_TYPE.TRACK === resourceType) {
      saveTrackMeta(resourceId, null, data);
    } else {
      throw new ErrorMessage(ErrorMessage.service_unavailable, 503);
    }
  } catch (e) {
    return null;
  }
}

/**
 *
 * @param {string} trackId
 * @param {boolean} populated
 * @param {object} data
 */
async function saveTrackMeta(trackId, localAlbumId = null, data = {}) {
  logger.info(`saving track metadata locally for track id: [${trackId}]`);
  if (localAlbumId) {
    return new Promise(async (resolve, reject) => {
      try {
        const existingDoc = await LocalTrack.findOne({ track_id: trackId }, { _id: 1 });
        if (existingDoc) {
          return resolve(existingDoc._id.toString());
        }
        const trackMeta = await getTrackMetadata(trackId);
        const artistPromises = trackMeta.artists.map((i) => saveArtistMeta(i.id));
        const artistIdMapArray = await Promise.all(artistPromises);
        const trackDoc = {
          track_id: trackMeta.id,
          name: trackMeta.name,
          spotify_url: trackMeta.href,
          album: localAlbumId,
          artists: artistIdMapArray,
          duration: trackMeta.duration_ms,
          explicit: trackMeta.explicit,
          preview_url: trackMeta.preview_url,
          popularity: trackMeta.popularity,
        };
        const savedDoc = await LocalTrack.create(trackDoc);
        resolve(savedDoc.id);
      } catch (e) {
        reject(e);
      }
    });
  } else if (data) {
    saveAlbumMeta(data.album.id);
  } else {
    throw new Error(ErrorMessage.service_unavailable);
  }
}

/**
 *
 * @param {string} albumId
 * @param {boolean} populated
 * @param {object} data
 */
async function saveAlbumMeta(albumId, populated = false, data = {}) {
  logger.info(`saving album metadata locally for album id: [${albumId}]`);
  return new Promise(async (resolve, reject) => {
    try {
      const existingDoc = await LocalAlbum.findOne({ album_id: albumId }, { _id: 1 });
      if (existingDoc) {
        saveAlbumTrackMap(existingDoc._id.toString());
        return resolve(existingDoc._id.toString());
      }
      const albumMeta = populated ? data : await getAlbumMetadata(albumId);
      const artistPromises = albumMeta.artists.map((i) => saveArtistMeta(i.id));
      const artistIdMapArray = await Promise.all(artistPromises);
      const albumDoc = {
        album_id: albumMeta.id,
        name: albumMeta.name,
        spotify_url: albumMeta.href,
        popularity: albumMeta.popularity,
        release_date: albumMeta.release_date,
        label: albumMeta.label,
        artists: artistIdMapArray,
        copyrights: albumMeta.copyrights,
        genres: albumMeta.genres,
        images: albumMeta.images,
        track_count: albumMeta.tracks.total,
      };
      const savedDoc = await LocalAlbum.create(albumDoc);
      saveAlbumTrackMap(savedDoc.id);
      resolve(savedDoc.id);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 *
 * @param {*} artistId
 * @param {*} populated
 * @param {*} data
 */
async function saveArtistMeta(artistId) {
  logger.info(`saving artist metadata locally for artist id: [${artistId}]`);
  return new Promise(async (resolve, reject) => {
    try {
      const existingDoc = await LocalArtist.findOne({ artist_id: artistId }, { _id: 1 });
      if (existingDoc) {
        return resolve(existingDoc._id.toString());
      }
      const artistMeta = await getArtistMetadata(artistId);
      const artistDoc = {
        artist_id: artistMeta.id,
        name: artistMeta.name,
        spotify_url: artistMeta.href,
        genres: artistMeta.genres,
        images: artistMeta.images,
        popularity: artistMeta.popularity,
      };
      const savedDoc = await LocalArtist.create(artistDoc);
      resolve(savedDoc.id);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 *
 * @param {string} albumId
 */
async function saveAlbumTrackMap(localAlbumId) {
  const albumDoc = await LocalAlbum.findById(localAlbumId);
  if (!albumDoc) {
    throw new Error(ErrorMessage.processing_failed);
  }
  const albumMeta = await getAlbumMetadata(albumDoc.album_id);
  logger.info(`saving artist-track map locally for artist id: [${albumMeta.id}]`);
  const existingLocalAlbumTrackMap = await LocalAlbumTrackMap.find({ album_id: localAlbumId });
  if (albumMeta.tracks.total > existingLocalAlbumTrackMap.length) {
    const allTracksMeta = await getAlbumTracksMeta(albumDoc.album_id);
    const trackPromises = allTracksMeta
      .filter((k) => existingLocalAlbumTrackMap.every((d) => d.track_id !== k))
      .map((i) => saveTrackMeta(i.id, localAlbumId));
    const trackId = await Promise.all(trackPromises);
    const albumTrackMapDocs = trackId.map((i) => {
      return {
        track_id: i,
        album_id: localAlbumId,
      };
    });
    const savedDocs = await LocalAlbumTrackMap.insertMany(albumTrackMapDocs);
    logger.info(`saved artist-track map locally | total count: [${savedDocs.length}]`);
  }
}

module.exports = { getMetadata };
