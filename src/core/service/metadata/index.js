/*jshint esversion: 11 */

const ErrorResponse = require('../../utils/ErrorResponse.class');
const ErrorMessage = require('../../utils/ErrorMessage.enum.json');
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
const {
  MAX_RETRY: MAX_RETRY_FOR_SAVING,
  PLAYLIST_TRACK_SAVING_CHUNK_SIZE,
  MAX_SLEEP_DURATION,
} = require('../../../../config/env');

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
    return sendResponseFromLocal(spotifyResourceType, cachedMeta);
  }
  const metadata = await getResourceMetadata(spotifyResourceType, resourceId);
  saveLocalMeta(spotifyResourceType, resourceId, metadata);
  return sendResponseFromSpotify(spotifyResourceType, metadata);
}

/**
 *
 * @param {object} data
 * @returns
 */
function sendLocalTrackResponse(data) {
  const response = {
    type: SPOTIFY_RESOURCE_TYPE.TRACK,
    id: data.track_id,
    name: data.name,
    duration: data.duration,
    explicit: data.explicit,
    preview_url: data.preview_url,
    popularity: data.popularity,
    spotify_url: data.spotify_app_url,
    images: data.album.images,
    artists: data.artists.map((a) => {
      return {
        id: a.artist_id,
        name: a.name,
        spotify_url: a.spotify_app_url,
      };
    }),
    album: {
      id: data.album.album_id,
      name: data.album.name,
      spotify_url: data.album.spotify_app_url,
      release_date: data.album.release_date,
      images: data.album.images,
    },
    music_dl_downloaded: data.music_dl_downloaded,
    music_dl_cdn: data.music_dl_cdn,
    music_dl_hit: data.music_dl_hit,
    music_dl_download_count: data.music_dl_download_count,
  };
  return response;
}

/**
 *
 * @param {data} data
 */
function sendSpotifyTrackResponse(data) {
  const response = {
    type: SPOTIFY_RESOURCE_TYPE.TRACK,
    id: data.id,
    name: data.name,
    duration: data.duration_ms,
    explicit: data.explicit,
    preview_url: data.preview_url,
    popularity: data.popularity,
    spotify_url: data.external_urls.spotify,
    images: data.album.images,
    artists: data.artists.map((a) => {
      return {
        id: a.id,
        name: a.name,
        spotify_url: a.external_urls.spotify,
      };
    }),
    album: {
      id: data.album.id,
      name: data.album.name,
      spotify_url: data.album.external_urls.spotify,
      release_date: data.album.release_date,
      images: data.album.images,
    },
    music_dl_downloaded: false,
    music_dl_cdn: null,
    music_dl_hit: 0,
    music_dl_download_count: 0,
  };
  return response;
}

/**
 *
 * @param {object} data
 * @returns
 */
function sendLocalAlbumResponse(data) {
  const response = {
    type: SPOTIFY_RESOURCE_TYPE.ALBUM,
    id: data.album_id,
    copyrights: data.copyrights,
    genres: data.genres,
    images: data.images,
    spotify_url: data.spotify_app_url,
    label: data.label,
    name: data.name,
    popularity: data.popularity,
    release_date: data.release_date,
    total_tracks: data.track_count,
    artists: data.artists.map((a) => {
      return {
        id: a.artist_id,
        name: a.name,
        spotify_url: a.spotify_app_url,
      };
    }),
    tracks: data.tracks.map((t) => {
      return {
        artists: t.artists.map((a) => {
          return {
            id: a.artist_id,
            name: a.name,
            spotify_url: a.spotify_app_url,
          };
        }),
        id: t.track_id,
        name: t.name,
        duration: t.duration,
        explicit: t.explicit,
        preview_url: t.preview_url,
        spotify_url: t.spotify_app_url,
        music_dl_downloaded: t.music_dl_downloaded,
        music_dl_cdn: t.music_dl_cdn,
      };
    }),
    music_dl_hit: 0,
  };
  return response;
}

/**
 *
 * @param {data} data
 */
function sendSpotifyAlbumResponse(data) {
  const response = {
    type: SPOTIFY_RESOURCE_TYPE.ALBUM,
    id: data.id,
    copyrights: data.copyrights,
    genres: data.genres,
    images: data.images,
    spotify_url: data.external_urls.spotify,
    label: data.label,
    name: data.name,
    popularity: data.popularity,
    release_date: data.release_date,
    total_tracks: data.total_tracks,
    artists: data.artists.map((a) => {
      return {
        id: a.id,
        name: a.name,
        spotify_url: a.external_urls.spotify,
      };
    }),
    tracks: data.tracks.items.map((t) => {
      return {
        artists: t.artists.map((a) => {
          return {
            id: a.id,
            name: a.name,
            spotify_url: a.external_urls.spotify,
          };
        }),
        id: t.id,
        name: t.name,
        duration: t.duration_ms,
        explicit: t.explicit,
        preview_url: t.preview_url,
        spotify_url: t.external_urls.spotify,
        music_dl_downloaded: false,
        music_dl_cdn: null,
      };
    }),
    music_dl_hit: 0,
  };
  return response;
}

