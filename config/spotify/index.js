/*jshint esversion: 11 */

const SpotifyWebApi = require('spotify-web-api-node');
const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_ACCESS_TOKEN_URL,
  TMP_DIRECTORY_PATH,
  SPOTIFY_ACCESS_TOKEN_FILE,
  ACCESS_TOKEN_REFRESH_INTERVAL,
} = require('../env');
const Axios = require('axios');
const querystring = require('querystring');
const logger = require('../logger');
const fs = require('fs');
const path = require('path');

function getSpotifyApiClient() {
  const SpotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI,
  });
  const accessToken = getAccessToken();
  SpotifyApi.setAccessToken(accessToken);
  return SpotifyApi;
}

function getAccessToken() {
  const accessTokenContent = fs
    .readFileSync(path.resolve(TMP_DIRECTORY_PATH, SPOTIFY_ACCESS_TOKEN_FILE))
    .toString('utf-8');
  const accessTokenJson = JSON.parse(accessTokenContent);
  return accessTokenJson.token;
}

async function getAccessTokenFromSpotify() {
  try {
    const response = await Axios.post(
      SPOTIFY_ACCESS_TOKEN_URL,
      querystring.stringify({
        grant_type: 'client_credentials',
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  } catch (e) {
    return getAccessTokenFromSpotify();
  }
}

function getExistingToken() {
  try {
    const currentTime = new Date();
    const accessTokenContent = fs
      .readFileSync(path.resolve(TMP_DIRECTORY_PATH, SPOTIFY_ACCESS_TOKEN_FILE))
      .toString('utf-8');
    const accessTokenJson = JSON.parse(accessTokenContent);
    const expirationTime = new Date(accessTokenJson.expirationTime);
    if (Number(expirationTime - currentTime) / (1000 * 60) < 5) {
      return null;
    }
    return accessTokenJson.token;
  } catch (e) {
    return null;
  }
}

async function saveAccessToken(requestType) {
  const accessToken = getExistingToken();
  if (!accessToken || requestType === 'refresh') {
    const currentTime = new Date();
    const response = await getAccessTokenFromSpotify();
    const expirationTime = new Date(
      currentTime.setMinutes(currentTime.getMinutes() + 45)
    ).toISOString();
    const accessTokenJson = {
      token: response.access_token,
      expirationTime: expirationTime,
    };
    const content = JSON.stringify(accessTokenJson);
    fs.writeFileSync(path.resolve(TMP_DIRECTORY_PATH, SPOTIFY_ACCESS_TOKEN_FILE), content);
  } else {
    logger.info('spotify access token already exists');
  }
}

async function refreshAccessToken() {
  logger.info('spotify access token reset work started');
  await saveAccessToken('refresh');
  logger.info('spotify access token reset work completed');
}

async function initAccessTokenReloader() {
  saveAccessToken('init');
  setInterval(refreshAccessToken, Number(ACCESS_TOKEN_REFRESH_INTERVAL));
}

module.exports = { initAccessTokenReloader, getSpotifyApiClient };
