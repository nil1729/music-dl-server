/*jshint esversion: 11 */

const ErrorResponse = require('../../utils/ErrorResponse.class');
const SuccessResponse = require('../../utils/SuccessResponse.class');
const ErrorMessage = require('../../utils/ErrorMessage.enum.json');
const validator = require('validator');
const {
  getProcessedSpotifyLink,
  getSpotifyResourceType,
  getResourceMetadata,
} = require('../spotify');

async function getMetadata(link) {
  const processedLink = await getProcessedSpotifyLink(link);
  const spotifyResourceType = getSpotifyResourceType(processedLink);
  const metadata = await getResourceMetadata(spotifyResourceType, processedLink);
  return spotifyResourceType;
}

module.exports = { getMetadata };