/**
 *
 * @param {data} data
 */
function sendSpotifyPlaylistResponse(data) {
  const response = {
    type: SPOTIFY_RESOURCE_TYPE.PLAYLIST,
    id: data.id,
    description: data.description,
    images: data.images,
    spotify_url: data.external_urls.spotify,
    follower_count: data.followers.total,
    name: data.name,
    tracks: data.tracks.items
      .filter((k) => k.track?.id)
      .map((t) => {
        return {
          artists: t.track.artists.map((a) => {
            return {
              id: a.id,
              name: a.name,
              spotify_url: a.external_urls.spotify,
            };
          }),
          album: {
            id: t.track.album.id,
            name: t.track.album.name,
            spotify_url: t.track.album.external_urls.spotify,
            release_date: t.track.album.release_date,
            images: t.track.album.images,
          },
          added_at: t.added_at,
          id: t.track.id,
          name: t.track.name,
          duration: t.track.duration_ms,
          explicit: t.track.explicit,
          preview_url: t.track.preview_url,
          spotify_url: t.track.external_urls.spotify,
          music_dl_downloaded: false,
          music_dl_cdn: null,
        };
      }),
    music_dl_hit: 0,
  };
  return response;
}

/**
 *
 * @param {string} resourceType
 * @param {object} data
 */
function sendResponseFromLocal(resourceType, data) {
  if (SPOTIFY_RESOURCE_TYPE.TRACK === resourceType) {
    return sendLocalTrackResponse(data);
  } else if (SPOTIFY_RESOURCE_TYPE.ALBUM === resourceType) {
    return sendLocalAlbumResponse(data);
  } else {
    throw new ErrorResponse(ErrorMessage.service_unavailable, 503);
  }
}

/**
 *
 * @param {string} resourceType
 * @param {object} data
 */
function sendResponseFromSpotify(resourceType, data) {
  if (SPOTIFY_RESOURCE_TYPE.TRACK === resourceType) {
    return sendSpotifyTrackResponse(data);
  } else if (SPOTIFY_RESOURCE_TYPE.ALBUM === resourceType) {
    return sendSpotifyAlbumResponse(data);
  } else if (SPOTIFY_RESOURCE_TYPE.PLAYLIST === resourceType) {
    return sendSpotifyPlaylistResponse(data);
  } else {
    throw new ErrorResponse(ErrorMessage.service_unavailable, 503);
  }
}

/**
 *
 * @param {string} resourceType
 * @param {string} resourceId
 */
async function getLocalMetadata(resourceType, resourceId) {
  try {
    if (SPOTIFY_RESOURCE_TYPE.TRACK === resourceType) {
      return await LocalTrack.findOne({ track_id: resourceId }).populate([
        { path: 'album' },
        { path: 'artists' },
      ]);
    } else if (SPOTIFY_RESOURCE_TYPE.ALBUM === resourceType) {
      const albumDoc = await LocalAlbum.findOne({ album_id: resourceId }).populate({
        path: 'artists',
      });
      if (albumDoc) {
        const tracks = await LocalTrack.find({ album: albumDoc._id }).populate({ path: 'artists' });
        const clonedAlbumDoc = Object.assign({}, albumDoc._doc);
        clonedAlbumDoc.tracks = tracks;
        return clonedAlbumDoc;
      }
      return null;
    } else {
      throw new ErrorResponse(ErrorMessage.service_unavailable, 503);
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
    } else if (SPOTIFY_RESOURCE_TYPE.ALBUM === resourceType) {
      saveAlbumMeta(resourceId);
    } else if (SPOTIFY_RESOURCE_TYPE.PLAYLIST === resourceType) {
      savePlaylistTracks(resourceId, data);
    } else {
      throw new ErrorResponse(ErrorMessage.service_unavailable, 503);
    }
  } catch (e) {
    return null;
  }
}

/**
 *
 * @param {string} playlistId
 * @param {object} playlistMeta
 */
