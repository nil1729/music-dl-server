module.exports = {
  DEV_ENV: 'development',
  CORE_SERVICE_PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
  MUSIC_DL_PRIMARY_DB: process.env.MUSIC_DL_PRIMARY_DB,
  SPOTIFY_ACCESS_TOKEN_URL: process.env.SPOTIFY_ACCESS_TOKEN_URL,
  TMP_DIRECTORY_PATH: process.env.TMP_DIRECTORY_PATH,
  SPOTIFY_ACCESS_TOKEN_FILE: process.env.SPOTIFY_ACCESS_TOKEN_FILE,
  ACCESS_TOKEN_REFRESH_INTERVAL: process.env.ACCESS_TOKEN_REFRESH_INTERVAL,
  MAX_RETRY: Number(process.env.MAX_RETRY),
  SPOTIFY_API_TIMEOUT: Number(process.env.SPOTIFY_API_TIMEOUT),
  MAX_API_TIMEOUT: Number(process.env.MAX_API_TIMEOUT),
  MUSIC_MAX_DURATION: Number(process.env.MUSIC_MAX_DURATION),
  YT_MP4_CONVERTER_URL: process.env.YT_MP4_CONVERTER_URL,
  YT_GOOGLE_CDN_TOKEN: process.env.YT_GOOGLE_CDN_TOKEN,
  YT_MP4_QUALITY: Number(process.env.YT_MP4_QUALITY),
  DOWNLOAD_PATH_MP4: process.env.DOWNLOAD_PATH_MP4,
  DOWNLOAD_PATH_MP3: process.env.DOWNLOAD_PATH_MP3,
  DOWNLOAD_PATH_M4A: process.env.DOWNLOAD_PATH_M4A,
  MUSIC_DL_STORAGE_ACCESS_TOKEN: process.env.MUSIC_DL_STORAGE_ACCESS_TOKEN,
  MUSIC_DL_STORAGE_USER: process.env.MUSIC_DL_STORAGE_USER,
  MUSIC_DL_STORAGE_USER_EMAIL: process.env.MUSIC_DL_STORAGE_USER_EMAIL,
  MUSIC_DL_BUCKET_NAME: process.env.MUSIC_DL_BUCKET_NAME,
  MUSIC_DL_STORAGE_HOST: process.env.MUSIC_DL_STORAGE_HOST,
  MUSIC_DL_CDN_HOST: process.env.MUSIC_DL_CDN_HOST,
  MUSIC_DL_YT_DOWNLOADER_URL: process.env.MUSIC_DL_YT_DOWNLOADER_URL,
  MAX_TRACK_ALLOWED_FOR_PLAYLIST: Number(process.env.MAX_TRACK_ALLOWED_FOR_PLAYLIST),
  SPOTIFY_PLAYLIST_TRACK_OFFSET_START: Number(process.env.SPOTIFY_PLAYLIST_TRACK_OFFSET_START),
  PLAYLIST_TRACK_SAVING_CHUNK_SIZE: Number(process.env.PLAYLIST_TRACK_SAVING_CHUNK_SIZE),
  SPOTIFY_API_HOST: process.env.SPOTIFY_API_HOST,
  SPOTIFY_CACHE_TTL: {
    TRACK: Number(process.env.SPOTIFY_TRACK_CACHE_TTL_DURATION),
    ALBUM: Number(process.env.SPOTIFY_ALBUM_CACHE_TTL_DURATION),
    PLAYLIST: Number(process.env.SPOTIFY_PLAYLIST_CACHE_TTL_DURATION),
  },
  MAX_CACHE_TTL: Number(process.env.MAX_CACHE_TTL),
  MAX_SLEEP_DURATION: Number(process.env.MAX_SLEEP_DURATION),
  CACHE_KEY_PREFIX: {
    TRACK: process.env.SPOTIFY_TRACK_CACHE_KEY_PREFIX,
    ALBUM: process.env.SPOTIFY_ALBUM_CACHE_KEY_PREFIX,
    PLAYLIST: process.env.SPOTIFY_PLAYLIST_CACHE_KEY_PREFIX,
  },
  RABBIT_MQ_URL: process.env.RABBIT_MQ_URL,
  IP_TRACKER_QUEUE: process.env.IP_TRACKER_QUEUE,
  IP_TRACKER_API: process.env.IP_TRACKER_API,
};
