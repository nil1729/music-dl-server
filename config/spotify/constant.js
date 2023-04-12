exports.SPOTIFY_SHORT_LINK_DOMAIN = 'spotify.link';
exports.SPOTIFY_STANDARD_LINK_DOMAIN = 'open.spotify.com';
exports.SPOTIFY_RESOURCE_TYPE = {
  TRACK: 'track',
  PLAYLIST: 'playlist',
  ALBUM: 'album',
  SHOW: 'show',
  EPISODE: 'episode',
};
exports.SPOTIFY_TRACK_FETCH_LIMIT = 50;
exports.SPOTIFY_API = {
  GET_TRACK: (id) => `v1/tracks/${id}`,
  GET_ALBUM: (id) => `v1/albums/${id}`,
  GET_ARTIST: (id) => `v1/artists/${id}`,
  GET_PLAYLIST: (id) => `v1/playlists/${id}`,
  GET_PLAYLIST_TRACKS: (id, limit = 50, offset = 0) =>
    `v1/playlists/${id}/tracks?limit=${limit}&offset=${offset}`,
  GET_ALBUM_TRACKS: (id, limit = 50, offset = 0) =>
    `v1/albums/${id}/tracks?limit=${limit}&offset=${offset}`,
};