async function savePlaylistTracks(playlistId, playlistMeta) {
  logger.info(`saving playlist track metadata locally for playlist id: [${playlistId}]`);

  const albumSet = new Set();
  const musicTracks = playlistMeta.tracks.items.filter((k) => k.track?.id);
  musicTracks.forEach((m) => albumSet.add(m.track.album.id));

  const uniqueAlbumId = Array.from(albumSet.keys());
  const totalUniqueAlbumCount = uniqueAlbumId.length;

  let iterationCount = Math.ceil(totalUniqueAlbumCount / PLAYLIST_TRACK_SAVING_CHUNK_SIZE);
  let offset = 0;
  do {
    logger.info(
      `saving album chunk locally for playlist id: [${playlistId}] | iteration [${iterationCount}]`
    );
    const albumChunk = uniqueAlbumId.slice(offset, offset + PLAYLIST_TRACK_SAVING_CHUNK_SIZE);
    const albumChunkPromise = albumChunk.map((a) => saveAlbumMeta(a));
    await Promise.all(albumChunkPromise);
    offset += PLAYLIST_TRACK_SAVING_CHUNK_SIZE;
    iterationCount--;
    await sleep();
  } while (iterationCount > 0);
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
          spotify_api_url: trackMeta.href,
          spotify_app_url: trackMeta.external_urls.spotify,
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
async function saveAlbumMeta(
  albumId,
  populated = false,
  data = {},
  retryCount = MAX_RETRY_FOR_SAVING
) {
  if (retryCount > MAX_RETRY_FOR_SAVING) {
    logger.warn('max retry count exceeded for saving album');
    return;
  }
  logger.info(`saving album metadata locally for album id: [${albumId}]`);
  return new Promise(async (resolve, reject) => {
    try {
      const existingDoc = await LocalAlbum.findOne({ album_id: albumId }, { _id: 1 });
      if (existingDoc) {
        saveAlbumTrackMap(existingDoc._id.toString(), 0);
        return resolve(existingDoc._id.toString());
      }
      const albumMeta = populated ? data : await getAlbumMetadata(albumId);
      const artistPromises = albumMeta.artists.map((i) => saveArtistMeta(i.id));
      const artistIdMapArray = await Promise.all(artistPromises);
      const albumDoc = {
        album_id: albumMeta.id,
        name: albumMeta.name,
        spotify_api_url: albumMeta.href,
        spotify_app_url: albumMeta.external_urls.spotify,
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
      saveAlbumTrackMap(savedDoc.id, 0);
      resolve(savedDoc.id);
    } catch (e) {
      return saveAlbumMeta(albumId, false, null, retryCount + 1);
    }
  });
}

/**
 *
 * @param {*} artistId
 * @param {*} populated
 * @param {*} data
 */
async function saveArtistMeta(artistId, retryCount = MAX_RETRY_FOR_SAVING) {
  if (retryCount > MAX_RETRY_FOR_SAVING) {
    logger.warn('max retry count exceeded for saving artist');
    return;
  }
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
        spotify_app_url: artistMeta.external_urls.spotify,
        spotify_api_url: artistMeta.href,
        genres: artistMeta.genres,
        images: artistMeta.images,
        popularity: artistMeta.popularity,
      };
      const savedDoc = await LocalArtist.create(artistDoc);
      resolve(savedDoc.id);
    } catch (e) {
      logger.error(e.message);
      logger.warn(`failed to save artist metadata for artist id: [${artistId}]`);
      return saveArtistMeta(artistId, retryCount - 1);
    }
  });
}

/**
 *
 * @param {string} albumId
 */
async function saveAlbumTrackMap(localAlbumId, retryCount) {
  if (retryCount > MAX_RETRY_FOR_SAVING) {
    logger.warn('max retry count exceeded for saving album track map');
    return;
  }
  try {
    const albumDoc = await LocalAlbum.findById(localAlbumId);
    if (!albumDoc) {
      throw new Error(ErrorMessage.processing_failed);
    }
    const albumMeta = await getAlbumMetadata(albumDoc.album_id);
    logger.info(`saving album-track map locally for album id: [${albumMeta.id}]`);
    const existingLocalAlbumTrackMap = await LocalAlbumTrackMap.find({ album_id: localAlbumId });
    if (albumMeta.tracks.total > existingLocalAlbumTrackMap.length) {
      const allTracksMeta =
        albumMeta.tracks.total > albumMeta.tracks.limit
          ? await getAlbumTracksMeta(albumDoc.album_id)
          : albumMeta.tracks.items;
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
      logger.info(`saved album-track map locally | total count: [${savedDocs.length}]`);
    }
  } catch (e) {
    logger.error(e.message);
    logger.warn(`failed to save album track map for localAlbumId [${localAlbumId}]`);
    return saveAlbumTrackMap(localAlbumId, retryCount + 1);
  }
}

async function sleep(duration = MAX_SLEEP_DURATION) {
  logger.debug(`sleeping for [${Math.floor(duration / 1000)}] second(s)`);
  return new Promise((resolve) => setTimeout(resolve, duration));
}

module.exports = { getMetadata, getLocalMetadata };
