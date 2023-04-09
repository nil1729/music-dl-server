const express = require('express');
const router = express.Router();
const { trackDownloadHandler } = require('../../controller/spotify/download');

router.route('/track/:trackId').get(trackDownloadHandler);

module.exports = router;
