/*jshint esversion: 11 */

const asyncHandler = require('../../middleware/request/asyncHandler');
const { getTrackCDN } = require('../../service/downloader');
const { trackIp } = require('../../service/ipTracker');

/**
 *
 * @route [
 *  /api/spotify/download/track/:trackId/
 * ]
 * @method GET
 *
 */
exports.trackDownloadHandler = asyncHandler(async (req, res, next) => {
  trackIp(req);
  const { trackId } = req.params;
  const downloadCdn = await getTrackCDN(trackId);
  return res.status(200).json({ download_cdn: downloadCdn });
});
