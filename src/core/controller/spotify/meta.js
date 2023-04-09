/*jshint esversion: 11 */

const asyncHandler = require('../../middleware/request/asyncHandler');
const { getMetadata } = require('../../service/metadata');

/**
 *
 * @route [
 *  /api/spotify/metadata?link={link}
 * ]
 * @method GET
 *
 */
exports.getMetaHandler = asyncHandler(async (req, res, next) => {
  const { link } = req.query;
  const response = await getMetadata(link);
  return res.status(200).json(response);
});
